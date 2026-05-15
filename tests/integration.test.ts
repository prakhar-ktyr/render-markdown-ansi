import { describe, it, expect } from 'vitest';
import { renderMarkdown, parse, render, parseInlineContent } from '../src/index';
import { stripAnsi } from '../src/utils';

describe('Integration Tests', () => {
  describe('renderMarkdown()', () => {
    it('should handle empty string', () => {
      expect(renderMarkdown('')).toBe('');
    });

    it('should render a simple heading', () => {
      const output = renderMarkdown('# Hello World');
      expect(stripAnsi(output)).toContain('Hello World');
    });

    it('should render heading with inline formatting', () => {
      const output = renderMarkdown('# Hello **World**');
      expect(stripAnsi(output)).toContain('Hello World');
    });

    it('should render paragraph with bold and italic', () => {
      const output = renderMarkdown('This is **bold** and *italic*.');
      const plain = stripAnsi(output);
      expect(plain).toContain('bold');
      expect(plain).toContain('italic');
    });

    it('should render a code block', () => {
      const md = '```javascript\nconst x = 42;\n```';
      const output = renderMarkdown(md);
      const plain = stripAnsi(output);
      expect(plain).toContain('javascript');
      expect(plain).toContain('const x = 42;');
    });

    it('should render a blockquote', () => {
      const output = renderMarkdown('> This is a quote');
      const plain = stripAnsi(output);
      expect(plain).toContain('This is a quote');
    });

    it('should render an unordered list', () => {
      const md = '- Item 1\n- Item 2\n- Item 3';
      const output = renderMarkdown(md);
      const plain = stripAnsi(output);
      expect(plain).toContain('Item 1');
      expect(plain).toContain('Item 2');
      expect(plain).toContain('Item 3');
    });

    it('should render an ordered list', () => {
      const md = '1. First\n2. Second\n3. Third';
      const output = renderMarkdown(md);
      const plain = stripAnsi(output);
      expect(plain).toContain('First');
      expect(plain).toContain('Second');
    });

    it('should render a table', () => {
      const md = '| Name | Age |\n| --- | --- |\n| Alice | 30 |';
      const output = renderMarkdown(md);
      const plain = stripAnsi(output);
      expect(plain).toContain('Name');
      expect(plain).toContain('Alice');
      expect(plain).toContain('30');
    });

    it('should render a horizontal rule', () => {
      const output = renderMarkdown('---');
      expect(output.trim().length).toBeGreaterThan(0);
    });

    it('should render a link', () => {
      const output = renderMarkdown('[Google](https://google.com)');
      const plain = stripAnsi(output);
      expect(plain).toContain('Google');
      expect(plain).toContain('https://google.com');
    });

    it('should render GitHub callouts', () => {
      const md = '> [!WARNING]\n> Be careful with this!';
      const output = renderMarkdown(md);
      const plain = stripAnsi(output);
      expect(plain).toContain('Warning');
      expect(plain).toContain('Be careful with this!');
    });

    it('should render task lists', () => {
      const md = '- [x] Done\n- [ ] Todo';
      const output = renderMarkdown(md);
      const plain = stripAnsi(output);
      expect(plain).toContain('Done');
      expect(plain).toContain('Todo');
    });

    it('should respect colors: false option', () => {
      const output = renderMarkdown('# Hello', { colors: false });
      expect(output).not.toContain('\x1b[');
    });

    it('should respect width option', () => {
      const longText = 'This is a very long paragraph that should be wrapped at the specified width when rendered.';
      const output = renderMarkdown(longText, { width: 30, colors: false });
      const lines = output.trim().split('\n');
      expect(lines.length).toBeGreaterThan(1);
    });

    it('should respect unicode: false option', () => {
      const output = renderMarkdown('- Item', { unicode: false, colors: false });
      expect(output).toContain('-');
      expect(output).not.toContain('•');
    });

    it('should handle showLinks: false', () => {
      const output = renderMarkdown('[text](url)', { showLinks: false, colors: false });
      expect(output).not.toContain('url');
    });
  });

  describe('parse()', () => {
    it('should return block tokens', () => {
      const tokens = parse('# Heading\n\nParagraph');
      expect(tokens.some((t) => t.type === 'heading')).toBe(true);
      expect(tokens.some((t) => t.type === 'paragraph')).toBe(true);
    });
  });

  describe('render()', () => {
    it('should render pre-parsed tokens', () => {
      const tokens = parse('# Hello');
      const output = render(tokens, { colors: false });
      expect(output).toContain('Hello');
    });
  });

  describe('parseInlineContent()', () => {
    it('should parse inline markdown', () => {
      const nodes = parseInlineContent('**bold** and *italic*');
      expect(nodes.some((n) => n.type === 'bold')).toBe(true);
      expect(nodes.some((n) => n.type === 'italic')).toBe(true);
    });
  });

  describe('Complex Documents', () => {
    it('should handle a full README-like document', () => {
      const md = [
        '# My Project',
        '',
        'A **great** project for doing things.',
        '',
        '## Installation',
        '',
        '```bash',
        'npm install my-project',
        '```',
        '',
        '## Features',
        '',
        '- [x] Feature 1',
        '- [ ] Feature 2',
        '- [ ] Feature 3',
        '',
        '## API',
        '',
        '| Method | Description |',
        '| --- | --- |',
        '| `foo()` | Does foo |',
        '| `bar()` | Does bar |',
        '',
        '> [!NOTE]',
        '> This is still in beta.',
        '',
        '---',
        '',
        '*Made with love*',
      ].join('\n');

      const output = renderMarkdown(md);
      const plain = stripAnsi(output);
      expect(plain).toContain('My Project');
      expect(plain).toContain('Installation');
      expect(plain).toContain('npm install my-project');
      expect(plain).toContain('Feature 1');
      expect(plain).toContain('foo()');
      expect(plain).toContain('Note');
      expect(plain).toContain('Made with love');
    });
  });
});
