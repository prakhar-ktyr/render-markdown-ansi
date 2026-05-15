# render-markdown-ansi

[![CI](https://github.com/prakhar-ktyr/render-markdown-ansi/actions/workflows/ci.yml/badge.svg)](https://github.com/prakhar-ktyr/render-markdown-ansi/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/render-markdown-ansi)](https://www.npmjs.com/package/render-markdown-ansi)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)

> Zero-dependency Markdown to ANSI terminal renderer. Converts Markdown strings into beautifully formatted terminal output with full GFM support.

## Why this package?

| | render-markdown-ansi | marked-terminal | markdown-to-ansi |
|---|---|---|---|
| **Runtime deps** | **0** | 5+ | 1+ |
| **GFM Tables** | ✅ | ✅ | ❌ |
| **Task Lists** | ✅ | ✅ | ❌ |
| **Callouts** | ✅ | ❌ | ❌ |
| **Dual ESM/CJS** | ✅ | ✅ | ESM only |
| **TypeScript** | ✅ native | ❌ | ✅ |
| **Bundle size** | ~38 KB | 200+ KB | ~20 KB |

## Installation

```bash
npm install render-markdown-ansi
```

## Quick Start

```typescript
import { renderMarkdown } from 'render-markdown-ansi';

const markdown = `
# Hello World

This is **bold**, *italic*, and ~~strikethrough~~ text.

- [x] Task complete
- [ ] Task pending
`;

console.log(renderMarkdown(markdown));
```

## Supported Syntax

### Block Elements

| Element | Syntax | Rendering |
|---|---|---|
| Headings | `# H1` through `###### H6` | Bold + color per level, H1 gets underline |
| Paragraphs | Plain text | Word-wrapped to terminal width |
| Fenced Code | ` ```lang ` | Dim styling with language label |
| Indented Code | 4-space indent | Dim/grey text |
| Blockquotes | `> text` | `│` left border |
| Unordered Lists | `- item` | `•` bullet |
| Ordered Lists | `1. item` | Numbered |
| Task Lists | `- [x] done` | `☑` / `☐` checkboxes |
| Tables | `\| a \| b \|` | Unicode box-drawing borders |
| Horizontal Rules | `---` | `─` repeated line |
| Callouts | `> [!NOTE]` | Colored prefix with icon |

### Inline Elements

| Element | Syntax | ANSI Style |
|---|---|---|
| Bold | `**text**` | Bold |
| Italic | `*text*` | Italic |
| Bold Italic | `***text***` | Bold + Italic |
| Strikethrough | `~~text~~` | Strikethrough |
| Inline Code | `` `code` `` | Reverse video |
| Links | `[text](url)` | Underline + cyan, URL shown |
| Images | `![alt](url)` | `[image: alt]` label |
| Autolinks | `<url>` | Underline + blue |

### GitHub Callouts

All five GitHub callout types are supported:

```markdown
> [!NOTE]
> Informational note

> [!TIP]
> Helpful tip

> [!IMPORTANT]
> Critical information

> [!WARNING]
> Warning message

> [!CAUTION]
> Dangerous action
```

## API Reference

### `renderMarkdown(markdown, options?)`

The main function. Takes a Markdown string and returns an ANSI-formatted string.

```typescript
import { renderMarkdown } from 'render-markdown-ansi';

console.log(renderMarkdown('# Hello **World**'));
```

### Options

```typescript
interface RenderOptions {
  width?: number;      // Terminal width for wrapping (default: 80)
  showLinks?: boolean; // Show URLs after link text (default: true)
  indent?: number;     // Base indentation in spaces (default: 2)
  colors?: boolean;    // Enable ANSI colors (default: true)
  softBreak?: string;  // Soft line break character (default: '\n')
  unicode?: boolean;   // Use Unicode characters (default: true)
}
```

### `parse(markdown)`

Parse Markdown into an AST (array of block tokens). Useful for custom processing.

```typescript
import { parse } from 'render-markdown-ansi';

const tokens = parse('# Hello\n\nWorld');
console.log(JSON.stringify(tokens, null, 2));
```

### `render(tokens, options?)`

Render pre-parsed block tokens into an ANSI string. Use with `parse()` for two-step processing.

```typescript
import { parse, render } from 'render-markdown-ansi';

const tokens = parse(markdown);
// ... manipulate tokens ...
console.log(render(tokens, { width: 120 }));
```

### `parseInlineContent(text)`

Parse inline Markdown content into an AST. Useful for rendering inline content outside of a block context.

```typescript
import { parseInlineContent } from 'render-markdown-ansi';

const nodes = parseInlineContent('**bold** and *italic*');
```

## Type Exports

All AST node types are exported for TypeScript consumers:

```typescript
import type {
  BlockToken,
  InlineNode,
  HeadingToken,
  ParagraphToken,
  CodeBlockToken,
  BlockquoteToken,
  ListToken,
  ListItemToken,
  TableToken,
  HorizontalRuleToken,
  CalloutToken,
  CalloutKind,
  TextNode,
  BoldNode,
  ItalicNode,
  CodeSpanNode,
  LinkNode,
  ImageNode,
  RenderOptions,
} from 'render-markdown-ansi';
```

## Examples

### Disable Colors

```typescript
renderMarkdown(md, { colors: false });
```

### ASCII-Only Mode

For terminals that don't support Unicode:

```typescript
renderMarkdown(md, { unicode: false });
// Uses - instead of •, +---+ instead of ┌───┐
```

### Custom Width

```typescript
renderMarkdown(md, { width: 120 });
```

### Hide Link URLs

```typescript
renderMarkdown(md, { showLinks: false });
```

## Development

```bash
git clone https://github.com/prakhar-ktyr/render-markdown-ansi.git
cd render-markdown-ansi
npm install

npm test              # Run all 131 tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm run build         # Build CJS + ESM + .d.ts
npm run typecheck     # Type checking only
```

### Run the demo

```bash
npx tsx examples/demo.ts
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for:

- **Architecture overview** — how the 3-phase pipeline works
- **Module dependency graph** — what depends on what
- **Step-by-step guides** — how to add new block/inline elements
- **Testing strategy** — what to test and how
- **Publishing checklist** — pre-publish validation steps

Quick start:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`npm test`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

[MIT](LICENSE) © Prakhar Katiyar
