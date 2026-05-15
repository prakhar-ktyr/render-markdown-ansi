// ============================================================================
// Lexer — Line-by-Line Tokenizer
// ============================================================================
//
// The lexer scans raw Markdown line-by-line and produces block-level tokens.
// It does NOT parse inline content — that's handled by the inline parser.
//
// This follows the CommonMark two-phase approach:
// Phase 1 (this module): Identify block structure
// Phase 2 (inline-parser): Parse inline elements within leaf blocks
//

import type {
  BlockToken,
  HeadingToken,
  CodeBlockToken,
  HorizontalRuleToken,
  TableToken,
  TableAlignment,
  ListToken,
  ListItemToken,
  BlockquoteToken,
  ParagraphToken,
  CalloutToken,
  CalloutKind,
  BlankLineToken,
} from './types.js';
import { normalizeLineEndings } from './utils.js';

// ---------------------------------------------------------------------------
// Regex Patterns
// ---------------------------------------------------------------------------

/** ATX heading: 1–6 `#` characters followed by a space or end-of-line */
const HEADING_RE = /^(#{1,6})(?:\s+(.*))?$/;

/** Fenced code block opener: 3+ backticks or tildes, optional language */
const FENCE_OPEN_RE = /^(`{3,}|~{3,})(?:\s*(\S+))?.*$/;

/** Horizontal rule: 3+ of the same character (-, *, _) with optional spaces */
const HR_RE = /^(?:([-*_])\s*){3,}$/;

/** Unordered list marker: -, *, or + followed by a space */
const UL_MARKER_RE = /^(\s*)([-*+])\s+(.*)/;

/** Ordered list marker: digits followed by . or ) and a space */
const OL_MARKER_RE = /^(\s*)(\d{1,9})[.)]\s+(.*)/;

/** Task list checkbox */
const TASK_RE = /^\[([xX ])\]\s+(.*)/;

/** Blockquote prefix */
const BQ_RE = /^>\s?(.*)/;

/** Table separator row: | --- | --- | or | :---: | etc. */
const TABLE_SEP_RE = /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;

/** Table row: starts and/or ends with | */
const TABLE_ROW_RE = /^\|(.+)\|?\s*$/;

/** GitHub callout: > [!TYPE] */
const CALLOUT_RE = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/i;

/** Indented code block: 4 spaces or 1 tab */
const INDENTED_CODE_RE = /^(?:\t| {4})(.*)/;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Tokenize a Markdown string into an array of block-level tokens.
 */
export function tokenize(input: string): BlockToken[] {
  const normalized = normalizeLineEndings(input);
  const lines = normalized.split('\n');
  return parseBlockTokens(lines, 0, lines.length);
}

// ---------------------------------------------------------------------------
// Block Token Parsing
// ---------------------------------------------------------------------------

/**
 * Parse a range of lines into block tokens.
 */
function parseBlockTokens(
  lines: string[],
  start: number,
  end: number
): BlockToken[] {
  const tokens: BlockToken[] = [];
  let i = start;

  while (i < end) {
    const line = lines[i]!;

    // --- Blank line ---
    if (line.trim() === '') {
      tokens.push({ type: 'blank' } as BlankLineToken);
      i++;
      continue;
    }

    // --- Fenced code block ---
    const fenceMatch = line.match(FENCE_OPEN_RE);
    if (fenceMatch) {
      const result = parseFencedCodeBlock(lines, i, end, fenceMatch);
      if (result) {
        tokens.push(result.token);
        i = result.nextLine;
        continue;
      }
    }

    // --- ATX heading ---
    const headingMatch = line.match(HEADING_RE);
    if (headingMatch) {
      tokens.push(parseHeading(headingMatch));
      i++;
      continue;
    }

    // --- Horizontal rule ---
    if (HR_RE.test(line)) {
      tokens.push({ type: 'hr' } as HorizontalRuleToken);
      i++;
      continue;
    }

    // --- Table ---
    if (isTableStart(lines, i, end)) {
      const result = parseTable(lines, i, end);
      tokens.push(result.token);
      i = result.nextLine;
      continue;
    }

    // --- Blockquote ---
    if (BQ_RE.test(line)) {
      const result = parseBlockquote(lines, i, end);
      tokens.push(result.token);
      i = result.nextLine;
      continue;
    }

    // --- Unordered list ---
    if (UL_MARKER_RE.test(line)) {
      const result = parseList(lines, i, end, false);
      tokens.push(result.token);
      i = result.nextLine;
      continue;
    }

    // --- Ordered list ---
    if (OL_MARKER_RE.test(line)) {
      const result = parseList(lines, i, end, true);
      tokens.push(result.token);
      i = result.nextLine;
      continue;
    }

    // --- Indented code block ---
    if (INDENTED_CODE_RE.test(line) && !isInListContext(tokens)) {
      const result = parseIndentedCodeBlock(lines, i, end);
      tokens.push(result.token);
      i = result.nextLine;
      continue;
    }

    // --- Paragraph (default) ---
    const result = parseParagraph(lines, i, end);
    tokens.push(result.token);
    i = result.nextLine;
  }

  return tokens;
}

// ---------------------------------------------------------------------------
// Individual Block Parsers
// ---------------------------------------------------------------------------

/**
 * Parse an ATX heading from a regex match.
 */
function parseHeading(match: RegExpMatchArray): HeadingToken {
  const level = match[1]!.length as 1 | 2 | 3 | 4 | 5 | 6;
  let raw = (match[2] ?? '').trim();

  // Remove optional closing # sequence
  raw = raw.replace(/\s+#+\s*$/, '').trim();

  return { type: 'heading', level, raw };
}

/**
 * Parse a fenced code block (``` or ~~~).
 */
function parseFencedCodeBlock(
  lines: string[],
  start: number,
  end: number,
  openMatch: RegExpMatchArray
): { token: CodeBlockToken; nextLine: number } | null {
  const fenceChar = openMatch[1]![0]!;
  const fenceLen = openMatch[1]!.length;
  const language = (openMatch[2] ?? '').trim();

  const contentLines: string[] = [];
  let i = start + 1;

  while (i < end) {
    const line = lines[i]!;

    // Check for closing fence: same char, at least same length, no other content
    const closingRe = new RegExp(`^${escapeRegexChar(fenceChar)}{${fenceLen},}\\s*$`);
    if (closingRe.test(line)) {
      i++;
      break;
    }

    contentLines.push(line);
    i++;
  }

  return {
    token: {
      type: 'code_block',
      language,
      content: contentLines.join('\n'),
    },
    nextLine: i,
  };
}

/**
 * Parse an indented code block (4 spaces or 1 tab).
 */
function parseIndentedCodeBlock(
  lines: string[],
  start: number,
  end: number
): { token: CodeBlockToken; nextLine: number } {
  const contentLines: string[] = [];
  let i = start;

  while (i < end) {
    const line = lines[i]!;
    const indentedMatch = line.match(INDENTED_CODE_RE);

    if (indentedMatch) {
      contentLines.push(indentedMatch[1]!);
      i++;
    } else if (line.trim() === '') {
      // Blank lines inside indented code blocks are kept
      contentLines.push('');
      i++;
    } else {
      break;
    }
  }

  // Remove trailing blank lines
  while (contentLines.length > 0 && contentLines[contentLines.length - 1] === '') {
    contentLines.pop();
  }

  return {
    token: {
      type: 'code_block',
      language: '',
      content: contentLines.join('\n'),
    },
    nextLine: i,
  };
}

/**
 * Parse a blockquote block, handling nested content recursively.
 */
function parseBlockquote(
  lines: string[],
  start: number,
  end: number
): { token: BlockquoteToken | CalloutToken; nextLine: number } {
  const innerLines: string[] = [];
  let i = start;

  while (i < end) {
    const line = lines[i]!;
    const bqMatch = line.match(BQ_RE);

    if (bqMatch) {
      innerLines.push(bqMatch[1]!);
      i++;
    } else if (line.trim() === '') {
      // Check if the next line continues the blockquote
      if (i + 1 < end && BQ_RE.test(lines[i + 1]!)) {
        // But don't merge if the next blockquote line starts a new callout
        const nextBqMatch = lines[i + 1]!.match(BQ_RE);
        if (nextBqMatch && CALLOUT_RE.test(nextBqMatch[1]!.trim())) {
          break;
        }
        innerLines.push('');
        i++;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  // Check if this is a GitHub callout
  if (innerLines.length > 0) {
    const firstLine = innerLines[0]!.trim();
    const calloutMatch = firstLine.match(CALLOUT_RE);
    if (calloutMatch) {
      const kind = calloutMatch[1]!.toUpperCase() as CalloutKind;
      const remainingLines = innerLines.slice(1);
      const children = parseBlockTokens(remainingLines, 0, remainingLines.length);
      return {
        token: { type: 'callout', kind, children },
        nextLine: i,
      };
    }
  }

  const children = parseBlockTokens(innerLines, 0, innerLines.length);
  return {
    token: { type: 'blockquote', children },
    nextLine: i,
  };
}

/**
 * Parse a list (ordered or unordered), handling nested items.
 */
function parseList(
  lines: string[],
  start: number,
  end: number,
  ordered: boolean
): { token: ListToken; nextLine: number } {
  const items: ListItemToken[] = [];
  let i = start;
  let startNum = 1;

  // Get the starting number for ordered lists
  if (ordered) {
    const match = lines[start]!.match(OL_MARKER_RE);
    if (match) {
      startNum = parseInt(match[2]!, 10);
    }
  }

  const markerRe = ordered ? OL_MARKER_RE : UL_MARKER_RE;

  while (i < end) {
    const line = lines[i]!;
    const markerMatch = line.match(markerRe);

    if (!markerMatch && i > start) {
      // Not a list item and not the first iteration — end of list
      if (line.trim() === '') {
        // Check if next line is still a list item (loose list)
        if (i + 1 < end && markerRe.test(lines[i + 1]!)) {
          i++;
          continue;
        }
      }
      if (!line.match(/^\s{2,}/) && line.trim() !== '') {
        break;
      }
    }

    if (markerMatch) {
      let itemContent = markerMatch[3]!;

      // Check for task list syntax
      let checked: boolean | null = null;
      const taskMatch = itemContent.match(TASK_RE);
      if (taskMatch) {
        checked = taskMatch[1]!.toLowerCase() === 'x';
        itemContent = taskMatch[2]!;
      }

      // Collect continuation lines for this item
      const itemLines = [itemContent];
      const baseIndent = markerMatch[1]!.length + markerMatch[2]!.length + 2;
      i++;

      while (i < end) {
        const nextLine = lines[i]!;

        if (nextLine.trim() === '') {
          // Blank line — might be a loose list
          if (i + 1 < end) {
            const afterBlank = lines[i + 1]!;
            // Check if the next non-blank line is indented (continuation) or a new list item
            if (afterBlank.match(new RegExp(`^\\s{${baseIndent},}`))) {
              itemLines.push('');
              i++;
              continue;
            }
          }
          break;
        }

        // Check if this line is a continuation (indented) or a new list item
        if (nextLine.match(new RegExp(`^\\s{${baseIndent},}`))) {
          itemLines.push(nextLine.slice(baseIndent));
          i++;
        } else if (markerRe.test(nextLine)) {
          break;
        } else {
          break;
        }
      }

      const childTokens = parseBlockTokens(itemLines, 0, itemLines.length);
      // If the first child is a paragraph, that's our item content
      // If there are no children, create a paragraph from the item content
      const children =
        childTokens.length > 0
          ? childTokens
          : [{ type: 'paragraph', raw: itemContent } as ParagraphToken];

      items.push({ type: 'list_item', checked, children });
    } else {
      i++;
    }
  }

  return {
    token: { type: 'list', ordered, start: startNum, items },
    nextLine: i,
  };
}

/**
 * Check if the current position starts a table.
 * A table requires at least a header row and a separator row.
 */
function isTableStart(lines: string[], pos: number, end: number): boolean {
  if (pos + 1 >= end) return false;

  const line1 = lines[pos]!;
  const line2 = lines[pos + 1]!;

  return TABLE_ROW_RE.test(line1) && TABLE_SEP_RE.test(line2);
}

/**
 * Parse a GFM table.
 */
function parseTable(
  lines: string[],
  start: number,
  end: number
): { token: TableToken; nextLine: number } {
  // Parse header row
  const headers = parseTableRow(lines[start]!);

  // Parse alignment row
  const alignments = parseAlignmentRow(lines[start + 1]!);

  // Parse data rows
  const rows: string[][] = [];
  let i = start + 2;

  while (i < end) {
    const line = lines[i]!;
    if (!TABLE_ROW_RE.test(line) && !line.includes('|')) break;
    if (line.trim() === '') break;
    rows.push(parseTableRow(line));
    i++;
  }

  return {
    token: { type: 'table', headers, alignments, rows },
    nextLine: i,
  };
}

/**
 * Parse a single table row into cells.
 */
function parseTableRow(line: string): string[] {
  let trimmed = line.trim();

  // Remove leading and trailing pipes
  if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
  if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);

  return trimmed.split('|').map((cell) => cell.trim());
}

/**
 * Parse a table alignment row into alignment specs.
 */
function parseAlignmentRow(line: string): TableAlignment[] {
  const cells = parseTableRow(line);
  return cells.map((cell) => {
    const trimmed = cell.trim().replace(/\s/g, '');
    const left = trimmed.startsWith(':');
    const right = trimmed.endsWith(':');

    if (left && right) return { align: 'center' as const };
    if (right) return { align: 'right' as const };
    if (left) return { align: 'left' as const };
    return { align: 'none' as const };
  });
}

/**
 * Parse a paragraph (one or more consecutive non-blank, non-special lines).
 */
function parseParagraph(
  lines: string[],
  start: number,
  end: number
): { token: ParagraphToken; nextLine: number } {
  const contentLines: string[] = [];
  let i = start;

  while (i < end) {
    const line = lines[i]!;

    // Stop at blank lines or block-level constructs
    if (line.trim() === '') break;
    if (HEADING_RE.test(line)) break;
    if (FENCE_OPEN_RE.test(line)) break;
    if (HR_RE.test(line)) break;
    if (BQ_RE.test(line)) break;
    if (UL_MARKER_RE.test(line)) break;
    if (OL_MARKER_RE.test(line)) break;
    if (isTableStart(lines, i, end)) break;

    contentLines.push(line);
    i++;
  }

  return {
    token: {
      type: 'paragraph',
      raw: contentLines.join('\n'),
    },
    nextLine: i,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Check if the last non-blank token is a list (to avoid misidentifying
 * indented code blocks within list context).
 */
function isInListContext(tokens: BlockToken[]): boolean {
  for (let i = tokens.length - 1; i >= 0; i--) {
    const token = tokens[i]!;
    if (token.type === 'blank') continue;
    return token.type === 'list';
  }
  return false;
}

/**
 * Escape a character for use in a regex.
 */
function escapeRegexChar(char: string): string {
  return char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
