#!/usr/bin/env node
import { getJurisdiction, validateCitationText } from '@tensflare/mcp-law/schemas'
import { extractClauses, CLAUSE_DESCRIPTIONS } from '@tensflare/mcp-law/schemas'

const SUPPORTED_JURISDICTIONS = ['US', 'UK', 'EU', 'DE', 'FR', 'AU', 'SG', 'IN', 'CA']

const server = {
  name: 'contract-analysis-mcp-server',
  version: '0.1.0',
  tools: [
    {
      name: 'extract_clauses',
      description: 'Extract contract clauses from text and classify them by type',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Contract text to analyze' },
          jurisdiction: { type: 'string', description: 'Governing jurisdiction code (optional)' },
        },
        required: ['text'],
      },
    },
    {
      name: 'assess_risk',
      description: 'Assess risk level of contract clauses based on jurisdiction standards',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Contract text to assess' },
          jurisdiction: { type: 'string', description: 'Governing jurisdiction code (optional)' },
        },
        required: ['text'],
      },
    },
    {
      name: 'check_compliance',
      description: 'Check contract compliance with specific regulatory requirements (e.g., GDPR, CCPA)',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Contract text to check' },
          regulations: {
            type: 'array',
            items: { type: 'string' },
            description: 'Regulatory frameworks to check (e.g., GDPR, CCPA)',
          },
          jurisdiction: { type: 'string', description: 'Jurisdiction code (optional)' },
        },
        required: ['text'],
      },
    },
  ],
}

function handleToolCall(name, args) {
  switch (name) {
    case 'extract_clauses': {
      const { text } = args
      const clauses = extractClauses(text)
      const grouped = {}
      for (const clause of clauses) {
        if (!grouped[clause.type]) {
          grouped[clause.type] = {
            type: clause.type,
            description: CLAUSE_DESCRIPTIONS[clause.type]?.description || '',
            riskFlags: CLAUSE_DESCRIPTIONS[clause.type]?.risk_flags || [],
            matches: [],
          }
        }
        grouped[clause.type].matches.push({
          text: clause.text,
          position: clause.startIndex,
        })
      }
      return Promise.resolve({
        content: [{
          type: 'text',
          text: JSON.stringify({
            totalClauses: clauses.length,
            uniqueClauseTypes: Object.keys(grouped).length,
            clauses: Object.values(grouped),
          }, null, 2),
        }],
      })
    }

    case 'assess_risk': {
      const { text } = args
      const clauses = extractClauses(text)
      const highRiskFlags = []
      const clauseTypes = new Set()
      for (const clause of clauses) {
        clauseTypes.add(clause.type)
        for (const flag of clause.riskFlags) {
          if (!highRiskFlags.includes(flag)) {
            highRiskFlags.push(flag)
          }
        }
      }
      const riskScore = clauses.length > 0
        ? Math.round((highRiskFlags.length / clauses.length) * 100)
        : 0
      const riskLevel = riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low'

      return Promise.resolve({
        content: [{
          type: 'text',
          text: JSON.stringify({
            riskScore,
            riskLevel,
            totalClauses: clauses.length,
            uniqueClauseTypes: clauseTypes.size,
            clauseTypes: Array.from(clauseTypes),
            highRiskFlags,
            riskFlagsFound: highRiskFlags.length,
          }, null, 2),
        }],
      })
    }

    case 'check_compliance': {
      const { text, regulations } = args
      const clauses = extractClauses(text)
      const hasDataPrivacyClause = clauses.some(c => c.type === 'data_privacy')
      const hasConfidentiality = clauses.some(c => c.type === 'confidentiality')
      const hasGoverningLaw = clauses.some(c => c.type === 'governing_law')
      const hasDisputeResolution = clauses.some(c => c.type === 'dispute_resolution')

      const checks = {}
      const regs = regulations || ['GDPR', 'CCPA', 'CCPA 2.0']

      for (const reg of regs) {
        const r = reg.toUpperCase()
        if (r === 'GDPR') {
          checks[r] = { compliant: hasDataPrivacyClause && hasConfidentiality, requires: ['data_privacy', 'confidentiality'] }
        } else if (r === 'CCPA' || r === 'CCPA 2.0') {
          checks[r] = { compliant: hasDataPrivacyClause, requires: ['data_privacy'] }
        } else {
          checks[r] = { compliant: false, requires: ['custom_regulation_check'] }
        }
      }

      const allCompliant = Object.values(checks).every(c => c.compliant)

      return Promise.resolve({
        content: [{
          type: 'text',
          text: JSON.stringify({
            overallCompliant: allCompliant,
            checks,
            clausesFound: {
              data_privacy: hasDataPrivacyClause,
              confidentiality: hasConfidentiality,
              governing_law: hasGoverningLaw,
              dispute_resolution: hasDisputeResolution,
            },
            totalClausesFound: clauses.length,
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
