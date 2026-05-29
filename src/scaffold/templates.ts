export const JURISDICTION_CODES = ['US', 'US-CA', 'UK', 'EU', 'AU', 'SG', 'IN', 'CA', 'DE', 'FR'] as const
export type JurisdictionCode = typeof JURISDICTION_CODES[number]

export interface TemplateInfo {
  id: string
  name: string
  description: string
  directory: string
  defaultTools: string[]
  supportsJurisdictions: boolean
  supportsContractAnalysis: boolean
}

export const TEMPLATES: Record<string, TemplateInfo> = {
  'basic': {
    id: 'basic',
    name: 'Basic MCP Server',
    description: 'A minimal MCP server with a single greet tool — ideal for getting started',
    directory: 'templates/basic',
    defaultTools: ['greet'],
    supportsJurisdictions: false,
    supportsContractAnalysis: false,
  },
  'jurisdiction-aware': {
    id: 'jurisdiction-aware',
    name: 'Jurisdiction-Aware Server',
    description: 'An MCP server with tools filtered by jurisdiction, citation validation, and legal metadata',
    directory: 'templates/jurisdiction-aware',
    defaultTools: ['get_jurisdiction_info', 'validate_citation', 'search_statutes'],
    supportsJurisdictions: true,
    supportsContractAnalysis: false,
  },
  'contract-analysis': {
    id: 'contract-analysis',
    name: 'Contract Analysis Server',
    description: 'An MCP server specialized for contract clause extraction, risk scoring, and compliance checking',
    directory: 'templates/contract-analysis',
    defaultTools: ['extract_clauses', 'assess_risk', 'check_compliance'],
    supportsJurisdictions: true,
    supportsContractAnalysis: true,
  },
}

export function getTemplate(id: string): TemplateInfo | undefined {
  return TEMPLATES[id]
}

export function listTemplates(): TemplateInfo[] {
  return Object.values(TEMPLATES)
}
