import type { MCPServerEntry } from '../schemas/index.js'

export interface RegistryEntry extends MCPServerEntry {
  id: string
  addedAt: string
  updatedAt: string
  version: string
  installCommand?: string
  documentationUrl?: string
  license?: string
}

export interface RegistryQuery {
  jurisdiction?: string
  legalDomain?: string
  tool?: string
  verified?: boolean
  query?: string
}

export interface RegistrySearchResult {
  entries: RegistryEntry[]
  total: number
  query: RegistryQuery
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}
