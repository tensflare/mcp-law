# Getting Started with MCP-Law

This guide walks you through creating your first legal MCP server using MCP-Law.

## Prerequisites

- Node.js 18 or later
- npm, yarn, or pnpm

## Installation

You don't need to install MCP-Law globally. Use it directly with `npx`:

```bash
npx @tensflare/mcp-law init my-legal-server
```

Or install it globally:

```bash
npm install -g @tensflare/mcp-law
mcp-law init my-legal-server
```

## Creating a Basic MCP Server

### Step 1: Scaffold the project

```bash
npx @tensflare/mcp-law init my-legal-server
```

The CLI will prompt you for:
- Project name (default: `my-legal-server`)
- Template type (`basic`, `jurisdiction-aware`, or `contract-analysis`)
- Jurisdictions (if using jurisdiction-aware template)
- Author and description

### Step 2: Install dependencies

```bash
cd my-legal-server
npm install
```

### Step 3: Start the server

```bash
npm run dev
```

The server starts and listens for JSON-RPC messages on stdin/stdout.

### Step 4: Test with your MCP client

Connect your MCP client (e.g., Claude Desktop, Continue.dev, or any MCP-compatible agent) to the server.

For manual testing, you can send JSON-RPC messages:

```bash
# Initialize
echo '{"jsonrpc":"2.0","id":1,"method":"initialize"}' | npm run dev

# List tools
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' | npm run dev

# Call a tool
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"greet","arguments":{"name":"Alice"}}}' | npm run dev
```

## Creating a Jurisdiction-Aware Server

```bash
npx @tensflare/mcp-law init my-jurisdiction-server --template jurisdiction-aware --jurisdiction US UK EU
```

This creates a server with:
- `get_jurisdiction_info` — returns legal metadata for a jurisdiction
- `validate_citation` — validates citations against jurisdiction format rules
- `search_statutes` — statute search (stub — integrate with a legal API)

## Creating a Contract Analysis Server

```bash
npx @tensflare/mcp-law init my-contract-server --template contract-analysis --jurisdiction US UK
```

This creates a server with:
- `extract_clauses` — extracts and classifies contract clauses
- `assess_risk` — scores risk based on clause patterns
- `check_compliance` — checks regulatory compliance (GDPR, CCPA, etc.)

## Project Structure

```
my-legal-server/
├── package.json
├── tsconfig.json
├── src/
│   └── index.ts          # MCP server entry point
└── dist/                 # Compiled output (after build)
```

## Next Steps

- Read [Creating Servers](creating-servers.md) for advanced configuration
- Explore [Jurisdiction Schemas](jurisdiction-schemas.md) for legal data types
- Browse the server registry with `mcp-law list`
