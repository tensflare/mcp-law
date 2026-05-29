import { describe, it, expect } from 'vitest'
import {
  Jurisdiction,
  ContractClauseType,
  CitationFormat,
  LegalDomain,
  MCPToolDefinition,
  JURISDICTIONS,
  CITATION_FORMATS,
  CLAUSE_DESCRIPTIONS,
} from '../src/schemas/index.js'
import { getJurisdiction, listJurisdictions, validateCitation, searchJurisdictions, getCourtHierarchy } from '../src/schemas/jurisdiction.js'
import { validateCitationText, parseCitation, getFormatsByJurisdiction } from '../src/schemas/citation.js'
import { extractClauses, getClauseDescription, CLAUSE_PATTERNS } from '../src/schemas/contract.js'

describe('Jurisdiction Schema', () => {
  it('validates a correct jurisdiction object', () => {
    const result = Jurisdiction.safeParse({
      code: 'US',
      name: 'United States',
      legal_system: 'common_law',
      language: 'en',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid legal_system', () => {
    const result = Jurisdiction.safeParse({
      code: 'XX',
      name: 'Test',
      legal_system: 'invalid_system',
      language: 'en',
    })
    expect(result.success).toBe(false)
  })

  it('contains all expected jurisdictions', () => {
    expect(Object.keys(JURISDICTIONS)).toEqual(['US', 'US-CA', 'UK', 'EU', 'AU', 'SG', 'IN', 'CA', 'DE', 'FR'])
  })

  it('US jurisdiction has court hierarchy', () => {
    expect(JURISDICTIONS['US'].court_hierarchy).toBeDefined()
    expect(JURISDICTIONS['US'].court_hierarchy).toContain('Supreme Court')
  })
})

describe('getJurisdiction()', () => {
  it('returns jurisdiction info for valid codes', () => {
    const us = getJurisdiction('US')
    expect(us).toBeDefined()
    expect(us?.code).toBe('US')
    expect(us?.legal_system).toBe('common_law')
  })

  it('returns undefined for unknown codes', () => {
    expect(getJurisdiction('XX')).toBeUndefined()
  })

  it('is case-sensitive (expects uppercase)', () => {
    expect(getJurisdiction('us')).toBeUndefined()
  })
})

describe('listJurisdictions()', () => {
  it('returns all jurisdictions', () => {
    const all = listJurisdictions()
    expect(all.length).toBe(10)
  })
})

describe('searchJurisdictions()', () => {
  it('finds by code', () => {
    const results = searchJurisdictions('UK')
    expect(results.length).toBeGreaterThanOrEqual(1)
    expect(results[0].code).toBe('UK')
  })

  it('finds by name', () => {
    const results = searchJurisdictions('germany')
    expect(results.length).toBeGreaterThanOrEqual(1)
    expect(results[0].code).toBe('DE')
  })
})

describe('validateCitation()', () => {
  it('validates a correct US citation', () => {
    const result = validateCitation('US', '410 U.S. 113')
    expect(result.valid).toBe(true)
    expect(result.format).toBe('U.S. Reports')
  })

  it('rejects an incorrect citation for the jurisdiction', () => {
    const result = validateCitation('US', '[2024] UKSC 1')
    expect(result.valid).toBe(false)
  })

  it('returns error for unknown jurisdiction', () => {
    const result = validateCitation('XX', 'anything')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('No citation formats')
  })
})

describe('getCourtHierarchy()', () => {
  it('returns hierarchy for US', () => {
    const hierarchy = getCourtHierarchy('US')
    expect(hierarchy).toEqual(['Supreme Court', 'Circuit Courts of Appeals', 'District Courts'])
  })

  it('returns empty array for jurisdictions without hierarchy', () => {
    const hierarchy = getCourtHierarchy('EU')
    expect(hierarchy).toEqual([])
  })
})

describe('ContractClauseType', () => {
  it('validates valid clause types', () => {
    const result = ContractClauseType.safeParse('indemnification')
    expect(result.success).toBe(true)
  })

  it('rejects invalid clause types', () => {
    const result = ContractClauseType.safeParse('invalid_clause')
    expect(result.success).toBe(false)
  })

  it('has 14 clause types', () => {
    const types = ContractClauseType.options
    expect(types).toHaveLength(14)
  })
})

describe('CLAUSE_DESCRIPTIONS', () => {
  it('has descriptions for all clause types', () => {
    for (const type of ContractClauseType.options) {
      expect(CLAUSE_DESCRIPTIONS[type]).toBeDefined()
      expect(CLAUSE_DESCRIPTIONS[type].description).toBeTruthy()
      expect(CLAUSE_DESCRIPTIONS[type].risk_flags).toBeInstanceOf(Array)
    }
  })
})

describe('extractClauses()', () => {
  it('extracts indemnification clause from text', () => {
    const text = 'The Seller agrees to indemnify and hold harmless the Buyer from any losses.'
    const clauses = extractClauses(text)
    expect(clauses.length).toBeGreaterThanOrEqual(1)
    expect(clauses.some(c => c.type === 'indemnification')).toBe(true)
  })

  it('extracts confidentiality clause from text', () => {
    const text = 'All confidential information shall be kept strictly confidential.'
    const clauses = extractClauses(text)
    expect(clauses.some(c => c.type === 'confidentiality')).toBe(true)
  })

  it('returns empty array for text with no clauses', () => {
    const text = 'The weather is nice today.'
    const clauses = extractClauses(text)
    expect(clauses.length).toBe(0)
  })

  it('sorts clauses by position', () => {
    const text = 'Confidentiality is key. Indemnification is also important.'
    const clauses = extractClauses(text)
    for (let i = 1; i < clauses.length; i++) {
      expect(clauses[i].startIndex).toBeGreaterThanOrEqual(clauses[i - 1].startIndex)
    }
  })

  it('extracts multiple clause types from complex text', () => {
    const text = `
      The governing law of this Agreement shall be Delaware law.
      The Seller agrees to indemnify and hold harmless the Buyer.
      All confidential information shall be protected.
      Either party may terminate this agreement with 30 days notice.
    `
    const clauses = extractClauses(text)
    const types = new Set(clauses.map(c => c.type))
    expect(types.has('governing_law')).toBe(true)
    expect(types.has('indemnification')).toBe(true)
    expect(types.has('confidentiality')).toBe(true)
    expect(types.has('termination')).toBe(true)
  })
})

describe('getClauseDescription()', () => {
  it('returns description for known clause type', () => {
    const info = getClauseDescription('force_majeure')
    expect(info).toBeDefined()
    expect(info.description).toContain('Excused performance')
  })
})

describe('LegalDomain', () => {
  it('validates valid domains', () => {
    const result = LegalDomain.safeParse('contracts')
    expect(result.success).toBe(true)
  })

  it('rejects invalid domains', () => {
    const result = LegalDomain.safeParse('invalid_domain')
    expect(result.success).toBe(false)
  })
})

describe('MCPToolDefinition', () => {
  it('validates a correct tool definition', () => {
    const result = MCPToolDefinition.safeParse({
      name: 'test_tool',
      description: 'A test tool',
      input_schema: { type: 'object', properties: {} },
    })
    expect(result.success).toBe(true)
  })
})

describe('CitationFormat Schema', () => {
  it('validates a correct citation format', () => {
    const result = CitationFormat.safeParse({
      jurisdiction: 'US',
      format_name: 'Test Format',
      pattern: '\\d+ Test\\. \\d+',
      example: '123 Test. 456',
      components: [{ name: 'volume', description: 'Volume', required: true }],
    })
    expect(result.success).toBe(true)
  })
})

describe('CITATION_FORMATS', () => {
  it('has 4 defined formats', () => {
    expect(CITATION_FORMATS.length).toBe(4)
  })
})

describe('validateCitationText()', () => {
  it('validates a US citation correctly', () => {
    const result = validateCitationText('410 U.S. 113')
    expect(result.valid).toBe(true)
    expect(result.format?.format_name).toBe('U.S. Reports')
  })

  it('validates a UK neutral citation', () => {
    const result = validateCitationText('[2024] UKSC 1')
    expect(result.valid).toBe(true)
    expect(result.format?.jurisdiction).toBe('UK')
  })

  it('validates an ECLI citation', () => {
    const result = validateCitationText('ECLI:EU:C:2024:123')
    expect(result.valid).toBe(true)
    expect(result.format?.format_name).toBe('ECLI')
  })

  it('rejects invalid citations', () => {
    const result = validateCitationText('not a citation')
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})

describe('parseCitation()', () => {
  it('parses a US citation into components', () => {
    const result = parseCitation('410 U.S. 113')
    expect(result).not.toBeNull()
    expect(result?.format.format_name).toBe('U.S. Reports')
    expect(result?.components.volume).toBe('410')
    expect(result?.components.page).toBe('113')
  })

  it('returns null for unrecognized citation', () => {
    const result = parseCitation('garbage text')
    expect(result).toBeNull()
  })
})

describe('getFormatsByJurisdiction()', () => {
  it('returns formats for US', () => {
    const formats = getFormatsByJurisdiction('US')
    expect(formats.length).toBe(2)
  })

  it('returns empty array for jurisdiction without formats', () => {
    const formats = getFormatsByJurisdiction('AU')
    expect(formats).toEqual([])
  })
})
