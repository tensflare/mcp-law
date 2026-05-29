import type { RegistryEntry, RegistryQuery, RegistrySearchResult, ValidationResult } from './types.js'

export type { RegistryEntry, RegistryQuery, RegistrySearchResult, ValidationResult }

const KNOWN_SERVERS: RegistryEntry[] = [
  {
    id: 'courtlistener-mcp',
    name: 'CourtListener MCP',
    description: 'Access US case law, PACER data, citation verification, and court opinions via Free Law Project\'s CourtListener API',
    author: 'Free Law Project',
    jurisdiction: ['US'],
    legal_domains: ['litigation'],
    tools: ['search_cases', 'get_opinion', 'verify_citation', 'search_pacer', 'list_jurisdictions'],
    remote_url: 'https://github.com/freelawproject/courtlistener-mcp',
    verified: true,
    security_audited: false,
    documentationUrl: 'https://github.com/freelawproject/courtlistener-mcp/blob/main/README.md',
    license: 'MIT',
    tags: ['cases', 'pacer', 'citations', 'US law', 'opinions'],
    addedAt: '2025-01-10T00:00:00Z',
    updatedAt: '2025-04-15T00:00:00Z',
    version: '0.2.0',
  },
  {
    id: 'uk-case-law-mcp',
    name: 'UK Case Law MCP',
    description: 'UK case law from The National Archives — search and retrieve judgments, find citations, and explore court hierarchies',
    author: 'George Jeffers',
    jurisdiction: ['UK'],
    legal_domains: ['litigation'],
    tools: ['search_cases', 'get_judgment', 'find_citations'],
    remote_url: 'https://github.com/georgejeffers/uk-case-law-mcp-server',
    verified: false,
    security_audited: false,
    documentationUrl: 'https://github.com/georgejeffers/uk-case-law-mcp-server/blob/main/README.md',
    license: 'MIT',
    tags: ['UK law', 'cases', 'judgments', 'national archives'],
    addedAt: '2025-02-20T00:00:00Z',
    updatedAt: '2025-04-01T00:00:00Z',
    version: '0.1.0',
  },
  {
    id: 'us-legal-mcp',
    name: 'US Legal MCP',
    description: 'Congress bills, Federal Register notices, court opinions, and US Code queries through GovInfo and other government APIs',
    author: 'JamesANZ',
    jurisdiction: ['US'],
    legal_domains: ['litigation', 'regulatory'],
    tools: ['search_bills', 'get_federal_register', 'search_opinions', 'query_us_code'],
    remote_url: 'https://github.com/JamesANZ/legal-mcp',
    verified: false,
    security_audited: false,
    documentationUrl: 'https://github.com/JamesANZ/legal-mcp/blob/main/README.md',
    license: 'MIT',
    tags: ['US law', 'bills', 'federal register', 'opinions', 'US code'],
    addedAt: '2025-03-05T00:00:00Z',
    updatedAt: '2025-05-01T00:00:00Z',
    version: '0.3.0',
  },
  {
    id: 'legal-doc-analyzer',
    name: 'Legal Doc Analyzer',
    description: 'Contract analysis MCP server for clause extraction, risk flagging, version diffing, and compliance checking',
    author: 'MCP Legal Tools',
    jurisdiction: ['US', 'UK', 'EU'],
    legal_domains: ['contracts'],
    tools: ['extract_clauses', 'assess_risk', 'check_compliance', 'diff_versions'],
    package_name: 'mcp-legal-doc-analyzer',
    verified: false,
    security_audited: false,
    documentationUrl: 'https://www.npmjs.com/package/mcp-legal-doc-analyzer',
    installCommand: 'npm install mcp-legal-doc-analyzer',
    license: 'MIT',
    tags: ['contracts', 'analysis', 'clauses', 'risk', 'compliance'],
    addedAt: '2025-03-10T00:00:00Z',
    updatedAt: '2025-05-10T00:00:00Z',
    version: '0.1.1',
  },
  {
    id: 'legalkit',
    name: 'LegalKit',
    description: 'Comprehensive legal document analysis toolkit — contract review, clause extraction, obligation tracking, and jurisdiction-aware compliance checks',
    author: 'Tom Hozier',
    jurisdiction: ['US', 'UK', 'EU', 'CA', 'AU'],
    legal_domains: ['contracts', 'regulatory'],
    tools: ['contract_analyzer', 'contract_generator', 'case_research', 'statute_lookup', 'legal_deadline_calculator', 'legal_letter_drafter', 'deposition_prep', 'legal_billing_tracker', 'jurisdiction_checker', 'legal_term_explainer'],
    remote_url: 'https://legalkit.ai',
    verified: false,
    security_audited: false,
    documentationUrl: 'https://legalkit.ai',
    license: 'Proprietary',
    tags: ['contracts', 'analysis', 'compliance', 'obligations', 'jurisdiction'],
    addedAt: '2025-04-01T00:00:00Z',
    updatedAt: '2025-05-15T00:00:00Z',
    version: '0.1.1',
  },
  {
    id: 'introhive-mcp',
    name: 'Introhive MCP',
    description: 'Relationship intelligence for law firms — CRM data enrichment, relationship mapping, and business development insights',
    author: 'Introhive',
    jurisdiction: ['US', 'UK', 'CA', 'AU'],
    legal_domains: ['corporate'],
    tools: ['search_relationships', 'get_firm_insights', 'map_connections', 'analyze_network'],
    remote_url: 'https://www.introhive.com/news/introhive-announces-mcp-server-for-legal-ai',
    verified: true,
    security_audited: true,
    documentationUrl: 'https://www.introhive.com/news/introhive-announces-mcp-server-for-legal-ai',
    license: 'Proprietary',
    tags: ['crm', 'relationships', 'business development', 'law firms'],
    addedAt: '2025-05-01T00:00:00Z',
    updatedAt: '2025-05-20T00:00:00Z',
    version: '1.0.0',
  },
  {
    id: 'cerebra-legal-mcp',
    name: 'Cerebra Legal MCP',
    description: 'Enterprise-grade MCP server for legal reasoning and analysis implementing Anthropic\'s "think tool" pattern — structured legal reasoning with domain-specific guidance templates for consumer protection, contract analysis, and ANSC contestation',
    author: 'Yoda Digital',
    jurisdiction: ['US', 'UK', 'EU'],
    legal_domains: ['litigation', 'contracts'],
    tools: ['legal_think', 'legal_ask_followup_question', 'legal_attempt_completion'],
    remote_url: 'https://github.com/yoda-digital/mcp-cerebra-legal-server',
    verified: true,
    security_audited: false,
    documentationUrl: 'https://github.com/yoda-digital/mcp-cerebra-legal-server/blob/main/README.md',
    license: 'MIT',
    tags: ['reasoning', 'analysis', 'structured', 'templates', 'legal-thinking'],
    addedAt: '2025-06-15T00:00:00Z',
    updatedAt: '2025-11-01T00:00:00Z',
    version: '1.0.0',
  },
  {
    id: 'open-legal-compliance',
    name: 'Open Legal Compliance MCP',
    description: 'Multi-jurisdiction legal compliance analysis using free government APIs — US federal law (USC/CFR via GovInfo), case law (CourtListener), EU regulations (GDPR, AI Act), state law (CA, NY, IL), SEC EDGAR, UK legislation, Canadian law (CanLII), and FDA data',
    author: 'TCoder920x',
    jurisdiction: ['US', 'UK', 'EU', 'CA'],
    legal_domains: ['compliance', 'regulatory', 'litigation'],
    tools: ['search_us_federal', 'search_eu_regulations', 'search_state_law', 'search_congress_bills', 'search_federal_register', 'search_sec_filings', 'search_open_states', 'search_uk_legislation', 'search_canadian_law', 'search_fda_data'],
    remote_url: 'https://github.com/TCoder920x/open-legal-compliance-mcp',
    verified: false,
    security_audited: false,
    documentationUrl: 'https://github.com/TCoder920x/open-legal-compliance-mcp/blob/main/README.md',
    license: 'MIT',
    tags: ['compliance', 'multi-jurisdiction', 'government-apis', 'regulations', 'FDA', 'SEC', 'CanLII'],
    addedAt: '2025-08-01T00:00:00Z',
    updatedAt: '2025-12-01T00:00:00Z',
    version: '0.1.0',
  },
  {
    id: 'contract-law-mcp',
    name: 'Contract Law MCP',
    description: 'International contract law expert MCP server providing structured intelligence for contract review — clause analysis, compliance mapping, IP provision guidance, negotiation red flags, and risk assessment. Covers CISG, UNIDROIT Principles, and Incoterms for cross-border commercial agreements',
    author: 'Ansvar Systems',
    jurisdiction: ['US', 'UK', 'EU', 'AU'],
    legal_domains: ['contracts'],
    tools: ['analyze_clause', 'check_compliance', 'assess_risk', 'map_ip_provisions', 'identify_red_flags', 'evaluate_governing_law'],
    remote_url: 'https://github.com/Ansvar-Systems/contract-law-mcp',
    verified: true,
    security_audited: false,
    documentationUrl: 'https://github.com/Ansvar-Systems/contract-law-mcp/blob/main/README.md',
    license: 'Apache-2.0',
    tags: ['contracts', 'CISG', 'UNIDROIT', 'Incoterms', 'cross-border', 'risk'],
    addedAt: '2025-09-10T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
    version: '0.5.0',
  },
  {
    id: 'german-law-mcp',
    name: 'German Law MCP',
    description: 'Query 6,870 German federal statutes (BGB, StGB, GG, BDSG, and more) from gesetze-im-internet.de — full-text search, statute retrieval, and cross-referencing for AI-assisted German legal research',
    author: 'Ansvar Systems',
    jurisdiction: ['DE', 'EU'],
    legal_domains: ['regulatory', 'litigation'],
    tools: ['search_statutes', 'get_statute', 'search_by_area', 'cross_reference'],
    package_name: '@ansvar/german-law-mcp',
    installCommand: 'npm install @ansvar/german-law-mcp',
    verified: true,
    security_audited: false,
    documentationUrl: 'https://github.com/Ansvar-Systems/German-law-mcp/blob/main/README.md',
    license: 'Apache-2.0',
    tags: ['German law', 'statutes', 'BGB', 'StGB', 'GDPR', 'federal'],
    addedAt: '2025-10-01T00:00:00Z',
    updatedAt: '2026-05-17T00:00:00Z',
    version: '1.0.0',
  },
  {
    id: 'brazilian-law-mcp',
    name: 'Brazilian Law MCP',
    description: 'Brazilian federal law database covering 2,471 laws with 28,585 provisions — data protection (LGPD), internet regulation (Marco Civil), cybercrime, consumer protection, telecommunications, and civil code with Portuguese full-text search. LGPD-GDPR alignment tools included',
    author: 'Ansvar Systems',
    jurisdiction: ['BR'],
    legal_domains: ['regulatory', 'compliance'],
    tools: ['search_laws', 'get_provision', 'lgpd_gdpr_align', 'search_parliamentary_docs', 'compare_versions'],
    remote_url: 'https://github.com/Ansvar-Systems/brazil-law-mcp',
    verified: false,
    security_audited: false,
    documentationUrl: 'https://github.com/Ansvar-Systems/brazil-law-mcp/blob/main/README.md',
    license: 'Apache-2.0',
    tags: ['Brazilian law', 'LGPD', 'Marco Civil', 'GDPR', 'Portuguese', 'federal'],
    addedAt: '2026-01-20T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
    version: '0.8.0',
  },
  {
    id: 'brazilian-law-research',
    name: 'Brazilian Law Research MCP',
    description: 'MCP server for agent-driven research on Brazilian law using official sources — research legal precedents from STJ (National High Court), TST (Labor Court), and STF (Supreme Federal Court) with scraping capabilities',
    author: 'pdmtt',
    jurisdiction: ['BR'],
    legal_domains: ['litigation'],
    tools: ['StjLegalPrecedentsRequest', 'TstLegalPrecedentsRequest', 'StfLegalPrecedentsRequest'],
    remote_url: 'https://github.com/pdmtt/brlaw_mcp_server',
    verified: false,
    security_audited: false,
    documentationUrl: 'https://github.com/pdmtt/brlaw_mcp_server/blob/main/README.md',
    license: 'MIT',
    tags: ['Brazilian law', 'STJ', 'STF', 'TST', 'precedents', 'research'],
    addedAt: '2025-11-15T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    version: '0.2.0',
  },
  {
    id: 'mexican-law-mcp',
    name: 'Mexican Law MCP',
    description: 'MCP server for the Mexican legal system — search legislation in the Diario Oficial de la Federación (DOF), generate legal documents (amparos, contracts, demands, wills), and analyze constitutional rights',
    author: 'Toponaut',
    jurisdiction: ['MX'],
    legal_domains: ['litigation', 'contracts'],
    tools: ['search_dof', 'generate_amparo', 'generate_contract', 'analyze_constitutional_rights', 'evaluate_liability'],
    remote_url: 'https://github.com/Toponaut/mexican-law-mcp-server',
    verified: false,
    security_audited: false,
    documentationUrl: 'https://github.com/Toponaut/mexican-law-mcp-server/blob/main/README.md',
    license: 'MIT',
    tags: ['Mexican law', 'DOF', 'amparo', 'constitutional', 'Spanish'],
    addedAt: '2026-02-10T00:00:00Z',
    updatedAt: '2026-03-15T00:00:00Z',
    version: '0.1.0',
  },
]

