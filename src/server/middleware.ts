import type { IncomingMessage, ServerResponse } from 'node:http'

export interface AuditEntry {
  timestamp: string
  method: string
  toolName?: string
  jurisdiction?: string
  userId?: string
  success: boolean
  durationMs: number
  requestSize: number
}

export interface PermissionCheck {
  allowed: boolean
  reason?: string
}

export interface MiddlewareContext {
  jurisdiction?: string
  userId?: string
  roles: string[]
  permissions: string[]
}

export function createAuditLogger(options: { output?: 'stdout' | 'stderr' | ((entry: AuditEntry) => void) } = {}) {
  const logFn = options.output === 'stderr'
    ? (entry: AuditEntry) => process.stderr.write(JSON.stringify(entry) + '\n')
    : options.output === 'stdout'
      ? (entry: AuditEntry) => process.stdout.write(JSON.stringify(entry) + '\n')
      : options.output || ((entry: AuditEntry) => process.stderr.write(JSON.stringify(entry) + '\n'))

  return {
    log: (entry: Omit<AuditEntry, 'timestamp'>) => {
      logFn({ ...entry, timestamp: new Date().toISOString() })
    },
    middleware: (ctx: { method: string; toolName?: string; jurisdiction?: string; userId?: string; success: boolean; durationMs: number; requestSize: number }) => {
      logFn({ ...ctx, timestamp: new Date().toISOString() })
    },
  }
}

export function createPermissionChecker(allowedRoles: string[] = []) {
  return {
    check: (context: MiddlewareContext, requiredPermission: string): PermissionCheck => {
      if (allowedRoles.length > 0 && !context.roles.some(r => allowedRoles.includes(r))) {
        return { allowed: false, reason: `Required one of roles: ${allowedRoles.join(', ')}` }
      }
      if (!context.permissions.includes(requiredPermission)) {
        return { allowed: false, reason: `Missing required permission: ${requiredPermission}` }
      }
      return { allowed: true }
    },
  }
}

export function createInputValidator(schema: Record<string, unknown>) {
  return {
    validate: (input: Record<string, unknown>): { valid: boolean; errors: string[] } => {
      const errors: string[] = []
      if (schema.required && Array.isArray(schema.required)) {
        for (const field of schema.required as string[]) {
          if (input[field] === undefined || input[field] === null) {
            errors.push(`Missing required field: ${field}`)
          }
        }
      }
      if (schema.properties && typeof schema.properties === 'object') {
        for (const [key, value] of Object.entries(schema.properties as Record<string, unknown>)) {
          if (input[key] !== undefined && typeof value === 'object' && value !== null) {
            const propSchema = value as { type?: string }
            if (propSchema.type === 'string' && typeof input[key] !== 'string') {
              errors.push(`Field "${key}" must be a string`)
            } else if (propSchema.type === 'number' && typeof input[key] !== 'number') {
              errors.push(`Field "${key}" must be a number`)
            } else if (propSchema.type === 'array' && !Array.isArray(input[key])) {
              errors.push(`Field "${key}" must be an array`)
            }
          }
        }
      }
      return { valid: errors.length === 0, errors }
    },
  }
}

export function createRateLimiter(options: { maxRequests: number; windowMs: number }) {
  const requests: Map<string, number[]> = new Map()

  const cleanup = () => {
    const now = Date.now()
    for (const [key, timestamps] of requests.entries()) {
      const valid = timestamps.filter(t => now - t < options.windowMs)
      if (valid.length === 0) {
        requests.delete(key)
      } else {
        requests.set(key, valid)
      }
    }
  }

  const intervalId = setInterval(cleanup, options.windowMs)

  return {
    check: (key: string): { allowed: boolean; remaining: number; resetMs: number } => {
      const now = Date.now()
      const timestamps = requests.get(key) || []
      const valid = timestamps.filter(t => now - t < options.windowMs)

      if (valid.length >= options.maxRequests) {
        const oldest = valid[0]
        const resetMs = oldest + options.windowMs - now
        return { allowed: false, remaining: 0, resetMs }
      }

      valid.push(now)
      requests.set(key, valid)
      return { allowed: true, remaining: options.maxRequests - valid.length, resetMs: 0 }
    },
    reset: (key: string) => {
      requests.delete(key)
    },
    cleanup: () => { cleanup() },
    destroy: () => {
      clearInterval(intervalId)
      requests.clear()
    },
  }
}

export function createHTTPLoggingMiddleware() {
  return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const start = Date.now()
    const originalEnd = res.end.bind(res)
    res.end = ((...args: Parameters<ServerResponse['end']>) => {
      const duration = Date.now() - start
      process.stderr.write(JSON.stringify({
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        status: res.statusCode,
        durationMs: duration,
      }) + '\n')
      return originalEnd(...args)
    }) as ServerResponse['end']
    next()
  }
}
