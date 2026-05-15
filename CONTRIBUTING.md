# Contributing to render-markdown-ansi

Thank you for considering contributing! This guide will help you get up to speed quickly.

## Architecture Overview

The package follows a **three-phase pipeline** inspired by the [CommonMark specification](https://spec.commonmark.org/):

```
Markdown String
      │
      ▼
┌─────────────┐
│   Lexer     │  src/lexer.ts
│  (Phase 1)  │  Line-by-line scan → Block tokens
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Inline     │  src/inline-parser.ts
│  Parser     │  Raw text within blocks → Inline AST nodes
│  (Phase 2)  │  Called lazily by the renderer
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Renderer   │  src/renderer.ts
│  (Phase 3)  │  AST → ANSI escape code string
└─────────────┘
```

### Module Dependency Graph

```
index.ts  ←── Public API, re-exports types
  ├── lexer.ts         ←── Block tokenization (uses utils.ts)
  ├── renderer.ts      ←── ANSI output (uses inline-parser.ts, ansi.ts, utils.ts)
  ├── inline-parser.ts ←── Inline parsing (uses types.ts)
  ├── ansi.ts          ←── ANSI escape code constants (no deps)
  ├── utils.ts         ←── String helpers (no deps)
  └── types.ts         ←── All TypeScript interfaces (no deps)
```

### Key Design Decisions

1. **Zero runtime dependencies** — This is a hard constraint. All functionality is implemented from scratch. Do not add runtime `dependencies` to `package.json`.

2. **Lazy inline parsing** — The inline parser is NOT called during lexing. The renderer calls `parseInline()` when it needs to render a block's text content. This keeps the lexer simple and allows future optimizations.

3. **Discriminated unions** — All AST nodes use a `type` field as the discriminant. This enables exhaustive `switch` statements and great TypeScript DX.

4. **ANSI codes centralized** — All escape code constants live in `ansi.ts`. Never use raw `\x1b[...m` strings elsewhere. This makes it easy to add theme support later.

5. **Options are always resolved** — The public API accepts partial `RenderOptions`, but internally everything works with `ResolvedOptions` (all fields required). Resolution happens once in `index.ts`.

## Project Structure

```
src/
├── index.ts          # Public API entry point
├── types.ts          # TypeScript interfaces for AST nodes and options
├── ansi.ts           # ANSI escape code constants and helpers
├── utils.ts          # String utilities (strip ANSI, word wrap, padding)
├── lexer.ts          # Phase 1: Markdown → Block tokens
├── inline-parser.ts  # Phase 2: Raw text → Inline AST nodes
└── renderer.ts       # Phase 3: AST → ANSI formatted string

tests/
├── utils.test.ts          # Unit tests for string utilities
├── lexer.test.ts          # Unit tests for block tokenization
├── inline-parser.test.ts  # Unit tests for inline parsing
├── renderer.test.ts       # Unit tests for ANSI rendering
├── integration.test.ts    # End-to-end: Markdown string → ANSI output
└── edge-cases.test.ts     # Malformed input, boundary conditions

examples/
└── demo.ts           # Runnable demo (npx tsx examples/demo.ts)
```

## Development Setup

```bash
# Clone and install
git clone https://github.com/prakhar-ktyr/render-markdown-ansi.git
cd render-markdown-ansi
npm install

# Key commands
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run build         # Build CJS + ESM + type declarations
npm run typecheck     # TypeScript type checking only
npm run clean         # Remove dist/
```

## How to Add a New Block Element

Example: adding support for a new block syntax (e.g., definition lists).

1. **Define the token type** in `src/types.ts`:
   ```typescript
   export interface DefinitionListToken {
     type: 'definition_list';
     items: { term: string; definition: string }[];
   }
   ```
   Add it to the `BlockToken` union type.

2. **Add detection and parsing** in `src/lexer.ts`:
   - Add a regex pattern at the top
   - Add a detection branch in `parseBlockTokens()`
   - Write a `parseDefinitionList()` function

3. **Add rendering** in `src/renderer.ts`:
   - Add a `case 'definition_list':` in `renderBlock()`
   - Write a `renderDefinitionList()` method

4. **Write tests**:
   - Lexer test in `tests/lexer.test.ts`
   - Renderer test in `tests/renderer.test.ts`
   - Integration test in `tests/integration.test.ts`

5. **Update documentation**:
   - Add to the "Supported Syntax" table in `README.md`
   - Add to `CHANGELOG.md`

## How to Add a New Inline Element

Same pattern but in `src/inline-parser.ts`:

1. Add the node type to `InlineNode` union in `types.ts`
2. Add parsing logic in the `parseUntil()` method of `InlineParser`
3. Add rendering in the `renderInlineNode()` method of `renderer.ts`
4. Write tests and update docs

## Testing

- **Framework**: [Vitest](https://vitest.dev/)
- **Coverage target**: 90% lines, functions, statements; 85% branches
- **Coverage provider**: V8

```bash
# Run a specific test file
npx vitest run tests/lexer.test.ts

# Run tests matching a pattern
npx vitest run -t "should parse ATX headings"

# Run with coverage
npm run test:coverage
```

## Publishing Checklist

Before publishing a new version:

1. `npm run typecheck` — types are clean
2. `npm test` — all tests pass
3. `npm run build` — builds successfully
4. `npx publint` — package.json exports are correct
5. `npx @arethetypeswrong/cli --pack .` — types resolve in all environments
6. Update `CHANGELOG.md` with new entries
7. `npm version patch|minor|major`
8. `npm publish`

## Code Style

- **TypeScript strict mode** with `noUnusedLocals`, `noImplicitReturns`, `noUncheckedIndexedAccess`
- **JSDoc comments** on all exported functions
- **Section separators** using `// ===` and `// ---` comment blocks
- **No abbreviations** in public API names (e.g., `renderMarkdown` not `renderMd`)
- **Consistent return types**: block parsers return `{ token, nextLine }`, inline parsers return `InlineNode | null`
