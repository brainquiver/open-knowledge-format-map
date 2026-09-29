---
type: Repository Guide
title: OKF Map
description: An offline map of the Open Knowledge Format frontmatter and relations in a folder of markdown documents.
status: stable
tags: [docs, okf, browser]
generated:
  by: claude-code/opus-5.5
  at: 2026-09-29T16:55:00Z
supervised:
  by: human:ciprian-florin_ifrim
  at: 2026-09-29T16:55:00Z
---

# OKF Map

OKF Map is one HTML page that draws a folder of markdown documents as a map of their Open Knowledge Format (OKF) frontmatter. Each document is a tile, and each relation key is a line. The page runs from the disk with the Carbon Design System inside it, and every file stays in the browser.

By default the page reads the frontmatter alone. The Body links switch reads each file in full, and it draws each markdown link in the prose as a dashed line. The map covers the chosen folder, so a path outside it shows as a missing target. The export control saves the map as a PNG image.

| File | Description |
| --- | --- |
| `okf-map.html` | the map, with the Carbon Design System inside it |
| `icons/` | the favicon and the vector marks |

**The frontmatter carries the map, and the body links are a second layer that a reader can add.**

## 1. Build and Run

    open okf-map.html                                # or open the file in any browser

### 1.1 Specification Buttons

`okf-map.json`, at the root of the chosen folder, names the documents that the OKF and PROFILE buttons open:

    {
      "okf-google-spec": "docs/specs/open-knowledge-format.md",
      "okf-house-profile": "docs/specs/open-knowledge-format-profile.md"
    }

| Key | Button | Document |
| --- | --- | --- |
| `okf-google-spec` | OKF | the OKF specification that Google publishes |
| `okf-house-profile` | PROFILE | the house profile, which extends that specification for one organisation |

Each path is relative to the folder that holds `okf-map.json`.

| Event | Result |
| --- | --- |
| left click | the document opens, or a file picker opens when the button is grey |
| right click | the file picker opens, so a different document can be chosen |
| grey button | the document is absent, and the tooltip gives the reason |
| reload | each chosen file clears, and `okf-map.json` applies again |

## 2. Directory Tree

    icons/     the favicon and the vector marks

## 3. Rules

**Keep `okf-map.json` at the root of the bundle.** The page reads only the chosen folder, and the copy nearest the root applies when the folder holds more than one.

**Keep the page one file.** A page that the browser opens from the disk cannot fetch a library when it runs.
