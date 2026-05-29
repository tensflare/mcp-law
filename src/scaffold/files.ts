import { TEMPLATES } from './templates.js'
import type { TemplateInfo } from './templates.js'

export interface ScaffoldConfig {
  projectName: string
  templateId: string
  jurisdictionCodes: string[]
  tools: string[]
  author: string
  description: string
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase()
}

export function generatePackageJson(config: ScaffoldConfig): string {
  const template = TEMPLATES[config.templateId]
  const deps: Record<string, string> = {
    '@tensflare/mcp-law': '^0.1.0',
  }
  const devDeps: Record<string, string> = {
    'typescript': '^5.4.0',
    'tsx': '^4.0.0',
    '@types/node': '^20.0.0',
  }

  return JSON.stringify({
    name: sanitizeName(config.projectName),
    version: '0.1.0',
    description: config.description || template?.description || '',
    type: 'module',
    scripts: {
      build: 'tsc',
      dev: 'tsx src/index.ts',
      typecheck: 'tsc --noEmit',
    },
    dependencies: deps,
    devDependencies: devDeps,
    engines: { node: '>=18' },
  }, null, 2)
}

export function generateTsConfig(): string {
  return JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      outDir: './dist',
      rootDir: './src',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      declaration: true,
      sourceMap: true,
    },
    include: ['src'],
    exclude: ['node_modules', 'dist'],
  }, null, 2)
}

