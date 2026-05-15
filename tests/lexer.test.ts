import { describe, it, expect } from 'vitest';
import { tokenize } from '../src/lexer';
import type { BlockToken } from '../src/types';

describe('Lexer', () => {
  // =========================================================================
  // Headings
  // =========================================================================
  describe('Headings', () => {
    it('should parse ATX headings level 1-6', () => {
      const tokens = tokenize('# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6');
      const headings = tokens.filter((t) => t.type === 'heading');

      expect(headings).toHaveLength(6);
      expect(headings[0]).toMatchObject({ type: 'heading', level: 1, raw: 'H1' });
      expect(headings[1]).toMatchObject({ type: 'heading', level: 2, raw: 'H2' });
      expect(headings[2]).toMatchObject({ type: 'heading', level: 3, raw: 'H3' });
      expect(headings[3]).toMatchObject({ type: 'heading', level: 4, raw: 'H4' });
      expect(headings[4]).toMatchObject({ type: 'heading', level: 5, raw: 'H5' });
      expect(headings[5]).toMatchObject({ type: 'heading', level: 6, raw: 'H6' });
    });

    it('should strip trailing hash marks from headings', () => {
      const tokens = tokenize('# Hello ##');
      const heading = tokens.find((t) => t.type === 'heading');
      expect(heading).toMatchObject({ type: 'heading', level: 1, raw: 'Hello' });
    });

    it('should handle headings with no text', () => {
      const tokens = tokenize('#');
      const heading = tokens.find((t) => t.type === 'heading');
      expect(heading).toMatchObject({ type: 'heading', level: 1, raw: '' });
    });

    it('should not parse 7+ hashes as heading', () => {
      const tokens = tokenize('####### Not a heading');
      const headings = tokens.filter((t) => t.type === 'heading');
      expect(headings).toHaveLength(0);
    });
  });

  // =========================================================================
  // Paragraphs
  // =========================================================================
  describe('Paragraphs', () => {
    it('should parse simple paragraphs', () => {
      const tokens = tokenize('Hello world');
      expect(tokens).toContainEqual(
        expect.objectContaining({ type: 'paragraph', raw: 'Hello world' })
      );
    });

    it('should merge consecutive lines into one paragraph', () => {
      const tokens = tokenize('Line 1\nLine 2\nLine 3');
      const paragraphs = tokens.filter((t) => t.type === 'paragraph');
      expect(paragraphs).toHaveLength(1);
      expect(paragraphs[0]).toMatchObject({
        type: 'paragraph',
        raw: 'Line 1\nLine 2\nLine 3',
      });
    });

    it('should separate paragraphs by blank lines', () => {
      const tokens = tokenize('Para 1\n\nPara 2');
      const paragraphs = tokens.filter((t) => t.type === 'paragraph');
      expect(paragraphs).toHaveLength(2);
    });
  });

  // =========================================================================
  // Code Blocks
  // =========================================================================
  describe('Code Blocks', () => {
    it('should parse fenced code blocks with backticks', () => {
      const tokens = tokenize('```\ncode here\n```');
      const codeBlock = tokens.find((t) => t.type === 'code_block');
      expect(codeBlock).toMatchObject({
        type: 'code_block',
        language: '',
        content: 'code here',
      });
    });

    it('should parse fenced code blocks with language', () => {
      const tokens = tokenize('```javascript\nconst x = 1;\n```');
      const codeBlock = tokens.find((t) => t.type === 'code_block');
      expect(codeBlock).toMatchObject({
        type: 'code_block',
        language: 'javascript',
        content: 'const x = 1;',
      });
    });

    it('should parse fenced code blocks with tildes', () => {
      const tokens = tokenize('~~~python\nprint("hi")\n~~~');
      const codeBlock = tokens.find((t) => t.type === 'code_block');
      expect(codeBlock).toMatchObject({
        type: 'code_block',
        language: 'python',
        content: 'print("hi")',
      });
    });

    it('should preserve multi-line code content', () => {
      const tokens = tokenize('```\nline 1\nline 2\nline 3\n```');
      const codeBlock = tokens.find((t) => t.type === 'code_block');
      expect(codeBlock).toMatchObject({
        type: 'code_block',
        content: 'line 1\nline 2\nline 3',
      });
    });

    it('should handle empty code blocks', () => {
      const tokens = tokenize('```\n```');
      const codeBlock = tokens.find((t) => t.type === 'code_block');
      expect(codeBlock).toMatchObject({
        type: 'code_block',
        content: '',
      });
    });

    it('should handle unclosed code fences (treat rest as code)', () => {
      const tokens = tokenize('```\nunclosed code');
      const codeBlock = tokens.find((t) => t.type === 'code_block');
      expect(codeBlock).toMatchObject({
        type: 'code_block',
        content: 'unclosed code',
      });
    });
  });

  // =========================================================================
  // Horizontal Rules
  // =========================================================================
  describe('Horizontal Rules', () => {
    it('should parse --- as horizontal rule', () => {
      const tokens = tokenize('---');
      expect(tokens).toContainEqual(expect.objectContaining({ type: 'hr' }));
    });

    it('should parse *** as horizontal rule', () => {
      const tokens = tokenize('***');
      expect(tokens).toContainEqual(expect.objectContaining({ type: 'hr' }));
    });

    it('should parse ___ as horizontal rule', () => {
      const tokens = tokenize('___');
      expect(tokens).toContainEqual(expect.objectContaining({ type: 'hr' }));
    });

    it('should parse spaced dashes as horizontal rule', () => {
      const tokens = tokenize('- - -');
      expect(tokens).toContainEqual(expect.objectContaining({ type: 'hr' }));
    });
  });

  // =========================================================================
  // Blockquotes
  // =========================================================================
  describe('Blockquotes', () => {
    it('should parse simple blockquotes', () => {
      const tokens = tokenize('> Hello world');
      const bq = tokens.find((t) => t.type === 'blockquote');
      expect(bq).toBeDefined();
      expect(bq?.type).toBe('blockquote');
    });

    it('should handle multi-line blockquotes', () => {
      const tokens = tokenize('> Line 1\n> Line 2');
      const bq = tokens.find((t) => t.type === 'blockquote') as Extract<
        BlockToken,
        { type: 'blockquote' }
      >;
      expect(bq).toBeDefined();
      expect(bq.children.length).toBeGreaterThanOrEqual(1);
    });

    it('should parse GitHub callouts', () => {
      const tokens = tokenize('> [!NOTE]\n> This is a note');
      const callout = tokens.find((t) => t.type === 'callout') as Extract<
        BlockToken,
        { type: 'callout' }
      >;
      expect(callout).toBeDefined();
      expect(callout.kind).toBe('NOTE');
    });

    it('should parse all callout types', () => {
      const types = ['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION'];
      for (const kind of types) {
        const tokens = tokenize(`> [!${kind}]\n> Content`);
        const callout = tokens.find((t) => t.type === 'callout') as Extract<
          BlockToken,
          { type: 'callout' }
        >;
        expect(callout).toBeDefined();
        expect(callout.kind).toBe(kind);
      }
    });
  });

  // =========================================================================
  // Lists
  // =========================================================================
  describe('Lists', () => {
    it('should parse unordered lists with -', () => {
      const tokens = tokenize('- Item 1\n- Item 2\n- Item 3');
      const list = tokens.find((t) => t.type === 'list') as Extract<
        BlockToken,
        { type: 'list' }
      >;
      expect(list).toBeDefined();
      expect(list.ordered).toBe(false);
      expect(list.items).toHaveLength(3);
    });

    it('should parse unordered lists with *', () => {
      const tokens = tokenize('* Item A\n* Item B');
      const list = tokens.find((t) => t.type === 'list') as Extract<
        BlockToken,
        { type: 'list' }
      >;
      expect(list).toBeDefined();
      expect(list.ordered).toBe(false);
      expect(list.items).toHaveLength(2);
    });

    it('should parse ordered lists', () => {
      const tokens = tokenize('1. First\n2. Second\n3. Third');
      const list = tokens.find((t) => t.type === 'list') as Extract<
        BlockToken,
        { type: 'list' }
      >;
      expect(list).toBeDefined();
      expect(list.ordered).toBe(true);
      expect(list.items).toHaveLength(3);
      expect(list.start).toBe(1);
    });

    it('should respect custom starting numbers', () => {
      const tokens = tokenize('5. Fifth\n6. Sixth');
      const list = tokens.find((t) => t.type === 'list') as Extract<
        BlockToken,
        { type: 'list' }
      >;
      expect(list).toBeDefined();
      expect(list.start).toBe(5);
    });

    it('should parse task lists', () => {
      const tokens = tokenize('- [x] Done\n- [ ] Not done');
      const list = tokens.find((t) => t.type === 'list') as Extract<
        BlockToken,
        { type: 'list' }
      >;
      expect(list).toBeDefined();
      expect(list.items[0]?.checked).toBe(true);
      expect(list.items[1]?.checked).toBe(false);
    });
  });

  // =========================================================================
  // Tables
  // =========================================================================
  describe('Tables', () => {
    it('should parse a basic table', () => {
      const md = '| Name | Age |\n| --- | --- |\n| Alice | 30 |\n| Bob | 25 |';
      const tokens = tokenize(md);
      const table = tokens.find((t) => t.type === 'table') as Extract<
        BlockToken,
        { type: 'table' }
      >;
      expect(table).toBeDefined();
      expect(table.headers).toEqual(['Name', 'Age']);
      expect(table.rows).toHaveLength(2);
      expect(table.rows[0]).toEqual(['Alice', '30']);
    });

    it('should parse table alignments', () => {
      const md = '| Left | Center | Right |\n| :--- | :---: | ---: |\n| a | b | c |';
      const tokens = tokenize(md);
      const table = tokens.find((t) => t.type === 'table') as Extract<
        BlockToken,
        { type: 'table' }
      >;
      expect(table.alignments[0]).toEqual({ align: 'left' });
      expect(table.alignments[1]).toEqual({ align: 'center' });
      expect(table.alignments[2]).toEqual({ align: 'right' });
    });
  });

  // =========================================================================
  // Blank Lines
  // =========================================================================
  describe('Blank Lines', () => {
    it('should produce blank tokens for empty lines', () => {
      const tokens = tokenize('\n\n');
      const blanks = tokens.filter((t) => t.type === 'blank');
      expect(blanks.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // Mixed Content
  // =========================================================================
  describe('Mixed Content', () => {
    it('should handle heading followed by paragraph', () => {
      const tokens = tokenize('# Title\n\nSome text here.');
      expect(tokens.some((t) => t.type === 'heading')).toBe(true);
      expect(tokens.some((t) => t.type === 'paragraph')).toBe(true);
    });

    it('should handle CRLF line endings', () => {
      const tokens = tokenize('# Title\r\n\r\nParagraph');
      expect(tokens.some((t) => t.type === 'heading')).toBe(true);
      expect(tokens.some((t) => t.type === 'paragraph')).toBe(true);
    });
  });
});
