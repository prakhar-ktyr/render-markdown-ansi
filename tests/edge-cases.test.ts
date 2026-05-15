import { describe, it, expect } from 'vitest';
import { renderMarkdown } from '../src/index';
import { stripAnsi } from '../src/utils';

describe('Edge Cases', () => {
  it('should handle null-ish empty input', () => {
    expect(renderMarkdown('')).toBe('');
  });

  it('should handle whitespace-only input', () => {
    const output = renderMarkdown('   \n\n   ');
    expect(output).toBeDefined();
  });

  it('should handle extremely long lines', () => {
    const longLine = 'x'.repeat(5000);
    const output = renderMarkdown(longLine);
    expect(stripAnsi(output)).toContain('x');
  });

  it('should handle deeply nested blockquotes', () => {
    const md = '> > > > > Deep nesting';
    const output = renderMarkdown(md);
    expect(stripAnsi(output)).toContain('Deep nesting');
  });

  it('should handle unclosed bold markers', () => {
    const output = renderMarkdown('**unclosed bold');
    expect(stripAnsi(output)).toContain('**unclosed bold');
  });

  it('should handle unclosed italic markers', () => {
    const output = renderMarkdown('*unclosed italic');
    expect(stripAnsi(output)).toContain('*unclosed italic');
  });

  it('should handle mismatched code fences', () => {
    const md = '```\nsome code\n~~~';
    const output = renderMarkdown(md);
    expect(stripAnsi(output)).toContain('some code');
  });

  it('should handle backslash at end of input', () => {
    const output = renderMarkdown('text\\');
    expect(output).toBeDefined();
  });

  it('should handle only hashes', () => {
    const output = renderMarkdown('######');
    expect(output).toBeDefined();
  });

  it('should handle empty list items', () => {
    const md = '- \n- \n- ';
    const output = renderMarkdown(md);
    expect(output).toBeDefined();
  });

  it('should handle table with unequal columns', () => {
    const md = '| A | B | C |\n| --- | --- | --- |\n| 1 |';
    const output = renderMarkdown(md);
    expect(output).toBeDefined();
  });

  it('should handle consecutive headings', () => {
    const md = '# H1\n## H2\n### H3';
    const output = renderMarkdown(md, { colors: false });
    expect(output).toContain('H1');
    expect(output).toContain('H2');
    expect(output).toContain('H3');
  });

  it('should handle special characters in paragraphs', () => {
    const md = 'Special chars: <>&"\'';
    const output = renderMarkdown(md, { colors: false });
    expect(output).toContain('<>&"\'');
  });

  it('should handle markdown with only blank lines', () => {
    const output = renderMarkdown('\n\n\n\n');
    expect(output).toBeDefined();
  });

  it('should handle CRLF line endings', () => {
    const output = renderMarkdown('# Title\r\n\r\nContent');
    expect(stripAnsi(output)).toContain('Title');
    expect(stripAnsi(output)).toContain('Content');
  });

  it('should handle link with empty text', () => {
    const output = renderMarkdown('[](https://example.com)');
    expect(output).toBeDefined();
  });

  it('should handle image with empty alt', () => {
    const output = renderMarkdown('![](image.png)');
    expect(output).toBeDefined();
  });
});
