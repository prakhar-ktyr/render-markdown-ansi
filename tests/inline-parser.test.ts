import { describe, it, expect } from 'vitest';
import { parseInline } from '../src/inline-parser';
import type { InlineNode } from '../src/types';

describe('Inline Parser', () => {
  describe('Bold', () => {
    it('should parse **bold** text', () => {
      const nodes = parseInline('Hello **world**');
      expect(nodes).toContainEqual(expect.objectContaining({ type: 'bold' }));
    });

    it('should parse __bold__ text', () => {
      const nodes = parseInline('Hello __world__');
      expect(nodes).toContainEqual(expect.objectContaining({ type: 'bold' }));
    });

    it('should preserve text around bold', () => {
      const nodes = parseInline('before **bold** after');
      expect(nodes[0]).toMatchObject({ type: 'text', content: 'before ' });
      expect(nodes[1]).toMatchObject({ type: 'bold' });
      expect(nodes[2]).toMatchObject({ type: 'text', content: ' after' });
    });
  });

  describe('Italic', () => {
    it('should parse *italic* text', () => {
      const nodes = parseInline('Hello *world*');
      expect(nodes).toContainEqual(expect.objectContaining({ type: 'italic' }));
    });

    it('should parse _italic_ text', () => {
      const nodes = parseInline('Hello _world_');
      expect(nodes).toContainEqual(expect.objectContaining({ type: 'italic' }));
    });
  });

  describe('Bold + Italic', () => {
    it('should parse ***bold italic***', () => {
      const nodes = parseInline('***bold italic***');
      expect(nodes).toContainEqual(expect.objectContaining({ type: 'bold_italic' }));
    });
  });

  describe('Strikethrough', () => {
    it('should parse ~~strikethrough~~', () => {
      const nodes = parseInline('Hello ~~world~~');
      expect(nodes).toContainEqual(expect.objectContaining({ type: 'strikethrough' }));
    });
  });

  describe('Code Span', () => {
    it('should parse `code` spans', () => {
      const nodes = parseInline('Use `console.log()` here');
      const cs = nodes.find((n) => n.type === 'code_span') as Extract<InlineNode, { type: 'code_span' }>;
      expect(cs).toBeDefined();
      expect(cs.content).toBe('console.log()');
    });

    it('should strip leading/trailing spaces', () => {
      const nodes = parseInline('` hello `');
      const cs = nodes.find((n) => n.type === 'code_span') as Extract<InlineNode, { type: 'code_span' }>;
      expect(cs).toBeDefined();
      expect(cs.content).toBe('hello');
    });
  });

  describe('Links', () => {
    it('should parse [text](url)', () => {
      const nodes = parseInline('[Google](https://google.com)');
      const link = nodes.find((n) => n.type === 'link') as Extract<InlineNode, { type: 'link' }>;
      expect(link).toBeDefined();
      expect(link.url).toBe('https://google.com');
    });

    it('should parse links with titles', () => {
      const nodes = parseInline('[text](url "My Title")');
      const link = nodes.find((n) => n.type === 'link') as Extract<InlineNode, { type: 'link' }>;
      expect(link).toBeDefined();
      expect(link.title).toBe('My Title');
    });
  });

  describe('Images', () => {
    it('should parse ![alt](url)', () => {
      const nodes = parseInline('![My Image](image.png)');
      const img = nodes.find((n) => n.type === 'image') as Extract<InlineNode, { type: 'image' }>;
      expect(img).toBeDefined();
      expect(img.alt).toBe('My Image');
      expect(img.url).toBe('image.png');
    });
  });

  describe('Autolinks', () => {
    it('should parse <url> autolinks', () => {
      const nodes = parseInline('Visit <https://example.com>');
      const link = nodes.find((n) => n.type === 'link') as Extract<InlineNode, { type: 'link' }>;
      expect(link).toBeDefined();
      expect(link.url).toBe('https://example.com');
    });

    it('should parse <email> autolinks', () => {
      const nodes = parseInline('Email <user@example.com>');
      const link = nodes.find((n) => n.type === 'link') as Extract<InlineNode, { type: 'link' }>;
      expect(link).toBeDefined();
      expect(link.url).toBe('mailto:user@example.com');
    });
  });

  describe('Escapes', () => {
    it('should handle backslash escapes', () => {
      const nodes = parseInline('\\*not italic\\*');
      expect(nodes.filter((n) => n.type === 'italic')).toHaveLength(0);
    });
  });

  describe('Line Breaks', () => {
    it('should parse hard line breaks (backslash)', () => {
      const nodes = parseInline('line 1\\\nline 2');
      expect(nodes).toContainEqual(expect.objectContaining({ type: 'line_break' }));
    });

    it('should parse hard line breaks (trailing spaces)', () => {
      const nodes = parseInline('line 1  \nline 2');
      expect(nodes).toContainEqual(expect.objectContaining({ type: 'line_break' }));
    });
  });

  describe('Plain Text', () => {
    it('should return plain text as text node', () => {
      const nodes = parseInline('Hello world');
      expect(nodes).toHaveLength(1);
      expect(nodes[0]).toMatchObject({ type: 'text', content: 'Hello world' });
    });

    it('should handle empty input', () => {
      expect(parseInline('')).toHaveLength(0);
    });
  });
});