export function generateIndexContent(config: ScaffoldConfig): string {
  const template = TEMPLATES[config.templateId]

  const toolDefinitions = config.tools.map(t => {
    if (t === 'greet') {
      return `  {
    name: 'greet',
    description: 'A simple greeting tool — demonstrates the MCP tool pattern',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'The name to greet' },
        greeting: { type: 'string', description: 'Custom greeting (optional)', default: 'Hello' },
      },
      required: ['name'],
    },
  }`
    }
    if (t === 'get_jurisdiction_info') {
      return `  {
    name: 'get_jurisdiction_info',
    description: 'Get legal metadata for a specified jurisdiction',
    inputSchema: {
      type: 'object',
      properties: {
        jurisdiction: { type: 'string', description: 'Jurisdiction code (e.g., US, UK, EU, DE)' },
      },
      required: ['jurisdiction'],
    },
  }`
    }
    if (t === 'validate_citation') {
      return `  {
    name: 'validate_citation',
    description: 'Validate a legal citation against jurisdiction format rules',
    inputSchema: {
      type: 'object',
      properties: {
        jurisdiction: { type: 'string', description: 'Jurisdiction code' },
        citation: { type: 'string', description: 'The citation text to validate' },
      },
      required: ['jurisdiction', 'citation'],
    },
  }`
    }
    if (t === 'search_statutes') {
      return `  {
    name: 'search_statutes',
    description: 'Search for statutes by keyword and jurisdiction',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        jurisdiction: { type: 'string', description: 'Jurisdiction code' },
      },
      required: ['query', 'jurisdiction'],
    },
  }`
    }
    if (t === 'extract_clauses') {
      return `  {
    name: 'extract_clauses',
    description: 'Extract contract clauses from text and classify them',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Contract text to analyze' },
        jurisdiction: { type: 'string', description: 'Governing jurisdiction code' },
      },
      required: ['text'],
    },
  }`
    }
    if (t === 'assess_risk') {
      return `  {
    name: 'assess_risk',
    description: 'Assess risk level of contract clauses based on jurisdiction standards',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Contract text to assess' },
        jurisdiction: { type: 'string', description: 'Governing jurisdiction (optional)' },
      },
      required: ['text'],
    },
  }`
    }
    if (t === 'check_compliance') {
      return `  {
    name: 'check_compliance',
    description: 'Check contract compliance with specific regulatory requirements',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Contract text to check' },
        regulations: { type: 'array', items: { type: 'string' }, description: 'Regulatory frameworks (e.g., GDPR, CCPA)' },
        jurisdiction: { type: 'string', description: 'Jurisdiction code' },
      },
      required: ['text'],
    },
  }`
    }
    return `  {
    name: '${t}',
    description: 'Custom tool for ${t}',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  }`
  }).join(',\n')

  const jurisdictionSetup = config.jurisdictionCodes.length > 0
    ? `\nconst SUPPORTED_JURISDICTIONS = ${JSON.stringify(config.jurisdictionCodes)};`
    : ''

  const toolHandlers = config.tools.map(t => {
    if (t === 'greet') {
      return `
    if (params.name === 'greet') {
      const { name, greeting } = args as { name: string; greeting?: string }
      return {
        content: [{ type: 'text', text: \`\${greeting || 'Hello'}, \${name}! Welcome to your MCP server.\` }],
      }
    }`
    }
    if (t === 'get_jurisdiction_info') {
      return `
    if (params.name === 'get_jurisdiction_info') {
      const { jurisdiction } = args as { jurisdiction: string }
      const info = getJurisdiction(jurisdiction)
      if (!info) return { content: [{ type: 'text', text: \`Unknown jurisdiction: \${jurisdiction}\` }], isError: true }
      return { content: [{ type: 'text', text: JSON.stringify(info, null, 2) }] }
    }`
    }
    if (t === 'validate_citation') {
      return `
    if (params.name === 'validate_citation') {
      const { jurisdiction, citation } = args as { jurisdiction: string; citation: string }
      const result = validateCitationText(citation)
      const match = result.format && result.format.jurisdiction === jurisdiction
      return {
        content: [{ type: 'text', text: JSON.stringify({ valid: match, format: result.format?.format_name, errors: match ? [] : ['Citation does not match jurisdiction format'] }, null, 2) }],
      }
    }`
    }
    if (t === 'search_statutes') {
      return `
    if (params.name === 'search_statutes') {
      const { query, jurisdiction } = args as { query: string; jurisdiction: string }
      const statutes: Record<string, Array<{ name: string; citation: string; relevance: number }>> = {
        US: [
          { name: 'Sherman Antitrust Act', citation: '15 U.S.C. § 1', relevance: 0.95 },
          { name: 'Securities Exchange Act of 1934', citation: '15 U.S.C. § 78a', relevance: 0.90 },
          { name: 'Federal Trade Commission Act', citation: '15 U.S.C. § 41', relevance: 0.85 },
          { name: 'Americans with Disabilities Act', citation: '42 U.S.C. § 12101', relevance: 0.80 },
          { name: 'Clean Water Act', citation: '33 U.S.C. § 1251', relevance: 0.75 },
        ],
        UK: [
          { name: 'Companies Act 2006', citation: '2006 c. 46', relevance: 0.95 },
          { name: 'Consumer Rights Act 2015', citation: '2015 c. 15', relevance: 0.90 },
          { name: 'Data Protection Act 2018', citation: '2018 c. 12', relevance: 0.88 },
          { name: 'Employment Rights Act 1996', citation: '1996 c. 18', relevance: 0.85 },
          { name: 'Human Rights Act 1998', citation: '1998 c. 42', relevance: 0.82 },
        ],
        EU: [
          { name: 'General Data Protection Regulation (GDPR)', citation: 'Regulation (EU) 2016/679', relevance: 0.98 },
          { name: 'Digital Services Act', citation: 'Regulation (EU) 2022/2065', relevance: 0.92 },
          { name: 'AI Act', citation: 'Regulation (EU) 2024/1689', relevance: 0.90 },
          { name: 'Markets in Financial Instruments Directive II', citation: 'Directive 2014/65/EU', relevance: 0.80 },
          { name: 'Copyright Directive', citation: 'Directive (EU) 2019/790', relevance: 0.75 },
        ],
        DE: [
          { name: 'Bürgerliches Gesetzbuch (BGB)', citation: 'BGB § 1', relevance: 0.95 },
          { name: 'Handelsgesetzbuch (HGB)', citation: 'HGB § 1', relevance: 0.88 },
        ],
        FR: [
          { name: 'Code civil', citation: 'Art. 1101 Code civil', relevance: 0.95 },
          { name: 'Code de commerce', citation: 'Art. L110-1 Code de commerce', relevance: 0.85 },
        ],
        CA: [
          { name: 'Criminal Code (Canada)', citation: 'R.S.C., 1985, c. C-46', relevance: 0.90 },
          { name: 'Canada Labour Code', citation: 'R.S.C., 1985, c. L-2', relevance: 0.85 },
        ],
        AU: [
          { name: 'Corporations Act 2001', citation: 'Act No. 50 of 2001', relevance: 0.92 },
          { name: 'Competition and Consumer Act 2010', citation: 'Act No. 51 of 2010', relevance: 0.88 },
        ],
        IN: [
          { name: 'Indian Penal Code', citation: 'Act No. 45 of 1860', relevance: 0.90 },
          { name: 'Companies Act 2013', citation: 'Act No. 18 of 2013', relevance: 0.85 },
        ],
        SG: [
          { name: 'Companies Act (Singapore)', citation: 'Cap. 50, 2006 Rev. Ed.', relevance: 0.90 },
          { name: 'Evidence Act (Singapore)', citation: 'Cap. 97, 1997 Rev. Ed.', relevance: 0.80 },
        ],
      }
      const results = (statutes[jurisdiction] || []).filter(s =>
        query ? s.name.toLowerCase().includes(query.toLowerCase()) || s.citation.toLowerCase().includes(query.toLowerCase()) : true
      )
      return {
        content: [{ type: 'text', text: JSON.stringify({ query, jurisdiction, results, count: results.length }, null, 2) }],
      }
    }`
    }
    if (t === 'extract_clauses') {
      return `
    if (params.name === 'extract_clauses') {
      const { text } = args as { text: string }
      const clauses = extractClauses(text)
      return { content: [{ type: 'text', text: JSON.stringify({ clauses, count: clauses.length }, null, 2) }] }
    }`
    }
    if (t === 'assess_risk') {
      return `
    if (params.name === 'assess_risk') {
      const { text } = args as { text: string }
      const clauses = extractClauses(text)
      const highRisk = clauses.filter(c => c.riskFlags.length > 0)
      const riskScore = clauses.length > 0 ? Math.round((highRisk.length / clauses.length) * 100) : 0
      return {
        content: [{ type: 'text', text: JSON.stringify({ riskScore, totalClauses: clauses.length, highRiskClauses: highRisk.length, flags: highRisk.flatMap(c => c.riskFlags) }, null, 2) }],
      }
    }`
    }
    if (t === 'check_compliance') {
      return `
    if (params.name === 'check_compliance') {
      const { text, regulations } = args as { text: string; regulations?: string[] }
      const clauses = extractClauses(text)
      const dataPrivacyClause = clauses.find(c => c.type === 'data_privacy')
      const result: Record<string, boolean> = {}
      if (regulations) {
        for (const reg of regulations) {
          const r = reg.toUpperCase()
          if (r === 'GDPR') result[r] = !!dataPrivacyClause
          else if (r === 'CCPA') result[r] = !!dataPrivacyClause
          else result[r] = false
        }
      }
      return { content: [{ type: 'text', text: JSON.stringify({ compliant: Object.values(result).every(Boolean), checks: result, dataPrivacyClauseFound: !!dataPrivacyClause }, null, 2) }] }
    }`
    }
    return `
    if (params.name === '${t}') {
      return { content: [{ type: 'text', text: JSON.stringify({ message: 'Tool ${t} executed', args }, null, 2) }] }
    }`
  }).join('')

  const imports: string[] = []
  const schemasImports: string[] = []
  if (config.jurisdictionCodes.length > 0 || config.templateId === 'jurisdiction-aware') {
    schemasImports.push('getJurisdiction', 'validateCitationText')
  }
  if (config.templateId === 'contract-analysis' || config.tools.includes('extract_clauses') || config.tools.includes('assess_risk') || config.tools.includes('check_compliance')) {
    schemasImports.push('extractClauses')
  }
  if (schemasImports.length > 0) {
    imports.push(`import { ${schemasImports.join(', ')} } from '@tensflare/mcp-law'`)
  }

  return `#!/usr/bin/env node
${imports.join('\n')}

const server = {
  name: '${config.projectName}',
  version: '0.1.0',
  tools: [
${toolDefinitions}
  ],
};${jurisdictionSetup}

function handleRequest(request: { id: unknown; method: string; params?: Record<string, unknown> }): Record<string, unknown> | null {
  const { id, method, params } = request;

  if (method === 'initialize') {
    return { jsonrpc: '2.0', id, result: { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: server.name, version: server.version } } };
  }

  if (method === 'tools/list') {
    return { jsonrpc: '2.0', id, result: { tools: server.tools } };
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params || {};${toolHandlers}
    return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify({ error: 'Unknown tool: ' + name }, null, 2) }] } };
  }

  if (method === 'notifications/initialized') {
    return null;
  }

  return { jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found: ' + method } };
}

process.stdin.setEncoding('utf-8');
let buffer = '';

process.stdin.on('data', (chunk) => {
  buffer += chunk;
  const lines = buffer.split('\\n');
  buffer = lines.pop() || '';
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const request = JSON.parse(line);
      const response = handleRequest(request);
      if (response) {
        process.stdout.write(JSON.stringify(response) + '\\n');
      }
    } catch (err) {
      process.stderr.write(JSON.stringify({ jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' } }) + '\\n');
    }
  }
});
`
}

export function getFileList(config: ScaffoldConfig): Array<{ path: string; content: string }> {
  const files: Array<{ path: string; content: string }> = []

  files.push({
    path: 'package.json',
    content: generatePackageJson(config),
  })

  files.push({
    path: 'tsconfig.json',
    content: generateTsConfig(),
  })

  files.push({
    path: 'src/index.ts',
    content: generateIndexContent(config),
  })

  return files
}
