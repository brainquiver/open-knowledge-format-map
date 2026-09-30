import { describe, it, expect } from 'vitest';
import { load } from './page.js';

const { collectRefs, bodyLinks, bodyOf } = load(
  ['utils', 'build', 'body links'],
  ['collectRefs', 'bodyLinks', 'bodyOf']
);

describe('collectRefs', () => {
  it('takes a path from each relation key, and marks the keys whose arrow runs backwards', () => {
    expect(collectRefs({ part_of: '../record.md', superseded_by: 'new.md', see_also: './x.md' })).toEqual([
      { key: 'part_of', href: '../record.md', flip: true },
      { key: 'superseded_by', href: 'new.md', flip: false },
      { key: 'see_also', href: './x.md', flip: false },
    ]);
  });

  it('reaches a path below a relation key, and reports it under that key', () => {
    expect(
      collectRefs({ sources: [{ id: 'spec.md', title: 'x.md', resource: '/docs/specs/a.md' }] })
    ).toEqual([{ key: 'sources', href: '/docs/specs/a.md', flip: true }]);
  });

  it('never reads a path from a key outside the relation keys, as resource or description', () => {
    expect(collectRefs({ resource: '/data/set.md', description: 'see a.md', title: 'b.md' })).toEqual(
      []
    );
  });

  it('leaves a value that reads as prose', () => {
    expect(collectRefs({ related: 'the other document' })).toEqual([]);
  });
});

describe('body links', () => {
  const text = [
    '---',
    'part_of: ../x.md',
    '---',
    'See [the spec](specs/a.md) and [the other](b.md "Title").',
    'Code `[not a link](c.md)` stays out.',
    '```',
    '[an example](d.md)',
    '```',
    '~~~',
    '[another example](e.md)',
    '~~~',
    '[after the fence](f.md)',
  ].join('\n');

  it('takes each markdown link in the prose, outside code', () => {
    expect(bodyLinks(text).map(link => link.href)).toEqual(['specs/a.md', 'b.md', 'f.md']);
    expect(bodyLinks(text)[0]).toEqual({ href: 'specs/a.md', key: 'body', body: true });
  });

  it('gives the text after the frontmatter, or the whole text when there is none', () => {
    expect(bodyOf('---\na: 1\n---\nBody\n')).toBe('Body\n');
    expect(bodyOf('Only a body')).toBe('Only a body');
  });
});
