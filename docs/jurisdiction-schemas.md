# Jurisdiction Schemas

MCP-Law provides a comprehensive set of schemas for representing legal jurisdictions, citations, and contract clauses. These are built with [Zod](https://zod.dev/) for runtime validation and TypeScript type inference.

## Jurisdiction

```typescript
import { Jurisdiction, JURISDICTIONS } from '@tensflare/mcp-law/schemas'

const info = Jurisdiction.parse({
  code: 'US',
  name: 'United States (Federal)',
  legal_system: 'common_law',
  language: 'en',
  currency: 'USD',
  citation_format: '\\d+ U\\.S\\. \\d+',
  court_hierarchy: ['Supreme Court', 'Circuit Courts of Appeals', 'District Courts'],
})
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `code` | `string` | Jurisdiction code (e.g., `US`, `UK`, `EU`) |
| `name` | `string` | Human-readable name |
| `legal_system` | `enum` | `common_law`, `civil_law`, `mixed`, `religious`, `customary` |
| `language` | `string` | Language code(s) |
| `currency` | `string?` | ISO currency code |
| `citation_format` | `string?` | Regex pattern for citations |
| `statute_format` | `string?` | Regex pattern for statutes |
| `court_hierarchy` | `string[]?` | Ordered list of court levels |

### Built-in Jurisdictions

| Code | Name | System |
|------|------|--------|
| `US` | United States (Federal) | common_law |
| `US-CA` | California (US State) | common_law |
| `UK` | United Kingdom | common_law |
| `EU` | European Union | civil_law |
| `AU` | Australia | common_law |
| `SG` | Singapore | common_law |
| `IN` | India | common_law |
| `CA` | Canada (Federal) | common_law |
| `DE` | Germany | civil_law |
| `FR` | France | civil_law |

## Citation Formats

```typescript
import { CITATION_FORMATS, validateCitationText, parseCitation } from '@tensflare/mcp-law/schemas'
```

### Defined Formats

| Jurisdiction | Format | Example | Pattern |
|-------------|--------|---------|---------|
| US | U.S. Reports | `410 U.S. 113` | `\d+ U\.S\. \d+` |
| US | Federal Reporter | `987 F.3d 123` | `\d+ F\.\d+d \d+` |
| UK | Neutral Citation | `[2024] UKSC 1` | `\[\d{4}\] UKSC \d+` |
| EU | ECLI | `ECLI:EU:C:2024:123` | `ECLI:[A-Z]{2}:\w+:\d+:\d+` |

### Validation

```typescript
// Validate a citation against all known formats
const result = validateCitationText('410 U.S. 113')
// { valid: true, format: { format_name: 'U.S. Reports', ... }, errors: [] }

// Validate against a specific jurisdiction
import { validateCitation } from '@tensflare/mcp-law/schemas/jurisdiction'
const result = validateCitation('US', '410 U.S. 113')
// { valid: true, format: 'U.S. Reports' }
```

### Parsing

```typescript
const parsed = parseCitation('410 U.S. 113')
// {
//   format: { format_name: 'U.S. Reports', ... },
//   components: { volume: '410', reporter: 'U.S.', page: '113' }
// }
```

## Contract Clause Types

| Clause Type | Description | Risk Flags |
|-------------|-------------|------------|
| `indemnification` | Obligation to compensate for loss | Unilateral indemnity, No cap on liability |
| `limitation_of_liability` | Cap on total liability | Excluded from mutual, No cap |
| `governing_law` | Which law governs | Unfavorable jurisdiction, Mandatory foreign law |
| `dispute_resolution` | How disputes are resolved | Mandatory arbitration, Remote venue |
| `confidentiality` | Handling proprietary info | No sunset, Overbroad definition |
| `termination` | How the agreement ends | One-sided termination, No cure period |
| `payment_terms` | Pricing and payment | Net-90+, Auto-renewal |
| `ip_ownership` | Who owns IP created | Work-for-hire assignment, No license back |
| `warranty` | Guarantees | Disclaimer of all warranties, AS-IS |
| `force_majeure` | Excused performance | Pandemic excluded, No notice |
| `non_compete` | Competition restrictions | Overbroad scope, Excessive duration |
| `data_privacy` | Personal data handling | No GDPR/CCPA mention, Unlimited data use |
| `assignment` | Rights transfer | No consent required, Change of control |
| `entire_agreement` | Merger clause | No anti-reliance clause |

## Contract Clause Extraction

```typescript
import { extractClauses } from '@tensflare/mcp-law/schemas'

const text = `
  The Seller agrees to indemnify and hold harmless the Buyer.
  This agreement shall be governed by the laws of Delaware.
  All confidential information will be protected.
`

const clauses = extractClauses(text)
// Returns array of ClauseMatch objects with type, text, position, and risk flags
```

## Legal Domains

| Domain | Description |
|--------|-------------|
| `contracts` | Contract law |
| `litigation` | Litigation and dispute resolution |
| `corporate` | Corporate law |
| `ip` | Intellectual property |
| `employment` | Employment and labor |
| `tax` | Tax law |
| `real_estate` | Real estate |
| `regulatory` | Regulatory compliance |
| `family` | Family law |
| `estate` | Estates and trusts |
