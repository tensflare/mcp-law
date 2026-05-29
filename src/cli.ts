#!/usr/bin/env node
import { Command } from 'commander'
import chalk from 'chalk'
import inquirer from 'inquirer'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { scaffoldProject } from './scaffold/index.js'
import { TEMPLATES, getTemplate, listTemplates } from './scaffold/templates.js'
import type { ScaffoldConfig } from './scaffold/index.js'
import { searchServers, listServers, validateServerConfig, getServerById } from './registry/index.js'
import { getJurisdiction, listJurisdictions, searchJurisdictions } from './schemas/jurisdiction.js'
import { JURISDICTIONS } from './schemas/index.js'

const pkg = JSON.parse(
  fs.readFileSync(new URL('../package.json', import.meta.url), 'utf-8')
)

const program = new Command()

program
  .name('mcp-law')
  .description('Legal Tools for the Agentic Era — scaffold and manage legal MCP servers')
  .version(pkg.version)

program.command('init')
  .description('Scaffold a new legal MCP server project')
  .argument('[name]', 'Project name (directory will be created)')
  .option('-t, --template <type>', 'Template type: basic, jurisdiction-aware, contract-analysis')
  .option('-j, --jurisdiction <codes...>', 'Jurisdiction codes (e.g., US UK EU)')
  .option('--tools <tools...>', 'Tool names to include')
  .option('--author <author>', 'Author name')
  .option('--desc <description>', 'Project description')
  .action(async (name?: string, options?: { template?: string; jurisdiction?: string[]; tools?: string[]; author?: string; desc?: string }) => {
    try {
      let config: ScaffoldConfig

      if (name && options?.template) {
        config = {
          projectName: name,
          templateId: options.template,
          jurisdictionCodes: options.jurisdiction || [],
          tools: options.tools || [],
          author: options.author || '',
          description: options.desc || '',
        }

        const template = getTemplate(config.templateId)
        if (!template) {
          console.error(chalk.red(`Unknown template: ${config.templateId}`))
          console.error(chalk.yellow(`Available templates: ${listTemplates().map(t => t.id).join(', ')}`))
          process.exit(1)
        }

        if (config.tools.length === 0) {
          config.tools = template.defaultTools
        }
      } else {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'projectName',
            message: 'Project name:',
            default: name || 'my-legal-mcp-server',
            validate: (input: string) => input.trim().length > 0 || 'Project name is required',
          },
          {
            type: 'list',
            name: 'templateId',
            message: 'Select a template:',
            choices: listTemplates().map(t => ({ name: `${t.name} — ${t.description}`, value: t.id })),
          },
          {
            type: 'checkbox',
            name: 'jurisdictionCodes',
            message: 'Select jurisdictions (optional):',
            choices: Object.entries(JURISDICTIONS).map(([code, j]) => ({ name: `${code} — ${j.name}`, value: code })),
            when: (answers: Record<string, unknown>) => {
              const t = getTemplate(answers.templateId as string)
              return t?.supportsJurisdictions ?? false
            },
          },
          {
            type: 'input',
            name: 'author',
            message: 'Author:',
            default: '',
          },
          {
            type: 'input',
            name: 'description',
            message: 'Project description:',
            default: '',
          },
        ])

        const template = getTemplate(answers.templateId as string)
        const tools = answers.jurisdictionCodes
          ? [...(template?.defaultTools || [])]
          : (template?.defaultTools || [])

        config = {
          projectName: answers.projectName as string,
          templateId: answers.templateId as string,
          jurisdictionCodes: (answers.jurisdictionCodes as string[]) || [],
          tools,
          author: (answers.author as string) || '',
          description: (answers.description as string) || '',
        }
      }

      const result = scaffoldProject(config)
      console.log(chalk.green(`\n✓ Scaffolded project at: ${result.projectPath}`))
      console.log(chalk.cyan('\nFiles created:'))
      for (const file of result.filesCreated) {
        console.log(chalk.dim(`  ${file}`))
      }
      console.log(chalk.cyan('\nNext steps:'))
      console.log(chalk.white(`  cd ${config.projectName}`))
      console.log(chalk.white('  npm install'))
      console.log(chalk.white('  npm run dev'))
    } catch (err) {
      console.error(chalk.red('Error:'), err instanceof Error ? err.message : String(err))
      process.exit(1)
    }
  })

