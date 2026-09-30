import { describe, it, expect } from 'vitest';
import { load } from './page.js';

const { parseFrontmatter, frontmatterOnly } = load(
  ['utils', 'YAML subset'],
  ['parseFrontmatter', 'frontmatterOnly']
);

const doc = lines => `---\n${lines.join('\n')}\n---\nThe body.\n`;

describe('parseFrontmatter', () => {
  it('returns null for a file with no frontmatter block', () => {
    expect(parseFrontmatter('# A heading\n')).toBeNull();
    expect(parseFrontmatter('---\ntype: Note\n')).toBeNull();
  });

  it('returns an empty mapping for an empty block', () => {
    expect(parseFrontmatter('---\n---\n')).toEqual({});
  });

  it('reads plain, quoted, boolean, null and number scalars', () => {
    expect(
      parseFrontmatter(
        doc([
          'type: Specification',
          'title: "Colon: inside quotes"',
          "single: 'one'",
          'yes: true',
          'no: false',
          'none: null',
          'tilde: ~',
          'count: 42',
          'ratio: 0.5',
        ])
      )
    ).toEqual({
      type: 'Specification',
      title: 'Colon: inside quotes',
      single: 'one',
      yes: true,
      no: false,
      none: null,
      tilde: null,
      count: 42,
      ratio: 0.5,
    });
  });

  it('reads flow sequences and flow mappings, nested ones included', () => {
    expect(parseFrontmatter(doc(['tags: [a, "b, c", d]', 'map: { k: v, list: [1, 2] }']))).toEqual({
      tags: ['a', 'b, c', 'd'],
      map: { k: 'v', list: [1, 2] },
    });
  });

  it('reads a nested mapping and a sequence of mappings', () => {
    expect(
      parseFrontmatter(
        doc([
          'generated:',
          '  by: claude-code/opus-5.5',
          '  at: 2026-09-30T13:06:57Z',
          'verified:',
          '  - by: human:ada',
          '    at: 2026-09-01T00:00:00Z',
          '  - by: process:ci',
          '    at: 2026-09-02T00:00:00Z',
        ])
      )
    ).toEqual({
      generated: { by: 'claude-code/opus-5.5', at: '2026-09-30T13:06:57Z' },
      verified: [
        { by: 'human:ada', at: '2026-09-01T00:00:00Z' },
        { by: 'process:ci', at: '2026-09-02T00:00:00Z' },
      ],
    });
  });

  it('keeps the lines of a literal block and folds the lines of a folded block', () => {
    expect(
      parseFrontmatter(doc(['literal: |', '  one', '  two', 'folded: >', '  one', '  two']))
    ).toEqual({ literal: 'one\ntwo', folded: 'one two' });
  });

  it('drops a comment, and keeps a hash inside quotes', () => {
    expect(parseFrontmatter(doc(['# a comment', 'title: "#1 rule" # trailing', 'tag: a#b']))).toEqual(
      { title: '#1 rule', tag: 'a#b' }
    );
  });

  it('reads a file with Windows line endings', () => {
    expect(parseFrontmatter('---\r\ntype: Note\r\nstatus: draft\r\n---\r\nBody')).toEqual({
      type: 'Note',
      status: 'draft',
    });
  });
});

describe('frontmatterOnly', () => {
  it('cuts the head at the line that closes the frontmatter', () => {
    expect(frontmatterOnly('---\ntype: Note\n---\nThe body is never kept.\n')).toBe(
      '---\ntype: Note\n---'
    );
  });

  it('returns null when the block never closes, or never opens', () => {
    expect(frontmatterOnly('---\ntype: Note\n')).toBeNull();
    expect(frontmatterOnly('type: Note\n')).toBeNull();
  });
});
