import { createServer as createHTTPServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { createAuditLogger, createInputValidator, createPermissionChecker, createRateLimiter } from './middleware.js'

export type { MiddlewareContext, PermissionCheck, AuditEntry } from './middleware.js'

export {
  createAuditLogger,
  createInputValidator,
  createPermissionChecker,
  createRateLimiter,
}

export interface ToolDefinition {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  handler: (args: Record<string, unknown>) => ToolResult | Promise<ToolResult>
  jurisdiction?: string[]
  legalDomains?: string[]
  safetyNotes?: string[]
}

export interface ToolResult {
  content: Array<{ type: 'text' | 'image' | 'resource'; text?: string; data?: string; mimeType?: string }>
  isError?: boolean
}

export interface ServerOptions {
  name: string
  version: string
  tools: ToolDefinition[]
  instructions?: string
  transport?: 'stdio' | 'http'
  port?: number
  host?: string
  auditLogger?: ReturnType<typeof createAuditLogger>
  rateLimiter?: ReturnType<typeof createRateLimiter>
}

export interface MCPServer {
  name: string
  version: string
  start: () => void
  stop: () => void
  getTools: () => ToolDefinition[]
}

export function createLegalMCPServer(options: ServerOptions): MCPServer {
  const { name, version, tools, transport = 'stdio', port = 3000, host = '127.0.0.1' } = options

  const transportInstance = transport === 'http'
    ? createHTTPTransport(options)
    : createSTDIOTransport(options)

  return {
    name,
    version,
    start: () => transportInstance.start(),
    stop: () => transportInstance.stop(),
    getTools: () => [...tools],
  }
}

interface Transport {
  start: () => void
  stop: () => void
}

function createSTDIOTransport(options: ServerOptions): Transport {
  const { tools, auditLogger, rateLimiter } = options
  let running = false

  const toolMap = new Map(tools.map(t => [t.name, t]))

  async function handleRequest(request: {
    id: unknown
    method: string
    params?: Record<string, unknown>
  }): Promise<Record<string, unknown> | null> {
    const { id, method, params } = request

    if (method === 'initialize') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: options.name, version: options.version },
        },
      }
    }

    if (method === 'tools/list') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          tools: tools.map(t => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema,
          })),
        },
      }
    }

    if (method === 'tools/call') {
      const p = params as { name?: string; arguments?: Record<string, unknown> } | undefined
      const toolName = p?.name
      const args = p?.arguments || {}

      const startTime = Date.now()

      if (!toolName) {
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32602, message: 'Missing tool name' },
        }
      }

      if (rateLimiter) {
        const check = rateLimiter.check(toolName)
        if (!check.allowed) {
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32000, message: 'Rate limit exceeded', data: { resetMs: check.resetMs } },
          }
        }
      }

      const tool = toolMap.get(toolName)
      if (!tool) {
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32602, message: `Unknown tool: ${toolName}` },
        }
      }

      const validator = createInputValidator(tool.inputSchema)
      const validation = validator.validate(args)
      if (!validation.valid) {
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32602, message: `Invalid arguments: ${validation.errors.join('; ')}` },
        }
      }

      try {
        const result = await tool.handler(args)
        const duration = Date.now() - startTime

        if (auditLogger) {
          auditLogger.log({
            method: 'tools/call',
            toolName,
            success: !result.isError,
            durationMs: duration,
            requestSize: JSON.stringify(args).length,
          })
        }

        return { jsonrpc: '2.0', id, result }
      } catch (err) {
        const duration = Date.now() - startTime
        if (auditLogger) {
          auditLogger.log({
            method: 'tools/call',
            toolName,
            success: false,
            durationMs: duration,
            requestSize: JSON.stringify(args).length,
          })
        }
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32603,
            message: err instanceof Error ? err.message : 'Internal error',
          },
        }
      }
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

  return {
    start: () => {
      if (running) return
      running = true

      process.stdin.setEncoding('utf-8')
      let buffer = ''

      process.stdin.on('data', (chunk: string) => {
        buffer += chunk
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const request = JSON.parse(line)
            handleRequest(request).then(response => {
              if (response) {
                process.stdout.write(JSON.stringify(response) + '\n')
              }
            })
          } catch {
            process.stderr.write(JSON.stringify({
              jsonrpc: '2.0',
              error: { code: -32700, message: 'Parse error' },
            }) + '\n')
          }
        }
      })

      process.stderr.write(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Server "${options.name}" v${options.version} started on stdio`,
      }) + '\n')
    },
    stop: () => {
      running = false
      process.stdin.removeAllListeners('data')
      process.stderr.write(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Server stopped',
      }) + '\n')
    },
  }
}

function createHTTPTransport(options: ServerOptions): Transport {
  const tools = options.tools
  const port = options.port || 3000
  const host = options.host || '127.0.0.1'
  const auditLogger = options.auditLogger

  const toolMap = new Map(tools.map(t => [t.name, t]))
  const sseClients: Set<ServerResponse> = new Set()

  let server: ReturnType<typeof createHTTPServer> | null = null
  let shutdownHandlers: Array<() => void> = []

  function sendSSEEvent(res: ServerResponse, event: string, data: string) {
    res.write(`event: ${event}\n`)
    res.write(`data: ${data}\n\n`)
  }

  async function handleJSONRPC(body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { id, method, params } = body

    if (method === 'initialize') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: options.name, version: options.version },
        },
      }
    }

    if (method === 'tools/list') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          tools: tools.map(t => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema,
          })),
        },
      }
    }

    if (method === 'tools/call') {
      const p = params as { name?: string; arguments?: Record<string, unknown> } | undefined
      const toolName = p?.name
      const args = p?.arguments || {}

      if (!toolName) {
        return { jsonrpc: '2.0', id, error: { code: -32602, message: 'Missing tool name' } }
      }

      const tool = toolMap.get(toolName)
      if (!tool) {
        return { jsonrpc: '2.0', id, error: { code: -32602, message: `Unknown tool: ${toolName}` } }
      }

      const startTime = Date.now()

      try {
        const result = await tool.handler(args)
        const duration = Date.now() - startTime

        for (const client of sseClients) {
          sendSSEEvent(client, 'tool_call', JSON.stringify({ toolName, status: 'completed' }))
        }

        if (auditLogger) {
          auditLogger.log({
            method: 'tools/call',
            toolName,
            success: !result.isError,
            durationMs: duration,
            requestSize: JSON.stringify(args).length,
          })
        }

        return { jsonrpc: '2.0', id, result }
      } catch (err) {
        const duration = Date.now() - startTime
        if (auditLogger) {
          auditLogger.log({
            method: 'tools/call',
            toolName,
            success: false,
            durationMs: duration,
            requestSize: JSON.stringify(args).length,
          })
        }
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32603,
            message: err instanceof Error ? err.message : 'Internal error',
          },
        }
      }
    }

    return {
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method not found: ${method}` },
    }
  }

  function setCORSHeaders(res: ServerResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Access-Control-Max-Age', '86400')
  }

  function handleRequest(req: IncomingMessage, res: ServerResponse) {
    setCORSHeaders(res)

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    if (req.method === 'GET' && req.url === '/mcp/sse') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      })
      res.write('\n')
      sendSSEEvent(res, 'endpoint', JSON.stringify({ url: `http://${host}:${port}/mcp` }))

      sseClients.add(res)
      req.on('close', () => {
        sseClients.delete(res)
      })
      return
    }

    if (req.method === 'POST' && req.url === '/mcp') {
      let body = ''
      req.on('data', (chunk: string) => { body += chunk })
      req.on('end', async () => {
        try {
          const json = JSON.parse(body)
          const response = await handleJSONRPC(json)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(response))
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' } }))
        }
      })
      return
    }

    if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ name: options.name, version: options.version, status: 'ok' }))
      return
    }

    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found' }))
  }

  function closeAll() {
    for (const client of sseClients) {
      try { client.end() } catch { /* ignore */ }
    }
    sseClients.clear()
    if (server) {
      server.close()
      server = null
    }
  }

  return {
    start: () => {
      server = createHTTPServer(handleRequest)
      server.listen(port, host, () => {
        process.stderr.write(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Server "${options.name}" v${options.version} listening on http://${host}:${port}/mcp`,
        }) + '\n')
      })

      const onShutdown = () => {
        closeAll()
        process.exit(0)
      }
      process.on('SIGTERM', onShutdown)
      process.on('SIGINT', onShutdown)
      shutdownHandlers = [() => process.removeListener('SIGTERM', onShutdown), () => process.removeListener('SIGINT', onShutdown)]
    },
    stop: () => {
      closeAll()
      for (const cleanup of shutdownHandlers) {
        cleanup()
      }
      shutdownHandlers = []
    },
  }
}