export function listServers(): RegistryEntry[] {
  return [...KNOWN_SERVERS]
}

export function searchServers(query: RegistryQuery): RegistrySearchResult {
  let results = [...KNOWN_SERVERS]

  if (query.jurisdiction) {
    const j = query.jurisdiction.toUpperCase()
    results = results.filter(e => e.jurisdiction.some(jc => jc.toUpperCase() === j))
  }

  if (query.legalDomain) {
    const d = query.legalDomain.toLowerCase()
    results = results.filter(e => e.legal_domains.some(ld => ld.toLowerCase() === d))
  }

  if (query.tool) {
    const t = query.tool.toLowerCase()
    results = results.filter(e => e.tools.some(tool => tool.toLowerCase().includes(t)))
  }

  if (query.verified !== undefined) {
    results = results.filter(e => e.verified === query.verified)
  }

  if (query.query) {
    const q = query.query.toLowerCase()
    results = results.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.tags.some(tag => tag.toLowerCase().includes(q)) ||
      e.tools.some(tool => tool.toLowerCase().includes(q))
    )
  }

  return { entries: results, total: results.length, query }
}

export function getServerById(id: string): RegistryEntry | undefined {
  return KNOWN_SERVERS.find(e => e.id === id)
}

export function validateServerConfig(config: Record<string, unknown>): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!config.name || typeof config.name !== 'string') {
    errors.push('Server must have a "name" field of type string')
  }

  if (!config.version || typeof config.version !== 'string') {
    errors.push('Server must have a "version" field of type string')
  }

  if (!config.tools || !Array.isArray(config.tools)) {
    errors.push('Server must have a "tools" field of type array')
  } else {
    for (const tool of config.tools) {
      if (typeof tool === 'object' && tool !== null) {
        if (!(tool as Record<string, unknown>).name) {
          errors.push('Each tool must have a "name" field')
        }
        if (!(tool as Record<string, unknown>).input_schema && !(tool as Record<string, unknown>).inputSchema) {
          warnings.push(`Tool "${(tool as Record<string, unknown>).name || 'unknown'}" has no input schema`)
        }
      } else {
        errors.push('Each tool must be an object')
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}

export function getInstallInstructions(entry: RegistryEntry): string {
  if (entry.package_name) {
    return `npm install ${entry.package_name}`
  }
  if (entry.remote_url) {
    return `Configure MCP client to connect to: ${entry.remote_url}`
  }
  return 'No installation method available'
}
