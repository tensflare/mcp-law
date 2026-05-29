# Creating Legal MCP Servers

Advanced guide to building MCP servers with jurisdiction support, security middleware, and contract analysis capabilities.

## Architecture Overview

An MCP server built with MCP-Law follows the JSON-RPC 2.0 protocol over stdio (local) or HTTP/SSE (remote). The server:

1. Receives JSON-RPC requests on stdin (stdio) or HTTP POST `/mcp` (HTTP)
2. Processes `initialize`, `tools/list`, and `tools/call` methods
3. Returns JSON-RPC responses on stdout or as HTTP responses

## Using the Server Builder

MCP-Law provides a `createLegalMCPServer()` function for programmatic server creation:

```typescript
import { createLegalMCPServer, createAuditLogger, createRateLimiter } from '@tensflare/mcp-law/server'

const server = createLegalMCPServer({
  name: 'my-legal-server',
  version: '0.1.0',
  tools: [
    {
      name: 'analyze_jurisdiction',
      description: 'Analyze legal text under a specific jurisdiction',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          jurisdiction: { type: 'string' },
        },
        required: ['text', 'jurisdiction'],
      },
      handler: async (args) => {
        // Your logic here
        return {
          content: [{ type: 'text', text: JSON.stringify({ result: 'analysis complete' }) }],
        }
      },
    },
  ],
  transport: 'stdio', // or 'http'
  auditLogger: createAuditLogger({ output: 'stderr' }),
  rateLimiter: createRateLimiter({ maxRequests: 100, windowMs: 60000 }),
})

server.start()
```

## Jurisdiction-Aware Tools

When building jurisdiction-aware tools, follow this pattern:

```typescript
import { getJurisdiction, validateCitationText } from '@tensflare/mcp-law/schemas'

const handler = async (args) => {
  const { jurisdiction } = args
  const info = getJurisdiction(jurisdiction.toUpperCase())

  if (!info) {
    return {
      content: [{ type: 'text', text: `Unknown jurisdiction: ${jurisdiction}` }],
      isError: true,
    }
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(info, null, 2) }],
  }
}
```

## Contract Analysis Tools

For contract analysis tools, use the clause extraction and risk assessment utilities:

```typescript
import { extractClauses, CLAUSE_DESCRIPTIONS } from '@tensflare/mcp-law/schemas'

const handler = async (args) => {
  const { text } = args
  const clauses = extractClauses(text)

  const highRisk = clauses.filter(c =>
    CLAUSE_DESCRIPTIONS[c.type]?.risk_flags.length > 0
  )

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        totalClauses: clauses.length,
        highRiskClauses: highRisk.length,
        clauses: clauses.map(c => ({
          type: c.type,
          description: CLAUSE_DESCRIPTIONS[c.type]?.description,
          riskFlags: c.riskFlags,
        })),
      }, null, 2),
    }],
  }
}
```

## HTTP Transport

To run your server over HTTP instead of stdio:

```typescript
import { createLegalMCPServer } from '@tensflare/mcp-law/server'

const server = createLegalMCPServer({
  name: 'my-server',
  version: '0.1.0',
  tools: [...],
  transport: 'http',
  port: 3000,
  host: '127.0.0.1',
})

server.start()
// Server listens on http://127.0.0.1:3000/mcp
```

## Security Middleware

### Audit Logging

```typescript
import { createAuditLogger } from '@tensflare/mcp-law/server'

const logger = createAuditLogger({ output: 'stderr' })

// Each tool call is automatically logged when passed to createLegalMCPServer
```

### Permission Checking

```typescript
import { createPermissionChecker } from '@tensflare/mcp-law/server'

const checker = createPermissionChecker(['admin', 'attorney'])

const check = checker.check(
  { userId: 'user1', roles: ['attorney'], permissions: ['analyze_contracts'], jurisdiction: 'US' },
  'analyze_contracts'
)
```

### Rate Limiting

```typescript
import { createRateLimiter } from '@tensflare/mcp-law/server'

const limiter = createRateLimiter({ maxRequests: 50, windowMs: 60000 })

const { allowed, remaining } = limiter.check('tool_name')
```

### Input Validation

```typescript
import { createInputValidator } from '@tensflare/mcp-law/server'

const validator = createInputValidator({
  type: 'object',
  properties: {
    text: { type: 'string' },
    jurisdiction: { type: 'string' },
  },
  required: ['text'],
})

const { valid, errors } = validator.validate({ text: 'hello' })
```

## Registry Integration

Register your server with the MCP-Law registry by contributing to the registry data source. See the registry source at `src/registry/index.ts` for the entry schema.

## Publishing

1. Build the project: `npm run build`
2. Publish to npm: `npm publish`
3. Add your server to the MCP-Law registry via pull request
