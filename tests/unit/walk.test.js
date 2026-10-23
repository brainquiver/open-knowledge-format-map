import { describe, it, expect } from 'vitest';
import { load } from './page.js';

const { walkFolder, cacheDirs, underCache, fileOf } = load(
  ['utils', 'paths', 'read', 'walk'],
  ['walkFolder', 'cacheDirs', 'underCache', 'fileOf']
);

// A tree of fake folders, as the File System Access API gives one. A key that ends in a slash is a
// folder, and any other key is a file. Each folder counts how often it was listed.
function handles(name, tree, listed) {
  return {
    kind: 'directory',
    name,
    values() {
      listed[name] = (listed[name] || 0) + 1;
      const kids = Object.entries(tree).map(([key, value]) =>
        key.endsWith('/')
          ? handles(key.slice(0, -1), value, listed)
          : { kind: 'file', name: key, getFile: async () => ({ text: async () => value }) }
      );
      const it = kids[Symbol.iterator]();
      return { next: async () => it.next() };
    },
  };
}

// The same tree as the older entries API gives it, in batches of two.
function entries(name, tree, listed) {
  return {
    isDirectory: true,
    name,
    createReader() {
      listed[name] = (listed[name] || 0) + 1;
      const kids = Object.entries(tree).map(([key, value]) =>
        key.endsWith('/')
          ? entries(key.slice(0, -1), value, listed)
          : { isDirectory: false, name: key, file: ok => ok({ text: async () => value }) }
      );
      return { readEntries: ok => setTimeout(() => ok(kids.splice(0, 2)), 0) };
    },
  };
}

const tree = {
  'README.md': 'root',
  'okf-map.json': '{}',
  'notes.txt': '',
  'docs/': { 'a.md': 'a', 'b.MD': 'b', '.hidden.md': 'x', 'deep/': { 'c.md': 'c' } },
  '.git/': { 'HEAD.md': 'x' },
  'node_modules/': { 'pkg/': { 'README.md': 'x' } },
  'crate/': { 'src/': { 'lib.md': 'kept' }, 'target/': { 'CACHEDIR.TAG': '', 'doc/': { 'x.md': 'x' } } },
  '.venv/': { 'pyvenv.cfg': '' },
  'venv/': { 'pyvenv.cfg': '', 'lib/': { 'x.md': 'x' } },
};

const want = name => /\.md$/i.test(name) || name === 'okf-map.json';
const walk = root => walkFolder(root, want, () => {}, () => true);
const paths = result => result.found.map(f => f.path).sort();

describe('walkFolder', () => {
  const expected = [
    'README.md',
    'crate/src/lib.md',
    'docs/a.md',
    'docs/b.MD',
    'docs/deep/c.md',
    'okf-map.json',
  ];

  it('finds each markdown file and each config below a handle', async () => {
    const listed = {};
    expect(paths(await walk(handles('root', tree, listed)))).toEqual(expected);
  });

  it('finds the same files below an entry', async () => {
    expect(paths(await walk(entries('root', tree, {})))).toEqual(expected);
  });

  it('never opens a dot folder, node_modules or the folders under a cache mark', async () => {
    const listed = {};
    const result = await walk(handles('root', tree, listed));
    expect(listed['.git']).toBeUndefined();
    expect(listed['.venv']).toBeUndefined();
    expect(listed.node_modules).toBeUndefined();
    expect(listed.doc).toBeUndefined();
    expect(listed.lib).toBeUndefined();
    expect(listed.target).toBe(1);
    expect(result.seen.cached).toBe(2);
  });

  it('counts the whole tree as listed when it ends, and never less as it goes', async () => {
    const shares = [];
    const tick = seen => shares.push(seen.share);
    const result = await walkFolder(handles('root', tree, {}), want, tick, () => true);
    expect(result.seen.share).toBeCloseTo(1, 10);
    expect(shares).toEqual([...shares].sort((a, b) => a - b));
  });

  it('counts a folder that cannot be listed, and goes on with the rest', async () => {
    const root = handles('root', { 'a.md': 'a', 'bad/': {} }, {});
    const values = root.values;
    root.values = () => {
      const it = values();
      return {
        next: async () => {
          const r = await it.next();
          if (r.value && r.value.name === 'bad') {
            r.value.values = () => ({ next: () => Promise.reject(new Error('denied')) });
          }
          return r;
        },
      };
    };
    const result = await walk(root);
    expect(paths(result)).toEqual(['a.md']);
    expect(result.seen.failed).toBe(1);
  });

  it('gives null when a newer folder takes its place', async () => {
    expect(await walkFolder(handles('root', tree, {}), want, () => {}, () => false)).toBeNull();
  });

  it('opens a file from a handle and from an entry alike', async () => {
    const [h] = (await walk(handles('root', { 'a.md': 'from a handle' }, {}))).found;
    const [e] = (await walk(entries('root', { 'a.md': 'from an entry' }, {}))).found;
    expect(await (await fileOf(h.entry)).text()).toBe('from a handle');
    expect(await (await fileOf(e.entry)).text()).toBe('from an entry');
  });
});

describe('cache marks in a flat list', () => {
  it('skips every path below a folder that holds a cache mark', () => {
    const dirs = cacheDirs(['crate/target/CACHEDIR.TAG', 'venv/pyvenv.cfg', 'docs/a.md']);
    expect(underCache('crate/target/doc/x.md', dirs)).toBe(true);
    expect(underCache('venv/lib/x.md', dirs)).toBe(true);
    expect(underCache('crate/src/lib.md', dirs)).toBe(false);
    expect(underCache('docs/a.md', dirs)).toBe(false);
  });

  it('skips everything when the chosen folder itself holds one', () => {
    expect(underCache('a.md', cacheDirs(['CACHEDIR.TAG']))).toBe(true);
  });
});
