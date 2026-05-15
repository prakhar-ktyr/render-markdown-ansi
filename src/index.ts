// ============================================================================
// render-markdown-ansi — Public API
// ============================================================================
//
// Zero-dependency Markdown to ANSI terminal renderer.
//
// Usage:
//   import { renderMarkdown } from 'render-markdown-ansi';
//   console.log(renderMarkdown('# Hello **World**'));
//

import type { RenderOptions, ResolvedOptions, BlockToken, InlineNode } from './types.js';
import { tokenize } from './lexer.js';
import { renderTokens } from './renderer.js';
import { parseInline } from './inline-parser.js';

// ---------------------------------------------------------------------------
// Default Options
// ---------------------------------------------------------------------------

const DEFAULT_OPTIONS: ResolvedOptions = {
  width: 80,
  showLinks: true,
  indent: 2,
  colors: true,
  softBreak: '\n',
  unicode: true,
};

// ---------------------------------------------------------------------------
// Public Functions
// ---------------------------------------------------------------------------

/**
 * Render a Markdown string into a string formatted with ANSI escape codes
 * for terminal display.
 *
 * @param markdown - The Markdown source string to render.
 * @param options  - Optional configuration. All fields have sensible defaults.
 * @returns A string containing ANSI escape codes ready for `console.log()`.
 *
 * @example
 * ```ts
 * import { renderMarkdown } from 'render-markdown-ansi';
 *
 * const output = renderMarkdown('# Hello **World**\n\nThis is a paragraph.');
 * console.log(output);
 * ```
 */
export function renderMarkdown(
  markdown: string,
  options?: RenderOptions
): string {
  if (!markdown) return '';

  const resolved = resolveOptions(options);
  const tokens = tokenize(markdown);
  return renderTokens(tokens, resolved);
}

/**
 * Parse a Markdown string into block-level tokens (AST).
 * Useful for advanced use cases where you want to manipulate the AST
 * before rendering.
 *
 * @param markdown - The Markdown source string to parse.
 * @returns An array of block-level tokens.
 *
 * @example
 * ```ts
 * import { parse } from 'render-markdown-ansi';
 *
 * const tokens = parse('# Heading\n\nParagraph text.');
 * console.log(JSON.stringify(tokens, null, 2));
 * ```
 */
export function parse(markdown: string): BlockToken[] {
  return tokenize(markdown);
}

/**
 * Render a pre-parsed array of block tokens into an ANSI-formatted string.
 * Use this with `parse()` for two-step processing.
 *
 * @param tokens  - Block tokens from `parse()`.
 * @param options - Optional configuration.
 * @returns A string containing ANSI escape codes.
 *
 * @example
 * ```ts
 * import { parse, render } from 'render-markdown-ansi';
 *
 * const tokens = parse('# Hello');
 * const output = render(tokens, { width: 120 });
 * console.log(output);
 * ```
 */
export function render(
  tokens: BlockToken[],
  options?: RenderOptions
): string {
  const resolved = resolveOptions(options);
  return renderTokens(tokens, resolved);
}

/**
 * Parse inline Markdown content (bold, italic, links, etc.) into an AST.
 * Useful for rendering inline content outside of a block context.
 *
 * @param text - Raw inline Markdown text.
 * @returns An array of inline nodes.
 */
export function parseInlineContent(text: string): InlineNode[] {
  return parseInline(text);
}

// ---------------------------------------------------------------------------
// Options Resolution
// ---------------------------------------------------------------------------

function resolveOptions(options?: RenderOptions): ResolvedOptions {
  if (!options) return { ...DEFAULT_OPTIONS };

  return {
    width: options.width ?? DEFAULT_OPTIONS.width,
    showLinks: options.showLinks ?? DEFAULT_OPTIONS.showLinks,
    indent: options.indent ?? DEFAULT_OPTIONS.indent,
    colors: options.colors ?? DEFAULT_OPTIONS.colors,
    softBreak: options.softBreak ?? DEFAULT_OPTIONS.softBreak,
    unicode: options.unicode ?? DEFAULT_OPTIONS.unicode,
  };
}

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

export type {
  RenderOptions,
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
  BoldItalicNode,
  StrikethroughNode,
  CodeSpanNode,
  LinkNode,
  ImageNode,
  LineBreakNode,
} from './types.js';
