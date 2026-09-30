import { describe, it, expect } from 'vitest';
import { load } from './page.js';

const { normalise, dirOf, baseOf, isArchived, resolveHref, skipPath } = load(
  ['utils', 'paths', 'read'],
  ['normalise', 'dirOf', 'baseOf', 'isArchived', 'resolveHref', 'skipPath']
);

describe('paths', () => {
  it('normalises dot segments and empty segments', () => {
    expect(normalise('docs/./specs//a.md')).toBe('docs/specs/a.md');
    expect(normalise('docs/work/../specs/a.md')).toBe('docs/specs/a.md');
  });

  it('splits a path into its folder and its file name', () => {
    expect(dirOf('docs/specs/a.md')).toBe('docs/specs');
    expect(dirOf('a.md')).toBe('');
    expect(baseOf('docs/specs/a.md')).toBe('a.md');
  });

  it('counts a file as archived by any folder named for an archive, and never by its file name', () => {
    expect(isArchived('archive/docs/notes.md')).toBe(true);
    expect(isArchived('docs/old-archive/notes.md')).toBe(true);
    expect(isArchived('docs/specs/archiving.md')).toBe(false);
  });

  it('skips dot folders, node_modules and __pycache__', () => {
    expect(skipPath('.git/HEAD.md')).toBe(true);
    expect(skipPath('src/node_modules/x/README.md')).toBe(true);
    expect(skipPath('tools/__pycache__/a.md')).toBe(true);
    expect(skipPath('docs/specs/a.md')).toBe(false);
  });
});

describe('resolveHref', () => {
  it('resolves a relative path against the folder of the document that holds it', () => {
    expect(resolveHref('../specs/a.md', 'docs/work')).toBe('docs/specs/a.md');
    expect(resolveHref('a.md', 'docs')).toBe('docs/a.md');
  });

  it('resolves a leading slash from the root of the bundle', () => {
    expect(resolveHref('/docs/specs/a.md', 'deep/folder')).toBe('docs/specs/a.md');
  });

  it('drops an anchor and a query', () => {
    expect(resolveHref('a.md#section-2?x=1', 'docs')).toBe('docs/a.md');
  });

  it('keeps a path with no extension, which names a folder', () => {
    expect(resolveHref('../specs', 'docs/work')).toBe('docs/specs');
  });

  it('refuses a URL, a path with a space and a file that is not markdown', () => {
    expect(resolveHref('https://example.com/a.md', 'docs')).toBeNull();
    expect(resolveHref('mailto:a@b.c', 'docs')).toBeNull();
    expect(resolveHref('two words.md', 'docs')).toBeNull();
    expect(resolveHref('image.png', 'docs')).toBeNull();
    expect(resolveHref('#only-an-anchor', 'docs')).toBeNull();
  });
});
