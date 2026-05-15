// ============================================================================
// ANSI Renderer — Walk the AST and Emit ANSI-Formatted Strings
// ============================================================================

import type {
  BlockToken,
  InlineNode,
  ResolvedOptions,
  TableToken,
  ListToken,
  ListItemToken,
  CalloutToken,
  BlockquoteToken,
  CodeBlockToken,
  HeadingToken,
  ParagraphToken,
} from './types.js';
import {
  RESET,
  BOLD,
  DIM,
  ITALIC,
  UNDERLINE,
  STRIKETHROUGH,
  REVERSE,
  FG_BLUE,
  FG_CYAN,
  FG_YELLOW,
  FG_BRIGHT_BLACK,
  HEADING_COLORS,
  CALLOUT_STYLES,
} from './ansi.js';
import { parseInline } from './inline-parser.js';
import { visibleLength, repeatChar, wrapText } from './utils.js';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Render an array of block tokens into an ANSI-formatted string.
 */
export function renderTokens(
  tokens: BlockToken[],
  options: ResolvedOptions
): string {
  const renderer = new AnsiRenderer(options);
  return renderer.render(tokens);
}

// ---------------------------------------------------------------------------
// Renderer Class
// ---------------------------------------------------------------------------

class AnsiRenderer {
  private readonly opts: ResolvedOptions;

  constructor(options: ResolvedOptions) {
    this.opts = options;
  }

  render(tokens: BlockToken[]): string {
    const lines: string[] = [];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]!;

      // Skip consecutive blank lines (collapse to single blank)
      if (token.type === 'blank') {
        // Only add a blank line if the last output line isn't already blank
        if (lines.length > 0 && lines[lines.length - 1] !== '') {
          lines.push('');
        }
        continue;
      }

