// ============================================================================
// Inline Parser — Parse Inline Elements Within Leaf Blocks
// ============================================================================
//
// CommonMark Phase 2: process raw text content of leaf blocks (paragraphs,
// headings) to produce inline AST nodes.
//
// Implements:
// - Bold (**text** / __text__)
// - Italic (*text* / _text_)
// - Bold + Italic (***text***)
// - Strikethrough (~~text~~) — GFM
// - Code spans (`code`)
// - Links [text](url "title")
// - Images ![alt](url "title")
// - Autolinks <url>
// - Hard line breaks (trailing 2+ spaces or backslash)
// - Backslash escapes
//

import type { InlineNode } from './types.js';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse a raw inline text string into an array of InlineNode.
 */
export function parseInline(text: string): InlineNode[] {
  const parser = new InlineParser(text);
  return parser.parse();
}

// ---------------------------------------------------------------------------
// InlineParser Class
// ---------------------------------------------------------------------------

class InlineParser {
  private readonly text: string;
  private pos: number;

  constructor(text: string) {
    this.text = text;
    this.pos = 0;
  }

  parse(): InlineNode[] {
    return this.parseUntil(null);
  }

  /**
   * Parse inline nodes until we hit a delimiter or end of input.
   */
  private parseUntil(stopDelimiter: string | null): InlineNode[] {
    const nodes: InlineNode[] = [];
    let textBuf = '';

    const flushText = () => {
      if (textBuf) {
        nodes.push({ type: 'text', content: textBuf });
        textBuf = '';
      }
    };

    while (this.pos < this.text.length) {
      // Check for stop delimiter
      if (stopDelimiter && this.lookingAt(stopDelimiter)) {
        break;
      }

      const ch = this.text[this.pos]!;
      const next = this.pos + 1 < this.text.length ? this.text[this.pos + 1] : '';

      // --- Backslash escape ---
      if (ch === '\\' && this.pos + 1 < this.text.length) {
        const escaped = this.text[this.pos + 1]!;
        if (isPunctuation(escaped)) {
          flushText();
          textBuf += escaped;
          this.pos += 2;
          continue;
        }
        // Check for hard line break: backslash at end of line
        if (escaped === '\n') {
          flushText();
          nodes.push({ type: 'line_break' });
          this.pos += 2;
          continue;
        }
      }

      // --- Hard line break: two or more spaces before newline ---
      if (ch === ' ' && this.lookingAtHardBreak()) {
        flushText();
        nodes.push({ type: 'line_break' });
        // Skip spaces and the newline
        while (this.pos < this.text.length && this.text[this.pos] === ' ') this.pos++;
        if (this.pos < this.text.length && this.text[this.pos] === '\n') this.pos++;
        continue;
      }

      // --- Soft line break (newline not preceded by 2+ spaces) ---
      if (ch === '\n') {
        textBuf += ' ';
        this.pos++;
        continue;
      }

      // --- Code span ---
      if (ch === '`') {
        const result = this.tryParseCodeSpan();
        if (result) {
          flushText();
          nodes.push(result);
          continue;
        }
      }

      // --- Image ---
      if (ch === '!' && next === '[') {
        const result = this.tryParseImage();
        if (result) {
          flushText();
          nodes.push(result);
          continue;
        }
      }

      // --- Link ---
      if (ch === '[') {
        const result = this.tryParseLink();
        if (result) {
          flushText();
          nodes.push(result);
          continue;
        }
      }

      // --- Autolink ---
      if (ch === '<') {
        const result = this.tryParseAutolink();
        if (result) {
          flushText();
          nodes.push(result);
          continue;
        }
      }

      // --- Strikethrough (GFM) ---
      if (ch === '~' && next === '~') {
        const result = this.tryParseDelimited('~~', 'strikethrough');
        if (result) {
          flushText();
          nodes.push(result);
          continue;
        }
      }

      // --- Bold + Italic (***) ---
      if (ch === '*' && next === '*' && this.charAt(this.pos + 2) === '*') {
        const result = this.tryParseDelimited('***', 'bold_italic');
        if (result) {
          flushText();
          nodes.push(result);
          continue;
        }
      }

      // --- Bold (**) ---
      if (ch === '*' && next === '*') {
        const result = this.tryParseDelimited('**', 'bold');
        if (result) {
          flushText();
          nodes.push(result);
          continue;
        }
      }

      // --- Italic (*) ---
      if (ch === '*') {
        const result = this.tryParseDelimited('*', 'italic');
        if (result) {
          flushText();
          nodes.push(result);
          continue;
        }
      }

      // --- Bold + Italic (___) ---
      if (ch === '_' && next === '_' && this.charAt(this.pos + 2) === '_') {
        const result = this.tryParseDelimited('___', 'bold_italic');
        if (result) {
          flushText();
          nodes.push(result);
          continue;
        }
      }

      // --- Bold (__) ---
      if (ch === '_' && next === '_') {
        const result = this.tryParseDelimited('__', 'bold');
        if (result) {
          flushText();
          nodes.push(result);
          continue;
        }
      }

      // --- Italic (_) ---
      if (ch === '_') {
        const result = this.tryParseDelimited('_', 'italic');
        if (result) {
          flushText();
          nodes.push(result);
          continue;
        }
      }

      // --- Plain text ---
      textBuf += ch;
      this.pos++;
    }

    flushText();
    return nodes;
  }

