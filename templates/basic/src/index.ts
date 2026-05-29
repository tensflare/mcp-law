#!/usr/bin/env node

const server = {
  name: 'basic-mcp-server',
  version: '0.1.0',
  tools: [
    {
      name: 'greet',
      description: 'A simple greeting tool — demonstrates the MCP tool pattern',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'The name to greet' },
          greeting: { type: 'string', description: 'Custom greeting (optional)', default: 'Hello' },
        },
        required: ['name'],
      },
    },
  ],
}

async function handleToolCall(name, args) {
  if (name === 'greet') {
    const { name: userName, greeting } = args
    return {
      content: [{ type: 'text', text: `${greeting || 'Hello'}, ${userName}! Welcome to your MCP server.` }],
    }
  }
  return {
    content: [{ type: 'text', text: JSON.stringify({ error: `Unknown tool: ${name}` }) }],
    isError: true,
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
