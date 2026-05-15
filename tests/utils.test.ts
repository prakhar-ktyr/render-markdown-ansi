import { describe, it, expect } from 'vitest';
import {
  stripAnsi,
  visibleLength,
  wrapText,
  padRight,
  padCenter,
  repeatChar,
  indentText,
  normalizeLineEndings,
  dedent,
} from '../src/utils';

describe('Utils', () => {
  describe('stripAnsi', () => {
    it('should strip ANSI codes', () => {
      expect(stripAnsi('\x1b[1mHello\x1b[0m')).toBe('Hello');
    });

    it('should handle strings without ANSI codes', () => {
      expect(stripAnsi('plain text')).toBe('plain text');
    });

    it('should handle empty string', () => {
      expect(stripAnsi('')).toBe('');
    });

    it('should strip multiple ANSI codes', () => {
      expect(stripAnsi('\x1b[1m\x1b[31mRed Bold\x1b[0m')).toBe('Red Bold');
    });
  });

  describe('visibleLength', () => {
    it('should return length of plain text', () => {
      expect(visibleLength('Hello')).toBe(5);
    });

    it('should ignore ANSI codes in length', () => {
      expect(visibleLength('\x1b[1mHello\x1b[0m')).toBe(5);
    });

    it('should return 0 for empty string', () => {
      expect(visibleLength('')).toBe(0);
    });
  });

  describe('wrapText', () => {
    it('should not wrap short text', () => {
      const result = wrapText('Hello', 80);
      expect(result).toEqual(['Hello']);
    });

    it('should wrap long text at word boundaries', () => {
      const result = wrapText('Hello world foo bar', 10);
      expect(result.length).toBeGreaterThan(1);
    });

    it('should handle text with ANSI codes', () => {
      const result = wrapText('\x1b[1mHello\x1b[0m world', 5);
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle zero width', () => {
      const result = wrapText('Hello', 0);
      expect(result).toEqual(['Hello']);
    });
  });

  describe('padRight', () => {
    it('should pad string to target width', () => {
      expect(padRight('Hi', 5)).toBe('Hi   ');
    });

    it('should not pad if already at width', () => {
      expect(padRight('Hello', 5)).toBe('Hello');
    });

    it('should not pad if wider than target', () => {
      expect(padRight('Hello World', 5)).toBe('Hello World');
    });
  });

  describe('padCenter', () => {
    it('should center string', () => {
      const result = padCenter('Hi', 6);
      expect(result).toBe('  Hi  ');
    });
  });

  describe('repeatChar', () => {
    it('should repeat character', () => {
      expect(repeatChar('-', 5)).toBe('-----');
    });

    it('should return empty for 0', () => {
      expect(repeatChar('-', 0)).toBe('');
    });

    it('should return empty for negative', () => {
      expect(repeatChar('-', -1)).toBe('');
    });
  });

  describe('indentText', () => {
    it('should indent all lines', () => {
      expect(indentText('a\nb', 2)).toBe('  a\n  b');
    });
  });

  describe('normalizeLineEndings', () => {
    it('should convert CRLF to LF', () => {
      expect(normalizeLineEndings('a\r\nb')).toBe('a\nb');
    });

    it('should convert CR to LF', () => {
      expect(normalizeLineEndings('a\rb')).toBe('a\nb');
    });

    it('should leave LF unchanged', () => {
      expect(normalizeLineEndings('a\nb')).toBe('a\nb');
    });
  });

  describe('dedent', () => {
    it('should remove common leading whitespace', () => {
      expect(dedent('  a\n  b')).toBe('a\nb');
    });

    it('should handle mixed indentation', () => {
      expect(dedent('    a\n  b')).toBe('  a\nb');
    });

    it('should handle no indentation', () => {
      expect(dedent('a\nb')).toBe('a\nb');
    });
  });
});
