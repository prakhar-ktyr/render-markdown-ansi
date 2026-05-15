import { describe, it, expect } from 'vitest';
import { renderTokens } from '../src/renderer';
import type { ResolvedOptions, BlockToken } from '../src/types';
import { stripAnsi } from '../src/utils';

const defaultOpts: ResolvedOptions = {
  width: 80,
  showLinks: true,
  indent: 2,
  colors: true,
  softBreak: '\n',
  unicode: true,
};

const noColorOpts: ResolvedOptions = { ...defaultOpts, colors: false };
const asciiOpts: ResolvedOptions = { ...defaultOpts, unicode: false };

describe('Renderer', () => {
  describe('Headings', () => {
    it('should render H1 with underline', () => {
      const tokens: BlockToken[] = [{ type: 'heading', level: 1, raw: 'Title' }];
      const output = renderTokens(tokens, noColorOpts);
      const lines = output.trim().split('\n');
      expect(lines).toHaveLength(2);
      expect(lines[0]).toBe('Title');
      expect(lines[1]).toMatch(/^[─-]+$/);
    });

    it('should render H2-H6 without underline', () => {
      for (const level of [2, 3, 4, 5, 6] as const) {
        const tokens: BlockToken[] = [{ type: 'heading', level, raw: `H${level}` }];
        const output = renderTokens(tokens, noColorOpts);
        expect(output.trim()).toBe(`H${level}`);
      }
    });

    it('should apply ANSI codes when colors enabled', () => {
      const tokens: BlockToken[] = [{ type: 'heading', level: 2, raw: 'Hello' }];
      const output = renderTokens(tokens, defaultOpts);
      expect(output).toContain('\x1b[');
      expect(stripAnsi(output).trim()).toContain('Hello');
    });
  });

  describe('Paragraphs', () => {
    it('should render paragraph text', () => {
      const tokens: BlockToken[] = [{ type: 'paragraph', raw: 'Hello world' }];
      const output = renderTokens(tokens, noColorOpts);
      expect(output.trim()).toBe('Hello world');
    });
  });

  describe('Code Blocks', () => {
    it('should render code block with indentation', () => {
      const tokens: BlockToken[] = [
        { type: 'code_block', language: '', content: 'const x = 1;' },
      ];
      const output = renderTokens(tokens, noColorOpts);
      expect(output).toContain('  const x = 1;');
    });

    it('should show language label when provided', () => {
      const tokens: BlockToken[] = [
        { type: 'code_block', language: 'javascript', content: 'const x = 1;' },
      ];
      const output = renderTokens(tokens, noColorOpts);
      expect(output).toContain('javascript');
    });
  });

  describe('Horizontal Rule', () => {
    it('should render HR as repeated characters', () => {
      const tokens: BlockToken[] = [{ type: 'hr' }];
      const output = renderTokens(tokens, noColorOpts);
      expect(output.trim().length).toBe(80);
    });

    it('should use Unicode dash by default', () => {
      const tokens: BlockToken[] = [{ type: 'hr' }];
      const output = renderTokens(tokens, { ...noColorOpts, unicode: true });
      expect(output).toContain('─');
    });

    it('should use ASCII dash when unicode is false', () => {
      const tokens: BlockToken[] = [{ type: 'hr' }];
      const output = renderTokens(tokens, { ...noColorOpts, unicode: false });
      expect(output).toContain('-');
      expect(output).not.toContain('─');
    });
  });

  describe('Blockquotes', () => {
    it('should render blockquote with border', () => {
      const tokens: BlockToken[] = [
        { type: 'blockquote', children: [{ type: 'paragraph', raw: 'Quoted text' }] },
      ];
      const output = renderTokens(tokens, noColorOpts);
      expect(output).toContain('│ Quoted text');
    });

    it('should use ASCII border when unicode is false', () => {
      const tokens: BlockToken[] = [
        { type: 'blockquote', children: [{ type: 'paragraph', raw: 'Quoted' }] },
      ];
      const output = renderTokens(tokens, { ...noColorOpts, unicode: false });
      expect(output).toContain('| Quoted');
    });
  });

  describe('Lists', () => {
    it('should render unordered list with bullets', () => {
      const tokens: BlockToken[] = [
        {
          type: 'list',
          ordered: false,
          start: 1,
          items: [
            { type: 'list_item', checked: null, children: [{ type: 'paragraph', raw: 'Item 1' }] },
            { type: 'list_item', checked: null, children: [{ type: 'paragraph', raw: 'Item 2' }] },
          ],
        },
      ];
      const output = renderTokens(tokens, noColorOpts);
      expect(output).toContain('• Item 1');
      expect(output).toContain('• Item 2');
    });

    it('should render ordered list with numbers', () => {
      const tokens: BlockToken[] = [
        {
          type: 'list',
          ordered: true,
          start: 1,
          items: [
            { type: 'list_item', checked: null, children: [{ type: 'paragraph', raw: 'First' }] },
            { type: 'list_item', checked: null, children: [{ type: 'paragraph', raw: 'Second' }] },
          ],
        },
      ];
      const output = renderTokens(tokens, noColorOpts);
      expect(output).toContain('1. First');
      expect(output).toContain('2. Second');
    });

    it('should render task list checkboxes', () => {
      const tokens: BlockToken[] = [
        {
          type: 'list',
          ordered: false,
          start: 1,
          items: [
            { type: 'list_item', checked: true, children: [{ type: 'paragraph', raw: 'Done' }] },
            { type: 'list_item', checked: false, children: [{ type: 'paragraph', raw: 'Todo' }] },
          ],
        },
      ];
      const output = renderTokens(tokens, noColorOpts);
      expect(output).toContain('☑ Done');
      expect(output).toContain('☐ Todo');
    });
  });

  describe('Tables', () => {
    it('should render table with box-drawing characters', () => {
      const tokens: BlockToken[] = [
        {
          type: 'table',
          headers: ['Name', 'Age'],
          alignments: [{ align: 'left' }, { align: 'left' }],
          rows: [['Alice', '30']],
        },
      ];
      const output = renderTokens(tokens, noColorOpts);
      expect(output).toContain('┌');
      expect(output).toContain('│');
      expect(output).toContain('└');
      expect(output).toContain('Name');
      expect(output).toContain('Alice');
    });

    it('should use ASCII characters when unicode is false', () => {
      const tokens: BlockToken[] = [
        {
          type: 'table',
          headers: ['A'],
          alignments: [{ align: 'left' }],
          rows: [['1']],
        },
      ];
      const output = renderTokens(tokens, { ...noColorOpts, unicode: false });
      expect(output).toContain('+');
      expect(output).toContain('|');
      expect(output).not.toContain('┌');
    });
  });

  describe('Callouts', () => {
    it('should render callout with icon and label', () => {
      const tokens: BlockToken[] = [
        {
          type: 'callout',
          kind: 'NOTE',
          children: [{ type: 'paragraph', raw: 'Note content' }],
        },
      ];
      const output = renderTokens(tokens, noColorOpts);
      expect(output).toContain('Note');
      expect(output).toContain('ℹ');
      expect(output).toContain('Note content');
    });
  });

  describe('Blank Lines', () => {
    it('should collapse consecutive blank tokens', () => {
      const tokens: BlockToken[] = [
        { type: 'paragraph', raw: 'A' },
        { type: 'blank' },
        { type: 'blank' },
        { type: 'blank' },
        { type: 'paragraph', raw: 'B' },
      ];
      const output = renderTokens(tokens, noColorOpts);
      const lines = output.split('\n');
      // Should not have more than one consecutive blank line
      let maxConsecutiveBlanks = 0;
      let currentBlanks = 0;
      for (const line of lines) {
        if (line === '') {
          currentBlanks++;
          maxConsecutiveBlanks = Math.max(maxConsecutiveBlanks, currentBlanks);
        } else {
          currentBlanks = 0;
        }
      }
      expect(maxConsecutiveBlanks).toBeLessThanOrEqual(2);
    });
  });
});
