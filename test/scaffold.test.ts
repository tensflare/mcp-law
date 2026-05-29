import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { scaffoldProject, scaffoldProjectDryRun } from '../src/scaffold/index.js'
import { getTemplate, listTemplates, TEMPLATES } from '../src/scaffold/templates.js'
import { generatePackageJson, generateTsConfig, generateIndexContent, getFileList } from '../src/scaffold/files.js'
import type { ScaffoldConfig } from '../src/scaffold/index.js'

describe('Templates', () => {
  it('has three templates defined', () => {
    const templates = listTemplates()
    expect(templates.length).toBe(3)
  })

  it('has basic template', () => {
    const t = getTemplate('basic')
    expect(t).toBeDefined()
    expect(t?.id).toBe('basic')
    expect(t?.supportsJurisdictions).toBe(false)
  })

  it('has jurisdiction-aware template', () => {
    const t = getTemplate('jurisdiction-aware')
    expect(t).toBeDefined()
    expect(t?.supportsJurisdictions).toBe(true)
  })

  it('has contract-analysis template', () => {
    const t = getTemplate('contract-analysis')
    expect(t).toBeDefined()
    expect(t?.supportsContractAnalysis).toBe(true)
  })

  it('returns undefined for unknown template', () => {
    expect(getTemplate('nonexistent')).toBeUndefined()
  })

  it('all templates have required fields', () => {
    for (const t of Object.values(TEMPLATES)) {
      expect(t.id).toBeTruthy()
      expect(t.name).toBeTruthy()
      expect(t.description).toBeTruthy()
      expect(t.directory).toBeTruthy()
      expect(t.defaultTools).toBeInstanceOf(Array)
    }
  })
})

describe('generatePackageJson()', () => {
  const baseConfig: ScaffoldConfig = {
    projectName: 'test-server',
    templateId: 'basic',
    jurisdictionCodes: [],
    tools: ['greet'],
    author: 'Test Author',
    description: 'Test description',
  }

  it('generates valid JSON', () => {
    const result = generatePackageJson(baseConfig)
    const parsed = JSON.parse(result)
    expect(parsed.name).toBe('test-server')
    expect(parsed.version).toBe('0.1.0')
  })

  it('includes mcp-law dependency', () => {
    const result = generatePackageJson(baseConfig)
    const parsed = JSON.parse(result)
    expect(parsed.dependencies['@tensflare/mcp-law']).toBe('^0.1.0')
  })

  it('has correct module type', () => {
    const result = generatePackageJson(baseConfig)
    const parsed = JSON.parse(result)
    expect(parsed.type).toBe('module')
  })
})

describe('generateTsConfig()', () => {
  it('returns valid JSON', () => {
    const result = generateTsConfig()
    const parsed = JSON.parse(result)
    expect(parsed.compilerOptions.target).toBe('ES2022')
    expect(parsed.compilerOptions.module).toBe('NodeNext')
  })

  it('sets strict mode', () => {
    const result = generateTsConfig()
    const parsed = JSON.parse(result)
    expect(parsed.compilerOptions.strict).toBe(true)
  })
})

