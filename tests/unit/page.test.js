import { describe, it, expect } from 'vitest';
import { html, sectionNames } from './page.js';

describe('okf-map.html', () => {
  it('holds every section that the unit tests load', () => {
    for (const name of ['utils', 'YAML subset', 'paths', 'palette', 'actors and trust', 'read', 'build', 'body links', 'routing']) {
      expect(sectionNames).toContain(name);
    }
  });

  it('runs from the disk: it loads no script and no style sheet from another file', () => {
    expect(html).not.toMatch(/<script[^>]*\ssrc=/i);
    expect(html).not.toMatch(/<link[^>]*rel="stylesheet"[^>]*href="(?!https:\/\/fonts\.googleapis\.com)/i);
  });

  it('asks the network for the Plex fonts alone, which fall back to system fonts offline', () => {
    const hosts = [...html.matchAll(/(?:src|href)="(https?:\/\/[^/"]+)/g)].map(match => match[1]);
    expect([...new Set(hosts)].sort()).toEqual([
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ]);
  });
});