  // -------------------------------------------------------------------------
  // Code Span Parser
  // -------------------------------------------------------------------------

  private tryParseCodeSpan(): InlineNode | null {
    // Count opening backticks
    let backtickCount = 0;
    let scanPos = this.pos;
    while (scanPos < this.text.length && this.text[scanPos] === '`') {
      backtickCount++;
      scanPos++;
    }

    // Find matching closing backticks
    const closingPattern = '`'.repeat(backtickCount);
    let searchPos = scanPos;

    while (searchPos < this.text.length) {
      const closeIdx = this.text.indexOf(closingPattern, searchPos);
      if (closeIdx === -1) return null;

      // Make sure the closing backticks aren't part of a longer run
      const afterClose = closeIdx + backtickCount;
      if (afterClose < this.text.length && this.text[afterClose] === '`') {
        searchPos = afterClose;
        while (searchPos < this.text.length && this.text[searchPos] === '`') searchPos++;
        continue;
      }

      // Extract content between backticks
      let content = this.text.slice(scanPos, closeIdx);

      // Normalize: collapse internal whitespace (including newlines) to single spaces
      content = content.replace(/\n/g, ' ');

      // Strip a single leading and trailing space if both exist
      if (
        content.length >= 2 &&
        content[0] === ' ' &&
        content[content.length - 1] === ' ' &&
        content.trim().length > 0
      ) {
        content = content.slice(1, -1);
      }

      this.pos = afterClose;
      return { type: 'code_span', content };
    }

    return null;
  }

  // -------------------------------------------------------------------------
  // Link Parser: [text](url "title")
  // -------------------------------------------------------------------------

  private tryParseLink(): InlineNode | null {
    const startPos = this.pos;

    // Skip '['
    this.pos++;

    // Find matching ']' — handle nested brackets
    const textEnd = this.findClosingBracket('[', ']');
    if (textEnd === -1) {
      this.pos = startPos;
      return null;
    }

    const linkText = this.text.slice(startPos + 1, textEnd);
    this.pos = textEnd + 1; // Move past ']'

    // Expect '(' immediately after ']'
    if (this.pos >= this.text.length || this.text[this.pos] !== '(') {
      this.pos = startPos;
      return null;
    }

    this.pos++; // Skip '('

    // Parse URL and optional title
    const dest = this.parseLinkDestination();
    if (!dest) {
      this.pos = startPos;
      return null;
    }

    // Parse the link text for inline elements
    const childParser = new InlineParser(linkText);
    const children = childParser.parse();

    return {
      type: 'link',
      children,
      url: dest.url,
      title: dest.title,
    };
  }

  // -------------------------------------------------------------------------
  // Image Parser: ![alt](url "title")
  // -------------------------------------------------------------------------

  private tryParseImage(): InlineNode | null {
    const startPos = this.pos;

    // Skip '!['
    this.pos += 2;

    // Find matching ']'
    const altEnd = this.findClosingBracket('[', ']');
    if (altEnd === -1) {
      this.pos = startPos;
      return null;
    }

    const alt = this.text.slice(startPos + 2, altEnd);
    this.pos = altEnd + 1;

    // Expect '('
    if (this.pos >= this.text.length || this.text[this.pos] !== '(') {
      this.pos = startPos;
      return null;
    }

    this.pos++;

    const dest = this.parseLinkDestination();
    if (!dest) {
      this.pos = startPos;
      return null;
    }

    return {
      type: 'image',
      alt,
      url: dest.url,
      title: dest.title,
    };
  }

  // -------------------------------------------------------------------------
  // Autolink Parser: <url> or <email>
  // -------------------------------------------------------------------------

  private tryParseAutolink(): InlineNode | null {
    const startPos = this.pos;
    this.pos++; // Skip '<'

    let content = '';
    while (this.pos < this.text.length && this.text[this.pos] !== '>') {
      if (this.text[this.pos] === '\n' || this.text[this.pos] === '<') {
        this.pos = startPos;
        return null;
      }
      content += this.text[this.pos];
      this.pos++;
    }

    if (this.pos >= this.text.length) {
      this.pos = startPos;
      return null;
    }

    this.pos++; // Skip '>'

    // Validate: must look like a URL or email
    if (isUrl(content) || isEmail(content)) {
      const url = isEmail(content) ? `mailto:${content}` : content;
      return {
        type: 'link',
        children: [{ type: 'text', content }],
        url,
        title: '',
      };
    }

    this.pos = startPos;
    return null;
  }

