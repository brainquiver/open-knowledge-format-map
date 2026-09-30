import { describe, it, expect, vi, afterEach } from 'vitest';
import { load } from './page.js';

const { actorKind, generatedBy, verifiedList, trustTier, verifiedAt, staleness, hashPick } = load(
  ['utils', 'palette', 'actors and trust'],
  ['actorKind', 'generatedBy', 'verifiedList', 'trustTier', 'verifiedAt', 'staleness', 'hashPick']
);

describe('actors', () => {
  it('tells the four actor forms apart', () => {
    expect(actorKind('human:ciprian-florin_ifrim')).toBe('human');
    expect(actorKind('process:ci')).toBe('process');
    expect(actorKind('company:brand')).toBe('company');
    expect(actorKind('claude-code/opus-5.5')).toBe('agent');
  });

  it('reads a bare name, an empty value and a non-string as no actor', () => {
    expect(actorKind('someone')).toBe('none');
    expect(actorKind('')).toBe('none');
    expect(actorKind(undefined)).toBe('none');
  });

  it('reads generated as a string or as a mapping', () => {
    expect(generatedBy({ generated: 'human:ada' })).toBe('human:ada');
    expect(generatedBy({ generated: { by: 'claude-code/opus-5.5', at: 'x' } })).toBe(
      'claude-code/opus-5.5'
    );
    expect(generatedBy({})).toBe('');
  });
});

describe('trust', () => {
  it('reads a bare verified mapping as a list of one', () => {
    expect(verifiedList({ verified: { by: 'human:ada', at: '2026-01-01' } })).toEqual([
      { by: 'human:ada', at: '2026-01-01' },
    ]);
    expect(verifiedList({ verified: 'yes' })).toEqual([]);
  });

  it('derives the tier from who verified the document', () => {
    expect(trustTier({})).toBe('unverified');
    expect(trustTier({ verified: [{ by: 'process:ci' }] })).toBe('machine-confirmed');
    expect(trustTier({ verified: [{ by: 'process:ci' }, { by: 'human:ada' }] })).toBe(
      'human-reviewed'
    );
  });

  it('gives the latest verification date', () => {
    expect(
      verifiedAt({ verified: [{ at: '2026-03-01T00:00:00Z' }, { at: '2026-09-01T00:00:00Z' }] })
    ).toBe('2026-09-01T00:00:00Z');
  });

  it('gives the same colour to the same name on every run', () => {
    const list = ['red', 'green', 'blue'];
    expect(hashPick('docs/specs', list)).toBe(hashPick('docs/specs', list));
    expect(list).toContain(hashPick('docs/specs', list));
  });
});

describe('staleness', () => {
  afterEach(() => vi.useRealTimers());

  it('compares stale_after with the date of today, on the date alone', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 30, 12, 0, 0));
    expect(staleness({ stale_after: '2026-09-30' })).toEqual({ on: '2026-09-30', stale: true });
    expect(staleness({ stale_after: '2026-10-01T00:00:00Z' })).toEqual({
      on: '2026-10-01',
      stale: false,
    });
  });

  it('ignores a missing or malformed date', () => {
    expect(staleness({})).toBeNull();
    expect(staleness({ stale_after: 'next year' })).toBeNull();
  });
});
