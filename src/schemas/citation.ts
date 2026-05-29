import { CITATION_FORMATS } from './index.js'
import type { CitationFormat } from './index.js'

export { CITATION_FORMATS }
export type { CitationFormat }

export function validateCitationText(citation: string): { valid: boolean; format?: CitationFormat; errors: string[] } {
  for (const fmt of CITATION_FORMATS) {
    try {
      const regex = new RegExp(`^${fmt.pattern}$`)
      if (regex.test(citation.trim())) {
        return { valid: true, format: fmt, errors: [] }
      }
    } catch {
      continue
    }
  }
  return { valid: false, errors: ['Citation does not match any known format'] }
}

export function parseCitation(citation: string): { format: CitationFormat; components: Record<string, string> } | null {
  for (const fmt of CITATION_FORMATS) {
    try {
      const regex = new RegExp(`^${fmt.pattern}$`)
      const match = citation.trim().match(regex)
      if (match) {
        const components: Record<string, string> = {}
        fmt.components.forEach((comp, i) => {
          const val = match[i + 1]
          if (val) {
            components[comp.name] = val
          }
        })
        return { format: fmt, components }
      }
    } catch {
      continue
    }
  }
  return null
}

export function getFormatsByJurisdiction(code: string): CitationFormat[] {
  return CITATION_FORMATS.filter(f => f.jurisdiction === code)
}

export function getAllFormatNames(): string[] {
  return CITATION_FORMATS.map(f => f.format_name)
}