  // -------------------------------------------------------------------------
  // Delimiter-Based Parsing (bold, italic, strikethrough)
  // -------------------------------------------------------------------------

  private tryParseDelimited(
    delimiter: string,
    nodeType: 'bold' | 'italic' | 'bold_italic' | 'strikethrough'
  ): InlineNode | null {
    const startPos = this.pos;

    // Check that closing delimiter exists somewhere ahead
    const afterOpen = this.pos + delimiter.length;
    const closeIdx = this.text.indexOf(delimiter, afterOpen);
    if (closeIdx === -1) return null;

    // Check that the content is not empty
    const innerText = this.text.slice(afterOpen, closeIdx);
    if (innerText.trim().length === 0) return null;

    // Skip the opening delimiter
    this.pos = afterOpen;

    // Parse children until we hit the closing delimiter
    const children = this.parseUntil(delimiter);

    // Check that we actually found the closing delimiter
    if (!this.lookingAt(delimiter)) {
      this.pos = startPos;
      return null;
    }

    // Skip the closing delimiter
    this.pos += delimiter.length;

    if (children.length === 0) {
      this.pos = startPos;
      return null;
    }

    return { type: nodeType, children } as InlineNode;
  }

  // -------------------------------------------------------------------------
  // Link Destination Parser
  // -------------------------------------------------------------------------

  private parseLinkDestination(): { url: string; title: string } | null {
    this.skipSpaces();

    let url = '';
    let title = '';

    // Handle <angle-bracket> URLs
    if (this.pos < this.text.length && this.text[this.pos] === '<') {
      this.pos++;
      while (this.pos < this.text.length && this.text[this.pos] !== '>') {
        url += this.text[this.pos];
        this.pos++;
      }
      if (this.pos < this.text.length) this.pos++; // Skip '>'
    } else {
      // Bare URL — read until space or ')'
      let parenDepth = 0;
      while (this.pos < this.text.length) {
        const c = this.text[this.pos]!;
        if (c === '(') {
          parenDepth++;
          url += c;
          this.pos++;
        } else if (c === ')') {
          if (parenDepth > 0) {
            parenDepth--;
            url += c;
            this.pos++;
          } else {
            break;
          }
        } else if (c === ' ' || c === '\t' || c === '\n') {
          break;
        } else {
          url += c;
          this.pos++;
        }
      }
    }

    this.skipSpaces();

    // Optional title
    if (this.pos < this.text.length) {
      const quoteChar = this.text[this.pos]!;
      if (quoteChar === '"' || quoteChar === "'") {
        this.pos++;
        while (this.pos < this.text.length && this.text[this.pos] !== quoteChar) {
          title += this.text[this.pos];
          this.pos++;
        }
        if (this.pos < this.text.length) this.pos++; // Skip closing quote
      }
    }

    this.skipSpaces();

    // Expect closing ')'
    if (this.pos >= this.text.length || this.text[this.pos] !== ')') {
      return null;
    }

    this.pos++; // Skip ')'

    return { url, title };
  }

  // -------------------------------------------------------------------------
  // Utility Methods
  // -------------------------------------------------------------------------

  private lookingAt(str: string): boolean {
    return this.text.startsWith(str, this.pos);
  }

  private lookingAtHardBreak(): boolean {
    // Two or more spaces followed by a newline
    let i = this.pos;
    let spaceCount = 0;
    while (i < this.text.length && this.text[i] === ' ') {
      spaceCount++;
      i++;
    }
    return spaceCount >= 2 && i < this.text.length && this.text[i] === '\n';
  }

  private charAt(index: number): string {
    return index < this.text.length ? this.text[index]! : '';
  }

  private skipSpaces(): void {
    while (this.pos < this.text.length && (this.text[this.pos] === ' ' || this.text[this.pos] === '\t')) {
      this.pos++;
    }
  }

  private findClosingBracket(open: string, close: string): number {
    let depth = 1;
    let i = this.pos;

    while (i < this.text.length && depth > 0) {
      if (this.text[i] === '\\' && i + 1 < this.text.length) {
        i += 2; // Skip escaped character
        continue;
      }
      if (this.text[i] === open) depth++;
      if (this.text[i] === close) depth--;
      if (depth > 0) i++;
    }

    return depth === 0 ? i : -1;
  }
}

// ---------------------------------------------------------------------------
// Character Classification Helpers
// ---------------------------------------------------------------------------

function isPunctuation(ch: string): boolean {
  return /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/.test(ch);
}

function isUrl(str: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/\S+$/.test(str) || /^[a-zA-Z][a-zA-Z0-9+.-]*:\S+$/.test(str);
}

function isEmail(str: string): boolean {
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(str);
}