describe('generateIndexContent()', () => {
  it('generates basic template with greet tool', () => {
    const config: ScaffoldConfig = {
      projectName: 'test-server',
      templateId: 'basic',
      jurisdictionCodes: [],
      tools: ['greet'],
      author: '',
      description: '',
    }
    const content = generateIndexContent(config)
    expect(content).toContain('test-server')
    expect(content).toContain('greet')
    expect(content).toContain('initialize')
    expect(content).toContain('tools/list')
    expect(content).toContain('tools/call')
  })

  it('generates jurisdiction-aware template', () => {
    const config: ScaffoldConfig = {
      projectName: 'jurisdiction-server',
      templateId: 'jurisdiction-aware',
      jurisdictionCodes: ['US', 'UK'],
      tools: ['get_jurisdiction_info', 'validate_citation', 'search_statutes'],
      author: '',
      description: '',
    }
    const content = generateIndexContent(config)
    expect(content).toContain('jurisdiction-server')
    expect(content).toContain('get_jurisdiction_info')
    expect(content).toContain('SUPPORTED_JURISDICTIONS')
  })

  it('generates contract-analysis template', () => {
    const config: ScaffoldConfig = {
      projectName: 'contract-server',
      templateId: 'contract-analysis',
      jurisdictionCodes: ['US', 'UK', 'EU'],
      tools: ['extract_clauses', 'assess_risk', 'check_compliance'],
      author: '',
      description: '',
    }
    const content = generateIndexContent(config)
    expect(content).toContain('contract-server')
    expect(content).toContain('extract_clauses')
    expect(content).toContain('assess_risk')
    expect(content).toContain('check_compliance')
  })
})

describe('getFileList()', () => {
  const config: ScaffoldConfig = {
    projectName: 'test-project',
    templateId: 'basic',
    jurisdictionCodes: [],
    tools: ['greet'],
    author: '',
    description: '',
  }

  it('returns three files', () => {
    const files = getFileList(config)
    expect(files.length).toBe(3)
  })

  it('includes package.json', () => {
    const files = getFileList(config)
    expect(files.some(f => f.path === 'package.json')).toBe(true)
  })

  it('includes tsconfig.json', () => {
    const files = getFileList(config)
    expect(files.some(f => f.path === 'tsconfig.json')).toBe(true)
  })

  it('includes src/index.ts', () => {
    const files = getFileList(config)
    expect(files.some(f => f.path === 'src/index.ts')).toBe(true)
  })
})

describe('scaffoldProject()', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-law-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('creates project directory with files', () => {
    const projectPath = path.join(tmpDir, 'my-server')
    const config: ScaffoldConfig = {
      projectName: projectPath,
      templateId: 'basic',
      jurisdictionCodes: [],
      tools: ['greet'],
      author: 'Test',
      description: 'Test project',
    }

    const result = scaffoldProject(config)

    expect(result.filesCreated.length).toBe(3)
    expect(fs.existsSync(path.join(projectPath, 'package.json'))).toBe(true)
    expect(fs.existsSync(path.join(projectPath, 'tsconfig.json'))).toBe(true)
    expect(fs.existsSync(path.join(projectPath, 'src/index.ts'))).toBe(true)
  })

  it('creates src directory', () => {
    const projectPath = path.join(tmpDir, 'with-src')
    const config: ScaffoldConfig = {
      projectName: projectPath,
      templateId: 'basic',
      jurisdictionCodes: [],
      tools: ['greet'],
      author: '',
      description: '',
    }

    scaffoldProject(config)
    expect(fs.statSync(path.join(projectPath, 'src')).isDirectory()).toBe(true)
  })

  it('written files contain valid JSON', () => {
    const projectPath = path.join(tmpDir, 'json-check')
    const config: ScaffoldConfig = {
      projectName: projectPath,
      templateId: 'basic',
      jurisdictionCodes: [],
      tools: ['greet'],
      author: '',
      description: '',
    }

    scaffoldProject(config)

    expect(() => JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json'), 'utf-8'))).not.toThrow()
    expect(() => JSON.parse(fs.readFileSync(path.join(projectPath, 'tsconfig.json'), 'utf-8'))).not.toThrow()
  })
})

describe('scaffoldProjectDryRun()', () => {
  it('returns file list without creating anything', () => {
    const config: ScaffoldConfig = {
      projectName: '/nonexistent/dry-run-test',
      templateId: 'contract-analysis',
      jurisdictionCodes: ['US', 'UK'],
      tools: ['extract_clauses'],
      author: '',
      description: '',
    }

    const result = scaffoldProjectDryRun(config)
    expect(result.filesCreated.length).toBe(3)
    expect(fs.existsSync(result.projectPath)).toBe(false)
  })
})
