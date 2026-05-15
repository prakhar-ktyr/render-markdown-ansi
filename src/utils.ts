// ============================================================================
// String Utility Helpers
// ============================================================================

/**
 * Regex to match ANSI escape sequences (SGR and other CSI sequences).
 */
// eslint-disable-next-line no-control-regex
const ANSI_REGEX = /\x1b\[[0-9;]*[a-zA-Z]/g;

/**
 * Strip all ANSI escape codes from a string.
 */
export function stripAnsi(str: string): string {
  return str.replace(ANSI_REGEX, '');
}

/**
 * Get the visible character count of a string (ignoring ANSI escape codes).
 */
export function visibleLength(str: string): number {
  return stripAnsi(str).length;
}

/**
 * Word-wrap a string to a given width, respecting ANSI escape codes.
 * ANSI codes do not count toward the visible width.
 */
export function wrapText(text: string, maxWidth: number): string[] {
  if (maxWidth <= 0) return [text];

  const lines: string[] = [];
  const inputLines = text.split('\n');

  for (const inputLine of inputLines) {
    if (visibleLength(inputLine) <= maxWidth) {
      lines.push(inputLine);
      continue;
    }

    // Split by words, preserving ANSI codes attached to words
    const words = splitWordsPreservingAnsi(inputLine);
    let currentLine = '';
    let currentVisibleLen = 0;

    for (const word of words) {
      const wordVisibleLen = visibleLength(word);

      if (currentVisibleLen === 0) {
        // First word on the line — always add it (even if too long)
        currentLine = word;
        currentVisibleLen = wordVisibleLen;
      } else if (currentVisibleLen + 1 + wordVisibleLen <= maxWidth) {
        // Fits on current line with a space
        currentLine += ' ' + word;
        currentVisibleLen += 1 + wordVisibleLen;
      } else {
        // Doesn't fit — wrap
        lines.push(currentLine);
        currentLine = word;
        currentVisibleLen = wordVisibleLen;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

/**
 * Split a string into words, keeping ANSI codes attached to the words they precede.
 */
function splitWordsPreservingAnsi(text: string): string[] {
  const words: string[] = [];
  let current = '';
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    if (char === '\x1b') {
      // Consume the entire ANSI sequence
      let seq = char;
      i++;
      while (i < text.length && !isAnsiTerminator(text[i]!)) {
        seq += text[i];
        i++;
      }
      if (i < text.length) {
        seq += text[i];
        i++;
      }
      current += seq;
    } else if (char === ' ' || char === '\t') {
      if (current) {
        words.push(current);
        current = '';
      }
      i++;
    } else {
      current += char;
      i++;
    }
  }

  if (current) {
    words.push(current);
  }

  return words;
}

/**
 * Check if a character is an ANSI sequence terminator (letter).
 */
function isAnsiTerminator(char: string): boolean {
  const code = char.charCodeAt(0);
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

/**
 * Right-pad a string to a given visible width.
 */
export function padRight(str: string, width: number): string {
  const visible = visibleLength(str);
  if (visible >= width) return str;
  return str + ' '.repeat(width - visible);
}

/**
 * Center a string within a given visible width.
 */
export function padCenter(str: string, width: number): string {
  const visible = visibleLength(str);
  if (visible >= width) return str;
  const totalPad = width - visible;
  const leftPad = Math.floor(totalPad / 2);
  const rightPad = totalPad - leftPad;
  return ' '.repeat(leftPad) + str + ' '.repeat(rightPad);
}

/**
 * Repeat a character N times.
 */
export function repeatChar(char: string, n: number): string {
  return n > 0 ? char.repeat(n) : '';
}

/**
 * Indent every line of a string by a given number of spaces.
 */
export function indentText(text: string, spaces: number): string {
  const prefix = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => prefix + line)
    .join('\n');
}

/**
 * Escape special characters in a string for use in a regex.
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Normalize line endings to \n.
 */
export function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n?/g, '\n');
}

/**
 * Dedent a code block string by removing common leading whitespace.
 */
export function dedent(text: string): string {
  const lines = text.split('\n');
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0);

  if (nonEmptyLines.length === 0) return text;

  const minIndent = Math.min(
    ...nonEmptyLines.map((line) => {
      const match = line.match(/^(\s*)/);
      return match ? match[1]!.length : 0;
    })
  );

  if (minIndent === 0) return text;

  return lines.map((line) => line.slice(minIndent)).join('\n');
}
