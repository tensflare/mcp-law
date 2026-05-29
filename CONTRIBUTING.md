# Contributing to MCP-Law

We welcome contributions! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/tensflare/mcp-law.git
cd mcp-law
npm install
npm run build
npm test
```

## Project Structure

```
mcp-law/
├── src/
│   ├── cli.ts              # Commander-based CLI
│   ├── index.ts            # Main exports
│   ├── schemas/            # Zod schemas and types
│   │   ├── index.ts        # Core schemas (Jurisdiction, Citation, Contract)
│   │   ├── jurisdiction.ts # Jurisdiction utilities
│   │   ├── contract.ts     # Contract clause extraction
│   │   └── citation.ts     # Citation format parsing
│   ├── scaffold/           # Project scaffolding
│   │   ├── index.ts        # Scaffold generator
│   │   ├── templates.ts    # Template definitions
│   │   └── files.ts        # File generation
│   ├── registry/           # Server registry
│   │   ├── index.ts        # Registry client
│   │   └── types.ts        # Registry types
│   └── server/             # Server builder
│       ├── index.ts        # Server creation
│       └── middleware.ts   # Security middleware
├── templates/              # Starter templates
├── test/                   # Tests
└── docs/                   # Documentation
```

## Making Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes
4. Run tests: `npm test`
5. Run typecheck: `npm run typecheck`
6. Commit with clear message
7. Push and open a pull request

## Code Style

- TypeScript with strict mode
- ES modules (`type: "module"` in package.json)
- No semicolons (project convention)
- 2-space indentation
- Descriptive variable names

## Adding a Jurisdiction

Edit `src/schemas/index.ts` and add to the `JURISDICTIONS` object:

```typescript
'JP': {
  code: 'JP',
  name: 'Japan',
  legal_system: 'civil_law',
  language: 'ja',
  currency: 'JPY',
  citation_format: '...',
  court_hierarchy: ['Supreme Court', 'High Courts', 'District Courts'],
},
```

## Adding Citation Formats

Edit `src/schemas/index.ts` and add to the `CITATION_FORMATS` array:

```typescript
{
  jurisdiction: 'AU',
  format_name: 'Australian Law Reports',
  pattern: '\\(\\d{4}\\) \\d+ ALR \\d+',
  example: '(2024) 100 ALR 1',
  components: [
    { name: 'year', description: 'Year in parentheses', required: true },
    { name: 'volume', description: 'Volume number', required: true },
    { name: 'reporter', description: 'ALR', required: true },
    { name: 'page', description: 'Starting page', required: true },
  ],
},
```

## Adding Contract Clause Patterns

Edit `src/schemas/contract.ts` and add patterns to the `CLAUSE_PATTERNS` object.

## Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
```

## License

By contributing, you agree that your contributions will be licensed under the Apache 2.0 license.
