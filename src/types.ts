// ============================================================================
// Token & AST Type Definitions
// ============================================================================

/**
 * Configuration options for the Markdown renderer.
 */
export interface RenderOptions {
  /** Terminal width for wrapping. Defaults to 80. */
  width?: number;
  /** Whether to show URLs after link text. Defaults to true. */
  showLinks?: boolean;
  /** Base indentation in spaces. Defaults to 2. */
  indent?: number;
  /** Whether to enable ANSI colors. Defaults to true. */
  colors?: boolean;
  /** Character(s) used for soft line breaks. Defaults to '\n'. */
  softBreak?: string;
  /** Whether to use Unicode characters (bullets, box-drawing). Defaults to true. */
  unicode?: boolean;
}

/**
 * Resolved options with all defaults applied.
 * @internal
 */
export interface ResolvedOptions {
  width: number;
  showLinks: boolean;
  indent: number;
  colors: boolean;
  softBreak: string;
  unicode: boolean;
}

// ============================================================================
// Block-Level Tokens
// ============================================================================

/**
 * An ATX heading (`# H1` through `###### H6`).
 * The `raw` field contains the heading text before inline parsing.
 */
export interface HeadingToken {
  type: 'heading';
  /** Heading level: 1 for `#`, 2 for `##`, etc. */
  level: 1 | 2 | 3 | 4 | 5 | 6;
  /** Raw heading text (not yet inline-parsed). */
  raw: string;
}

/**
 * A paragraph — one or more consecutive lines of text,
 * separated from other blocks by blank lines.
 */
export interface ParagraphToken {
  type: 'paragraph';
  /** Raw paragraph text (may contain inline Markdown). */
  raw: string;
}

/**
 * A fenced or indented code block.
 * Content is preserved verbatim (no inline parsing).
 */
export interface CodeBlockToken {
  type: 'code_block';
  /** Language identifier from the fence (e.g., `"javascript"`). Empty string if none. */
  language: string;
  /** Raw code content (no trailing newline). */
  content: string;
}

/** A blockquote (`> text`). Children are recursively parsed block tokens. */
export interface BlockquoteToken {
  type: 'blockquote';
  children: BlockToken[];
}

/** A single item within a list. */
export interface ListItemToken {
  type: 'list_item';
  /**
   * Task list checkbox state.
   * - `true` = checked (`[x]`)
   * - `false` = unchecked (`[ ]`)
   * - `null` = not a task list item
   */
  checked: boolean | null;
  /** Block content within this list item. */
  children: BlockToken[];
}

/** An ordered or unordered list. */
export interface ListToken {
  type: 'list';
  /** `true` for ordered lists (`1.`), `false` for unordered (`-`, `*`, `+`). */
  ordered: boolean;
  /** Starting number for ordered lists (defaults to 1). */
  start: number;
  items: ListItemToken[];
}

/** Column alignment specification from a GFM table separator row. */
export interface TableAlignment {
  align: 'left' | 'center' | 'right' | 'none';
}

/** A GFM table with headers, alignments, and data rows. */
export interface TableToken {
  type: 'table';
  /** Header cell strings (raw Markdown, not yet inline-parsed). */
  headers: string[];
  /** Per-column alignment, parsed from the separator row (`:---`, `:---:`, `---:`). */
  alignments: TableAlignment[];
  /** Data rows, each an array of cell strings. */
  rows: string[][];
}

/** A horizontal rule (`---`, `***`, or `___`). */
export interface HorizontalRuleToken {
  type: 'hr';
}

/** The five supported GitHub callout types. */
export type CalloutKind = 'NOTE' | 'TIP' | 'IMPORTANT' | 'WARNING' | 'CAUTION';

/**
 * A GitHub-style callout/admonition (`> [!NOTE]`, `> [!WARNING]`, etc.).
 * Parsed from blockquote syntax with a special first line.
 */
export interface CalloutToken {
  type: 'callout';
  kind: CalloutKind;
  children: BlockToken[];
}

/** Represents a blank line in the source. Used for spacing control. */
export interface BlankLineToken {
  type: 'blank';
}

/**
 * Union of all block-level token types.
 * Use the `type` field as a discriminant in switch statements.
 */
export type BlockToken =
  | HeadingToken
  | ParagraphToken
  | CodeBlockToken
  | BlockquoteToken
  | ListToken
  | TableToken
  | HorizontalRuleToken
  | CalloutToken
  | BlankLineToken;

// ============================================================================
// Inline-Level Tokens
// ============================================================================

/** Plain text content (no formatting). */
export interface TextNode {
  type: 'text';
  content: string;
}

/** Bold text (`**text**` or `__text__`). */
export interface BoldNode {
  type: 'bold';
  children: InlineNode[];
}

/** Italic text (`*text*` or `_text_`). */
export interface ItalicNode {
  type: 'italic';
  children: InlineNode[];
}

/** Bold and italic text (`***text***` or `___text___`). */
export interface BoldItalicNode {
  type: 'bold_italic';
  children: InlineNode[];
}

/** Strikethrough text (`~~text~~`). GFM extension. */
export interface StrikethroughNode {
  type: 'strikethrough';
  children: InlineNode[];
}

/** Inline code span (`` `code` ``). Content is verbatim — not further parsed. */
export interface CodeSpanNode {
  type: 'code_span';
  content: string;
}

/** A hyperlink (`[text](url "title")`). */
export interface LinkNode {
  type: 'link';
  /** Inline-parsed link text. */
  children: InlineNode[];
  /** Link destination URL. */
  url: string;
  /** Optional link title (from the `"title"` attribute). */
  title: string;
}

/** An image (`![alt](url "title")`). */
export interface ImageNode {
  type: 'image';
  /** Alt text for the image. */
  alt: string;
  /** Image URL. */
  url: string;
  /** Optional image title. */
  title: string;
}

/** A hard line break (trailing `  \n` or `\\\n`). */
export interface LineBreakNode {
  type: 'line_break';
}

/**
 * Union of all inline-level node types.
 * Use the `type` field as a discriminant in switch statements.
 */
export type InlineNode =
  | TextNode
  | BoldNode
  | ItalicNode
  | BoldItalicNode
  | StrikethroughNode
  | CodeSpanNode
  | LinkNode
  | ImageNode
  | LineBreakNode;
