import { z } from 'zod'

export const Jurisdiction = z.object({
  code: z.string(),
  name: z.string(),
  legal_system: z.enum(['common_law', 'civil_law', 'mixed', 'religious', 'customary']),
  language: z.string(),
  currency: z.string().optional(),
  citation_format: z.string().optional(),
  statute_format: z.string().optional(),
  court_hierarchy: z.array(z.string()).optional(),
})
export type Jurisdiction = z.infer<typeof Jurisdiction>

export const ContractClauseType = z.enum([
  'indemnification',
  'limitation_of_liability',
  'governing_law',
  'dispute_resolution',
  'confidentiality',
  'termination',
  'payment_terms',
  'ip_ownership',
  'warranty',
  'force_majeure',
  'non_compete',
  'data_privacy',
  'assignment',
  'entire_agreement',
])
export type ContractClauseType = z.infer<typeof ContractClauseType>

export const CitationFormat = z.object({
  jurisdiction: z.string(),
  format_name: z.string(),
  pattern: z.string(),
  example: z.string(),
  components: z.array(z.object({
    name: z.string(),
    description: z.string(),
    required: z.boolean(),
  })),
})
export type CitationFormat = z.infer<typeof CitationFormat>

export const LegalDomain = z.enum([
  'contracts',
  'litigation',
  'corporate',
  'ip',
  'employment',
  'tax',
  'real_estate',
  'regulatory',
  'family',
  'estate',
  'compliance',
])
export type LegalDomain = z.infer<typeof LegalDomain>

export const MCPToolDefinition = z.object({
  name: z.string(),
  description: z.string(),
  input_schema: z.any(),
  jurisdiction: z.array(z.string()).optional(),
  legal_domains: z.array(LegalDomain).optional(),
  safety_notes: z.array(z.string()).optional(),
})
export type MCPToolDefinition = z.infer<typeof MCPToolDefinition>

export const JURISDICTIONS: Record<string, Jurisdiction> = {
  'US': { code: 'US', name: 'United States (Federal)', legal_system: 'common_law', language: 'en', currency: 'USD', citation_format: '\\d+ U\\.S\\. \\d+|\\d+ F\\.\\d+d \\d+|\\d+ S\\.Ct\\. \\d+', court_hierarchy: ['Supreme Court', 'Circuit Courts of Appeals', 'District Courts'] },
  'US-CA': { code: 'US-CA', name: 'California (US State)', legal_system: 'common_law', language: 'en', currency: 'USD', citation_format: 'Cal\\. \\d+d|Cal\\. App\\. \\d+th \\d+' },
  'UK': { code: 'UK', name: 'United Kingdom', legal_system: 'common_law', language: 'en', currency: 'GBP', citation_format: '\\[\\d{4}\\] UKSC \\d+|\\[\\d{4}\\] EWCA Civ \\d+', court_hierarchy: ['Supreme Court', 'Court of Appeal', 'High Court'] },
  'EU': { code: 'EU', name: 'European Union', legal_system: 'civil_law', language: 'en,fr,de', currency: 'EUR' },
  'AU': { code: 'AU', name: 'Australia', legal_system: 'common_law', language: 'en', currency: 'AUD' },
  'SG': { code: 'SG', name: 'Singapore', legal_system: 'common_law', language: 'en', currency: 'SGD' },
  'IN': { code: 'IN', name: 'India', legal_system: 'common_law', language: 'en,hi', currency: 'INR' },
  'CA': { code: 'CA', name: 'Canada (Federal)', legal_system: 'common_law', language: 'en,fr', currency: 'CAD' },
  'DE': { code: 'DE', name: 'Germany', legal_system: 'civil_law', language: 'de', currency: 'EUR' },
  'FR': { code: 'FR', name: 'France', legal_system: 'civil_law', language: 'fr', currency: 'EUR' },
}

