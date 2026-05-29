#!/usr/bin/env node
import { getJurisdiction, validateCitationText } from '@tensflare/mcp-law/schemas'

const SUPPORTED_JURISDICTIONS = ['US', 'UK', 'EU', 'DE', 'FR', 'AU', 'SG', 'IN', 'CA']

const server = {
  name: 'jurisdiction-aware-mcp-server',
  version: '0.1.0',
  tools: [
    {
      name: 'get_jurisdiction_info',
      description: 'Get legal metadata for a specified jurisdiction',
      inputSchema: {
        type: 'object',
        properties: {
          jurisdiction: { type: 'string', description: 'Jurisdiction code (e.g., US, UK, EU, DE)' },
        },
        required: ['jurisdiction'],
      },
    },
    {
      name: 'validate_citation',
      description: 'Validate a legal citation against jurisdiction format rules',
      inputSchema: {
        type: 'object',
        properties: {
          jurisdiction: { type: 'string', description: 'Jurisdiction code (e.g., US, UK, EU)' },
          citation: { type: 'string', description: 'The citation text to validate' },
        },
        required: ['jurisdiction', 'citation'],
      },
    },
    {
      name: 'search_statutes',
      description: 'Search for statutes by keyword and jurisdiction',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          jurisdiction: { type: 'string', description: 'Jurisdiction code (e.g., US, UK, EU)' },
        },
        required: ['query', 'jurisdiction'],
      },
    },
  ],
}

function handleToolCall(name, args) {
  switch (name) {
    case 'get_jurisdiction_info': {
      const { jurisdiction } = args
      if (!SUPPORTED_JURISDICTIONS.includes(jurisdiction.toUpperCase())) {
        return Promise.resolve({
          content: [{ type: 'text', text: `Unsupported jurisdiction: ${jurisdiction}. Supported: ${SUPPORTED_JURISDICTIONS.join(', ')}` }],
          isError: true,
        })
      }
      const info = getJurisdiction(jurisdiction.toUpperCase())
      return Promise.resolve({
        content: [{ type: 'text', text: JSON.stringify(info, null, 2) }],
      })
    }

    case 'validate_citation': {
      const { jurisdiction, citation } = args
      const result = validateCitationText(citation)
      const matchesJurisdiction = result.format && result.format.jurisdiction === jurisdiction.toUpperCase()
      return Promise.resolve({
        content: [{
          type: 'text',
          text: JSON.stringify({
            citation,
            jurisdiction,
            valid: matchesJurisdiction,
            format: result.format?.format_name || null,
            errors: matchesJurisdiction ? [] : ['Citation does not match the specified jurisdiction\'s format'],
            jurisdictionFormat: result.format ? {
              name: result.format.format_name,
              example: result.format.example,
              pattern: result.format.pattern,
            } : null,
          }, null, 2),
        }],
      })
    }

    case 'search_statutes': {
      const { query, jurisdiction } = args
      if (!SUPPORTED_JURISDICTIONS.includes(jurisdiction.toUpperCase())) {
        return Promise.resolve({
          content: [{ type: 'text', text: `Unsupported jurisdiction: ${jurisdiction}` }],
          isError: true,
        })
      }
      return Promise.resolve({
        content: [{
          type: 'text',
          text: JSON.stringify({
            query,
            jurisdiction,
            results: [],
            message: 'Statute search requires integration with a legal research API. This is a scaffolded stub ready for implementation.',
            supportedJurisdictions: SUPPORTED_JURISDICTIONS,
          }, null, 2),
        }],
      })
    }

    default:
      return Promise.resolve({
        content: [{ type: 'text', text: JSON.stringify({ error: `Unknown tool: ${name}` }) }],
        isError: true,
      })
  }
}

function handleRequest(request) {
  const { id, method, params } = request

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: server.name, version: server.version },
      },
    }
  }

  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: { tools: server.tools },
    }
  }

  if (method === 'tools/call') {
    const toolName = params?.name
    const args = params?.arguments || {}
    return handleToolCall(toolName, args).then(result => ({
      jsonrpc: '2.0',
      id,
      result,
    }))
  }

  if (method === 'notifications/initialized') {
    return null
  }

  return {
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: `Method not found: ${method}` },
  }
}

process.stdin.setEncoding('utf-8')
let buffer = ''
process.stderr.write(`mcp-law: Server "${server.name}" v${server.version} started on stdio\n`)

process.stdin.on('data', (chunk) => {
  buffer += chunk
  const lines = buffer.split('\n')
  buffer = lines.pop() || ''
  for (const line of lines) {
    if (!line.trim()) continue
    try {
      const request = JSON.parse(line)
      const response = handleRequest(request)
      if (response) {
        process.stdout.write(JSON.stringify(response) + '\n')
      }
    } catch (err) {
      process.stderr.write(JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32700, message: 'Parse error' },
      }) + '\n')
    }
  }
})