program.command('list')
  .description('List all known legal MCP servers in the registry')
  .action(() => {
    const servers = listServers()
    console.log(chalk.cyan(`\n${servers.length} legal MCP servers in registry:\n`))
    for (const s of servers) {
      const verified = s.verified ? chalk.green('✓ verified') : chalk.yellow('○ unverified')
      const audited = s.security_audited ? chalk.green('✓ audited') : chalk.dim('— not audited')
      console.log(`${chalk.bold(s.name)} ${chalk.dim(`(${s.id})`)}`)
      console.log(`  ${s.description}`)
      console.log(`  ${chalk.dim('Jurisdictions:')} ${s.jurisdiction.join(', ')}`)
      console.log(`  ${chalk.dim('Tools:')} ${s.tools.join(', ')}`)
      console.log(`  ${verified} | ${audited}`)
      console.log()
    }
  })

program.command('search')
  .description('Search the legal MCP server registry')
  .argument('<query>', 'Search query')
  .option('-j, --jurisdiction <code>', 'Filter by jurisdiction code')
  .option('-d, --domain <domain>', 'Filter by legal domain')
  .option('--verified', 'Only show verified servers')
  .action((query: string, options?: { jurisdiction?: string; domain?: string; verified?: boolean }) => {
    const results = searchServers({
      query,
      jurisdiction: options?.jurisdiction,
      legalDomain: options?.domain,
      verified: options?.verified || undefined,
    })

    console.log(chalk.cyan(`\n${results.total} result(s) for "${query}":\n`))
    for (const s of results.entries) {
      console.log(`${chalk.bold(s.name)} ${chalk.dim(`(${s.id})`)}`)
      console.log(`  ${s.description}`)
      console.log(`  ${chalk.dim('Jurisdictions:')} ${s.jurisdiction.join(', ')}`)
      console.log(`  ${chalk.dim('Tools:')} ${s.tools.join(', ')}`)
      console.log()
    }

    if (results.entries.length === 0) {
      console.log(chalk.yellow('No results found. Try a different query.'))
    }
  })

program.command('validate')
  .description('Validate an MCP server configuration file')
  .argument('<path>', 'Path to the server config JSON file')
  .action((filePath: string) => {
    try {
      const resolved = path.resolve(filePath)
      if (!fs.existsSync(resolved)) {
        console.error(chalk.red(`File not found: ${resolved}`))
        process.exit(1)
      }

      const raw = fs.readFileSync(resolved, 'utf-8')
      let config: Record<string, unknown>
      try {
        config = JSON.parse(raw)
      } catch {
        console.error(chalk.red('Invalid JSON in config file'))
        process.exit(1)
      }

      const result = validateServerConfig(config)

      if (result.valid) {
        console.log(chalk.green('\n✓ Configuration is valid'))
      } else {
        console.log(chalk.red('\n✗ Configuration has errors:'))
        for (const err of result.errors) {
          console.log(chalk.red(`  • ${err}`))
        }
      }

      if (result.warnings.length > 0) {
        console.log(chalk.yellow('\nWarnings:'))
        for (const w of result.warnings) {
          console.log(chalk.yellow(`  • ${w}`))
        }
      }
    } catch (err) {
      console.error(chalk.red('Error:'), err instanceof Error ? err.message : String(err))
      process.exit(1)
    }
  })

program.command('info')
  .description('Get jurisdiction information')
  .argument('<code>', 'Jurisdiction code (e.g., US, UK, EU, DE)')
  .action((code: string) => {
    const jur = getJurisdiction(code.toUpperCase())
    if (!jur) {
      console.log(chalk.red(`Unknown jurisdiction: ${code}`))
      console.log(chalk.yellow(`Available: ${listJurisdictions().map(j => j.code).join(', ')}`))
      process.exit(1)
    }

    console.log(chalk.cyan(`\n${chalk.bold(jur.name)} (${jur.code})\n`))
    console.log(`${chalk.dim('Legal System:')} ${jur.legal_system}`)
    console.log(`${chalk.dim('Language:')} ${jur.language}`)
    console.log(`${chalk.dim('Currency:')} ${jur.currency || 'N/A'}`)

    if (jur.citation_format) {
      console.log(`${chalk.dim('Citation Format:')} ${jur.citation_format}`)
    }
    if (jur.court_hierarchy && jur.court_hierarchy.length > 0) {
      console.log(chalk.dim('\nCourt Hierarchy:'))
      for (const court of jur.court_hierarchy) {
        console.log(`  • ${court}`)
      }
    }
    console.log()
  })

program.parse(process.argv)

if (!process.argv.slice(2).length) {
  program.outputHelp()
}