export const CITATION_FORMATS: CitationFormat[] = [
  { jurisdiction: 'US', format_name: 'U.S. Reports', pattern: '(\\d+) (U\\.S\\.) (\\d+)', example: '410 U.S. 113', components: [{ name: 'volume', description: 'Volume number', required: true }, { name: 'reporter', description: 'Reporter abbreviation', required: true }, { name: 'page', description: 'Starting page', required: true }] },
  { jurisdiction: 'US', format_name: 'Federal Reporter', pattern: '(\\d+) F\\.(\\d+)d (\\d+)', example: '987 F.3d 123', components: [{ name: 'volume', description: 'Volume number', required: true }, { name: 'series', description: 'Series (F., F.2d, F.3d)', required: true }, { name: 'page', description: 'Starting page', required: true }] },
  { jurisdiction: 'UK', format_name: 'Neutral Citation', pattern: '\\[(\\d{4})\\] UKSC (\\d+)', example: '[2024] UKSC 1', components: [{ name: 'year', description: 'Year in brackets', required: true }, { name: 'court', description: 'Court abbreviation', required: true }, { name: 'number', description: 'Case number', required: true }] },
  { jurisdiction: 'EU', format_name: 'ECLI', pattern: 'ECLI:([A-Z]{2}):(\\w+):(\\d+):(\\d+)', example: 'ECLI:EU:C:2024:123', components: [{ name: 'prefix', description: 'ECLI prefix', required: true }, { name: 'country', description: 'Country code', required: true }, { name: 'court', description: 'Court code', required: true }, { name: 'year', description: 'Year', required: true }, { name: 'number', description: 'Case number', required: true }] },
]

export const CLAUSE_DESCRIPTIONS: Record<ContractClauseType, { description: string; risk_flags: string[] }> = {
  indemnification: { description: 'Obligation to compensate for loss or damage', risk_flags: ['Unilateral indemnity', 'No cap on liability', 'Survival beyond termination'] },
  limitation_of_liability: { description: 'Cap on total liability for breach', risk_flags: ['Excluded from mutual', 'No cap', 'Carve-outs too narrow'] },
  governing_law: { description: 'Which jurisdiction\'s law governs the contract', risk_flags: ['Unfavorable jurisdiction', 'Mandatory foreign law'] },
  dispute_resolution: { description: 'How disputes are resolved (court, arbitration, mediation)', risk_flags: ['Mandatory arbitration', 'Remote venue', 'Waiver of jury trial'] },
  confidentiality: { description: 'Obligations around handling proprietary information', risk_flags: ['No sunset', 'Overbroad definition', 'No exceptions'] },
  termination: { description: 'Conditions under which the agreement ends', risk_flags: ['For convenience only for one party', 'No cure period'] },
  payment_terms: { description: 'Pricing, invoicing, and payment schedules', risk_flags: ['Net-90+', 'Auto-renewal with price increase'] },
  ip_ownership: { description: 'Who owns intellectual property created', risk_flags: ['Work-for-hire assignment', 'No license back'] },
  warranty: { description: 'Guarantees about products or services', risk_flags: ['Disclaimer of all warranties', 'AS-IS without limitation'] },
  force_majeure: { description: 'Excused performance due to extraordinary events', risk_flags: ['Pandemic excluded', 'No notice requirement'] },
  non_compete: { description: 'Restrictions on competing activities', risk_flags: ['Overbroad scope', 'Excessive duration'] },
  data_privacy: { description: 'How personal data is handled', risk_flags: ['No GDPR/CCPA mention', 'Unlimited data use'] },
  assignment: { description: 'Whether rights can be transferred', risk_flags: ['No consent for assignment', 'Change of control = assignment'] },
  entire_agreement: { description: 'Merger clause stating the agreement supersedes prior discussions', risk_flags: ['No anti-reliance clause'] },
}

export interface MCPServerEntry {
  name: string
  description: string
  author: string
  jurisdiction: string[]
  legal_domains: LegalDomain[]
  tools: string[]
  package_name?: string
  remote_url?: string
  verified: boolean
  security_audited: boolean
  tags: string[]
}
