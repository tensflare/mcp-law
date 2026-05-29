import { JURISDICTIONS } from './index.js'
import type { Jurisdiction } from './index.js'
import { validateCitationText, getFormatsByJurisdiction } from './citation.js'

export function getJurisdiction(code: string): Jurisdiction | undefined {
  return JURISDICTIONS[code]
}

export function listJurisdictions(): Jurisdiction[] {
  return Object.values(JURISDICTIONS)
}

export function searchJurisdictions(query: string): Jurisdiction[] {
  const lower = query.toLowerCase()
  return Object.values(JURISDICTIONS).filter(j =>
    j.code.toLowerCase().includes(lower) ||
    j.name.toLowerCase().includes(lower) ||
    j.legal_system.includes(lower) ||
    j.language.includes(lower)
  )
}

export function getCitationFormats(jurisdictionCode: string) {
  return getFormatsByJurisdiction(jurisdictionCode)
}

export function validateCitation(jurisdictionCode: string, citation: string): { valid: boolean; format?: string; error?: string } {
  const formats = getFormatsByJurisdiction(jurisdictionCode)
  if (formats.length === 0) {
    return { valid: false, error: `No citation formats defined for jurisdiction: ${jurisdictionCode}` }
  }
  const result = validateCitationText(citation)
  if (!result.valid) {
    return { valid: false, error: result.errors.join('; ') }
  }
  if (result.format && result.format.jurisdiction !== jurisdictionCode) {
    return { valid: false, error: `Citation does not match any known format for ${jurisdictionCode}` }
  }
  return { valid: true, format: result.format?.format_name }
}

export function getCourtHierarchy(jurisdictionCode: string): string[] {
  const j = JURISDICTIONS[jurisdictionCode]
  return j?.court_hierarchy ?? []
}
