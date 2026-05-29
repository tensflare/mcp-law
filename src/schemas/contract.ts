import { CLAUSE_DESCRIPTIONS, ContractClauseType } from './index.js'
import type { ContractClauseType as ContractClauseTypeEnum } from './index.js'

export { ContractClauseType, CLAUSE_DESCRIPTIONS }

export interface ClauseMatch {
  type: ContractClauseTypeEnum
  text: string
  startIndex: number
  endIndex: number
  riskFlags: string[]
}

export const CLAUSE_PATTERNS: Record<ContractClauseTypeEnum, RegExp[]> = {
  indemnification: [/indemnif(y|ication|ied)/i, /hold.?harmless/i, /agree to defend/i],
  limitation_of_liability: [/limitation of liab/i, /cap on liab/i, /maximum liab/i, /total liab/i, /excluding liab/i],
  governing_law: [/governing law/i, /choice of law/i, /proper law/i, /applicable law/i],
  dispute_resolution: [/arbitrat/i, /dispute resol/i, /mediation/i, /binding arbit/i, /dispute.?resolution/i],
  confidentiality: [/confidential/i, /proprietary/i, /non.?disclosure/i, /trade secret/i],
  termination: [/terminat(i|ion|e)/i, /cancel/i, /wind.?down/i, /dissolution/i],
  payment_terms: [/payment/i, /invoice/i, /net \d+/i, /pricing/i, /fee/i, /compensation/i],
  ip_ownership: [/intellectual property/i, /work.?for.?hire/i, /assignment of/i, /IP/i, /patent/i, /copyright/i, /trademark/i],
  warranty: [/warrant(y|ies|ed)/i, /as.?is/i, /guarantee/i, /representation/i],
  force_majeure: [/force majeure/i, /act of god/i, /unavoidable/i, /extraordinary event/i],
  non_compete: [/non.?compete/i, /covenant not to compete/i, /restrictive covenant/i],
  data_privacy: [/data privacy/i, /personal data/i, /GDPR/i, /CCPA/i, /data protection/i, /personally identifiable/i],
  assignment: [/assign/i, /transfer.*right/i, /delegat/i, /novat/i],
  entire_agreement: [/entire agreement/i, /merger clause/i, /supersedes/i, /complete agreement/i, /integrat(i|ion)/i],
}

export function extractClauses(text: string): ClauseMatch[] {
  const clauses: ClauseMatch[] = []
  for (const [type, patterns] of Object.entries(CLAUSE_PATTERNS)) {
    for (const regex of patterns) {
      const globalRegex = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g')
      const matches = text.matchAll(globalRegex)
      for (const match of matches) {
        if (match.index !== undefined) {
          const clauseType = type as ContractClauseTypeEnum
          const info = CLAUSE_DESCRIPTIONS[clauseType]
          clauses.push({
            type: clauseType,
            text: match[0],
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            riskFlags: info?.risk_flags ?? [],
          })
        }
      }
    }
  }
  clauses.sort((a, b) => a.startIndex - b.startIndex)
  return clauses
}

export function getClauseDescription(type: ContractClauseTypeEnum) {
  return CLAUSE_DESCRIPTIONS[type]
}