      const rendered = this.renderBlock(token, 0);
      lines.push(rendered);
    }

    // Clean up: remove trailing blank lines
    while (lines.length > 0 && lines[lines.length - 1] === '') {
      lines.pop();
    }

    return lines.join('\n') + '\n';
  }

  // -------------------------------------------------------------------------
  // Block Rendering
  // -------------------------------------------------------------------------

  private renderBlock(token: BlockToken, depth: number): string {
    switch (token.type) {
      case 'heading':
        return this.renderHeading(token);
      case 'paragraph':
        return this.renderParagraph(token, depth);
      case 'code_block':
        return this.renderCodeBlock(token);
      case 'blockquote':
        return this.renderBlockquote(token, depth);
      case 'list':
        return this.renderList(token, depth);
      case 'table':
        return this.renderTable(token);
      case 'hr':
        return this.renderHorizontalRule();
      case 'callout':
        return this.renderCallout(token, depth);
      case 'blank':
        return '';
    }
  }

  // -------------------------------------------------------------------------
  // Heading
  // -------------------------------------------------------------------------

  private renderHeading(token: HeadingToken): string {
    const color = HEADING_COLORS[token.level - 1] ?? HEADING_COLORS[0]!;
    const inlineNodes = parseInline(token.raw);
    const text = this.renderInlineNodes(inlineNodes);

    const prefix = this.opts.colors ? color + BOLD : '';
    const suffix = this.opts.colors ? RESET : '';

    // H1 gets a special underline decoration
    if (token.level === 1) {
      const headerLine = `${prefix}${text}${suffix}`;
      const visLen = visibleLength(text);
      const underlineStr = `${this.opts.colors ? color : ''}${repeatChar(this.getHRCharSingle(), visLen)}${this.opts.colors ? RESET : ''}`;
      return `${headerLine}\n${underlineStr}`;
    }

    // H2 gets a subtle separator
    if (token.level === 2) {
      const headerLine = `${prefix}${text}${suffix}`;
      return headerLine;
    }

    return `${prefix}${text}${suffix}`;
  }

  // -------------------------------------------------------------------------
  // Paragraph
  // -------------------------------------------------------------------------

  private renderParagraph(token: ParagraphToken, depth: number): string {
    const inlineNodes = parseInline(token.raw);
    const text = this.renderInlineNodes(inlineNodes);

    // Word-wrap if width is set
    const maxWidth = this.opts.width - depth * this.opts.indent;
    if (maxWidth > 0) {
      const wrapped = wrapText(text, maxWidth);
      return wrapped.join('\n');
    }

    return text;
  }

  // -------------------------------------------------------------------------
  // Code Block
  // -------------------------------------------------------------------------

  private renderCodeBlock(token: CodeBlockToken): string {
    const lines = token.content.split('\n');
    const result: string[] = [];

    // Language label
    if (token.language) {
      const label = this.opts.colors
        ? `${DIM}${FG_CYAN} ${token.language} ${RESET}`
        : ` ${token.language} `;
      result.push(label);
    }

    // Render each line with dim styling
    for (const line of lines) {
      const styled = this.opts.colors
        ? `${FG_BRIGHT_BLACK}  ${line}${RESET}`
        : `  ${line}`;
      result.push(styled);
    }

    return result.join('\n');
  }

  // -------------------------------------------------------------------------
  // Blockquote
  // -------------------------------------------------------------------------

  private renderBlockquote(token: BlockquoteToken, depth: number): string {
    const border = this.opts.unicode ? '│' : '|';
    const prefix = this.opts.colors ? `${DIM}${border}${RESET} ` : `${border} `;

    const childLines: string[] = [];
    for (const child of token.children) {
      if (child.type === 'blank') {
        childLines.push(`${prefix}`);
        continue;
      }
      const rendered = this.renderBlock(child, depth + 1);
      const lines = rendered.split('\n');
      for (const line of lines) {
        childLines.push(`${prefix}${line}`);
      }
    }

    return childLines.join('\n');
  }

  // -------------------------------------------------------------------------
  // List
  // -------------------------------------------------------------------------

  private renderList(token: ListToken, depth: number): string {
    const result: string[] = [];
    const indent = ' '.repeat(this.opts.indent);

    for (let i = 0; i < token.items.length; i++) {
      const item = token.items[i]!;
      const marker = this.getListMarker(token, i, item);
      const itemContent = this.renderListItem(item, depth);
      const lines = itemContent.split('\n');

      // First line gets the marker
      result.push(`${indent}${marker} ${lines[0] ?? ''}`);

      // Continuation lines get indented
      const contIndent = ' '.repeat(this.opts.indent + visibleLength(marker) + 1);
      for (let j = 1; j < lines.length; j++) {
        result.push(`${contIndent}${lines[j]}`);
      }
    }

    return result.join('\n');
  }

  private getListMarker(
    list: ListToken,
    index: number,
    item: ListItemToken
  ): string {
    // Task list
    if (item.checked !== null) {
      if (this.opts.unicode) {
        const box = item.checked ? '☑' : '☐';
        return this.opts.colors
          ? (item.checked ? `${FG_CYAN}${box}${RESET}` : `${DIM}${box}${RESET}`)
          : box;
      }
      const box = item.checked ? '[x]' : '[ ]';
      return box;
    }

    // Ordered list
    if (list.ordered) {
      const num = `${list.start + index}.`;
      return this.opts.colors ? `${FG_YELLOW}${num}${RESET}` : num;
    }

    // Unordered list
    const bullet = this.opts.unicode ? '•' : '-';
    return this.opts.colors ? `${FG_CYAN}${bullet}${RESET}` : bullet;
  }

  private renderListItem(item: ListItemToken, depth: number): string {
    const parts: string[] = [];

    for (const child of item.children) {
      if (child.type === 'blank') continue;
      parts.push(this.renderBlock(child, depth + 1));
    }

    return parts.join('\n');
  }

  // -------------------------------------------------------------------------
  // Table
  // -------------------------------------------------------------------------

  private renderTable(token: TableToken): string {
    const useUnicode = this.opts.unicode;

    // Calculate column widths
    const colCount = token.headers.length;
    const colWidths: number[] = new Array(colCount).fill(0) as number[];

    // Measure headers
    for (let c = 0; c < colCount; c++) {
      const headerInline = parseInline(token.headers[c] ?? '');
      const rendered = this.renderInlineNodes(headerInline);
      colWidths[c] = Math.max(colWidths[c]!, visibleLength(rendered));
    }

    // Measure data rows
    for (const row of token.rows) {
      for (let c = 0; c < colCount; c++) {
        const cellInline = parseInline(row[c] ?? '');
        const rendered = this.renderInlineNodes(cellInline);
        colWidths[c] = Math.max(colWidths[c]!, visibleLength(rendered));
      }
    }

    // Add padding
    colWidths.forEach((_w, i) => {
      colWidths[i] = colWidths[i]! + 2; // 1 space padding each side
    });

    // Box-drawing characters
    const chars = useUnicode
      ? { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│', lt: '├', rt: '┤', tt: '┬', bt: '┴', cross: '┼' }
      : { tl: '+', tr: '+', bl: '+', br: '+', h: '-', v: '|', lt: '+', rt: '+', tt: '+', bt: '+', cross: '+' };

    const lines: string[] = [];

    // Top border
    lines.push(this.tableHorizontalLine(colWidths, chars.tl, chars.h, chars.tt, chars.tr));

    // Header row
    lines.push(this.tableDataRow(token.headers, colWidths, token.alignments, chars.v, true));

    // Header separator
    lines.push(this.tableHorizontalLine(colWidths, chars.lt, chars.h, chars.cross, chars.rt));

    // Data rows
    for (const row of token.rows) {
      lines.push(this.tableDataRow(row, colWidths, token.alignments, chars.v, false));
    }

    // Bottom border
    lines.push(this.tableHorizontalLine(colWidths, chars.bl, chars.h, chars.bt, chars.br));

    return lines.join('\n');
  }

  private tableHorizontalLine(
    colWidths: number[],
    left: string,
    fill: string,
    join: string,
    right: string
  ): string {
    const segments = colWidths.map((w) => repeatChar(fill, w));
    const line = `${left}${segments.join(join)}${right}`;
    return this.opts.colors ? `${DIM}${line}${RESET}` : line;
  }

  private tableDataRow(
    cells: string[],
    colWidths: number[],
    alignments: { align: string }[],
    separator: string,
    isHeader: boolean
  ): string {
    const renderedCells = colWidths.map((width, i) => {
      const raw = cells[i] ?? '';
      const inlineNodes = parseInline(raw);
      let rendered = this.renderInlineNodes(inlineNodes);

      if (isHeader && this.opts.colors) {
        rendered = `${BOLD}${rendered}${RESET}`;
      }

      const align = alignments[i]?.align ?? 'left';
      const innerWidth = width - 2; // Account for padding spaces
      const visLen = visibleLength(rendered);
      const padAmount = Math.max(0, innerWidth - visLen);

      let padded: string;
      switch (align) {
        case 'center': {
          const leftPad = Math.floor(padAmount / 2);
          const rightPad = padAmount - leftPad;
          padded = ' '.repeat(leftPad) + rendered + ' '.repeat(rightPad);
          break;
        }
        case 'right':
          padded = ' '.repeat(padAmount) + rendered;
          break;
        default:
          padded = rendered + ' '.repeat(padAmount);
      }

      return ` ${padded} `;
    });

    const sep = this.opts.colors ? `${DIM}${separator}${RESET}` : separator;
    return `${sep}${renderedCells.join(sep)}${sep}`;
  }

  // -------------------------------------------------------------------------
  // Horizontal Rule
  // -------------------------------------------------------------------------

  private renderHorizontalRule(): string {
    const char = this.getHRCharSingle();
    const line = repeatChar(char, this.opts.width);
    return this.opts.colors ? `${DIM}${line}${RESET}` : line;
  }

  private getHRCharSingle(): string {
    return this.opts.unicode ? '─' : '-';
  }

  // -------------------------------------------------------------------------
  // GitHub Callout
  // -------------------------------------------------------------------------

  private renderCallout(token: CalloutToken, depth: number): string {
    const style = CALLOUT_STYLES[token.kind];
    const border = this.opts.unicode ? '│' : '|';

    if (!style) {
      // Fallback: render as regular blockquote
      return this.renderBlockquote(
        { type: 'blockquote', children: token.children },
        depth
      );
    }

    const lines: string[] = [];

    // Title line
    const titlePrefix = this.opts.colors
      ? `${style.color}${border} ${style.icon} ${BOLD}${style.label}${RESET}`
      : `${border} ${style.icon} ${style.label}`;
    lines.push(titlePrefix);

    // Content
    for (const child of token.children) {
      if (child.type === 'blank') {
        lines.push(this.opts.colors ? `${style.color}${border}${RESET}` : border);
        continue;
      }
      const rendered = this.renderBlock(child, depth + 1);
      const childLines = rendered.split('\n');
      for (const line of childLines) {
        const prefix = this.opts.colors
          ? `${style.color}${border}${RESET} `
          : `${border} `;
        lines.push(`${prefix}${line}`);
      }
    }

    return lines.join('\n');
  }

  // -------------------------------------------------------------------------
  // Inline Rendering
  // -------------------------------------------------------------------------

  renderInlineNodes(nodes: InlineNode[]): string {
    let result = '';

    for (const node of nodes) {
      result += this.renderInlineNode(node);
    }

    return result;
  }

  private renderInlineNode(node: InlineNode): string {
    switch (node.type) {
      case 'text':
        return node.content;

      case 'bold': {
        const inner = this.renderInlineNodes(node.children);
        return this.opts.colors ? `${BOLD}${inner}${RESET}` : inner;
      }

      case 'italic': {
        const inner = this.renderInlineNodes(node.children);
        return this.opts.colors ? `${ITALIC}${inner}${RESET}` : inner;
      }

      case 'bold_italic': {
        const inner = this.renderInlineNodes(node.children);
        return this.opts.colors ? `${BOLD}${ITALIC}${inner}${RESET}` : inner;
      }

      case 'strikethrough': {
        const inner = this.renderInlineNodes(node.children);
        return this.opts.colors ? `${STRIKETHROUGH}${inner}${RESET}` : inner;
      }

      case 'code_span': {
        return this.opts.colors
          ? `${REVERSE} ${node.content} ${RESET}`
          : `\`${node.content}\``;
      }

      case 'link': {
        const text = this.renderInlineNodes(node.children);
        if (this.opts.showLinks) {
          const urlDisplay = this.opts.colors
            ? `${DIM}(${FG_BLUE}${UNDERLINE}${node.url}${RESET}${DIM})${RESET}`
            : `(${node.url})`;
          const linkText = this.opts.colors
            ? `${FG_CYAN}${UNDERLINE}${text}${RESET}`
            : text;
          return `${linkText} ${urlDisplay}`;
        }
        return this.opts.colors
          ? `${FG_CYAN}${UNDERLINE}${text}${RESET}`
          : text;
      }

      case 'image': {
        const label = this.opts.colors
          ? `${DIM}[image: ${FG_YELLOW}${node.alt}${RESET}${DIM}]${RESET}`
          : `[image: ${node.alt}]`;
        if (this.opts.showLinks && node.url) {
          const urlDisplay = this.opts.colors
            ? `${DIM}(${FG_BLUE}${UNDERLINE}${node.url}${RESET}${DIM})${RESET}`
            : `(${node.url})`;
          return `${label} ${urlDisplay}`;
        }
        return label;
      }

      case 'line_break':
        return '\n';
    }
  }
}
