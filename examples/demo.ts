// ============================================================================
// render-markdown-ansi — Demo Script
// ============================================================================
//
// Run with: npx tsx examples/demo.ts
//

import { renderMarkdown } from '../src/index.js';

const markdown = `
# render-markdown-ansi

A **zero-dependency** Markdown to ANSI terminal renderer.

## Features

- [x] Full CommonMark support
- [x] GFM extensions (tables, task lists, callouts)
- [x] Unicode box-drawing tables
- [ ] Syntax highlighting *(coming soon)*

## Installation

\`\`\`bash
npm install render-markdown-ansi
\`\`\`

## Quick Example

Use the \`renderMarkdown()\` function to convert Markdown to ANSI:

\`\`\`typescript
import { renderMarkdown } from 'render-markdown-ansi';
console.log(renderMarkdown('# Hello **World**'));
\`\`\`

## API Reference

| Function | Description |
| :--- | :--- |
| \`renderMarkdown(md, opts?)\` | Render Markdown to ANSI string |
| \`parse(md)\` | Parse Markdown to AST |
| \`render(tokens, opts?)\` | Render AST to ANSI string |

> [!NOTE]
> This package has **zero** runtime dependencies.

> [!WARNING]
> Terminal support for ANSI codes varies. Test in your target environment.

---

*Made with ❤️ by [Prakhar Katiyar](https://github.com/prakhar-ktyr)*
`;

console.log(renderMarkdown(markdown));
