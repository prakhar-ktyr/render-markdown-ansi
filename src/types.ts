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

export interface HeadingToken {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  raw: string;
}

export interface ParagraphToken {
  type: 'paragraph';
  raw: string;
}

export interface CodeBlockToken {
  type: 'code_block';
  language: string;
  content: string;
}

export interface BlockquoteToken {
  type: 'blockquote';
  children: BlockToken[];
}

export interface ListItemToken {
  type: 'list_item';
  checked: boolean | null; // null = not a task list item
  children: BlockToken[];
}

export interface ListToken {
  type: 'list';
  ordered: boolean;
  start: number;
  items: ListItemToken[];
}

export interface TableAlignment {
  align: 'left' | 'center' | 'right' | 'none';
}

export interface TableToken {
  type: 'table';
  headers: string[];
  alignments: TableAlignment[];
  rows: string[][];
}

export interface HorizontalRuleToken {
  type: 'hr';
}

export type CalloutKind = 'NOTE' | 'TIP' | 'IMPORTANT' | 'WARNING' | 'CAUTION';

export interface CalloutToken {
  type: 'callout';
  kind: CalloutKind;
  children: BlockToken[];
}

export interface BlankLineToken {
  type: 'blank';
}

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

export interface TextNode {
  type: 'text';
  content: string;
}

export interface BoldNode {
  type: 'bold';
  children: InlineNode[];
}

export interface ItalicNode {
  type: 'italic';
  children: InlineNode[];
}

export interface BoldItalicNode {
  type: 'bold_italic';
  children: InlineNode[];
}

export interface StrikethroughNode {
  type: 'strikethrough';
  children: InlineNode[];
}

export interface CodeSpanNode {
  type: 'code_span';
  content: string;
}

export interface LinkNode {
  type: 'link';
  children: InlineNode[];
  url: string;
  title: string;
}

export interface ImageNode {
  type: 'image';
  alt: string;
  url: string;
  title: string;
}

export interface LineBreakNode {
  type: 'line_break';
}

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
