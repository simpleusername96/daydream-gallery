---
type: spec
status: active
canonical_for: compact agent-facing project contract and authority map
---

# Ambient Worlds Site

## Purpose

Ambient Worlds is the reviewed public static site for watching peaceful, endlessly changing procedural landscapes for meditation, focus, rest, or a quiet background.

## Scope and Non-Goals

- Scope: a full-screen browser player, world switching, scene variation, pause/play, optional procedural audio, focus mode, bilingual project information, public metadata, and two retained worlds: Journey and Stillwater.
- Non-goals: accounts, uploads, remote generation, AI inference at runtime, editable world authoring, or a general application platform.
- The site is a publication of deterministic browser code created with human art direction and AI coding assistance; it is not an AI generation service.

## Accepted Direction

- The world remains visually primary and controls remain minimal, accessible, and easy to hide.
- Audio starts muted and requires explicit opt-in. Hidden, paused, or loading intervals do not consume scene playback time.
- Journey and Stillwater keep their own retained source while conforming to the shared adapter and control contract.
- Public Korean and English descriptions remain aligned in meaning. Source, screenshots, structured metadata, indexing files, and license notices remain truthful.
- Normal use and deployment require no package installation or build step.

## Implemented Baseline

- `index.html` owns the public shell, controls, bilingual information panel, SEO/social metadata, and module entry points.
- `app/main.js` owns world selection, frame lifecycle, shared controls, transitions, reduced-motion integration, and the public `ambientPlayer` snapshot.
- `app/worlds.js` owns the published world registry and adapter/capability metadata.
- `app/adapter.js` owns same-origin integration with retained world implementations and the parent control protocol.
- `app/playback.js` owns active viewing-time accounting; `app/music.js` owns optional shared procedural audio; `app/about.js` owns the bilingual information panel.
- `worlds/journey/` and `worlds/stillwater/` contain each world's adapter and retained source implementation.
- The reviewed site is published at `https://ambient-worlds.pages.dev/` from this repository's static root.

## Responsibility Boundaries

- `README.md`: bilingual requesting-user and source entry point.
- `llms.txt`: concise machine-readable public description and source links.
- `index.html`, `app/`, `worlds/`: executable site and world integration.
- `screenshots/`: public preview images referenced by README and metadata.
- `_headers`: static-host security/cache policy; `robots.txt` and `sitemap.xml`: indexing owners.
- `THIRD_PARTY_NOTICES.md` and `LICENSES/`: redistribution credits and license texts.
- `404.html` and `favicon.svg`: published fallback and identity assets.
- `.agents/**`: non-product work state and history; `docs/**`: agent-facing maintained project knowledge.

## Requirements and Constraints

- Keep the site dependency-free and same-origin. Do not introduce remote executable content or a runtime generation API.
- Preserve sound opt-in, play/pause state, loading/error recovery, and `prefers-reduced-motion` behavior.
- World adapters must reject unrelated window messages and retain the shared `ambient-worlds` control protocol.
- Changes to redistributed source, images, or audio must keep notices and licenses accurate.
- Changes to the public URL, available worlds, description, or screenshots must update every public metadata owner in the same task.

## Validation Routes

- Documentation/governance: `git diff --check`, required-path checks, focused stale-reference searches, and changed-scope inspection.
- Static runtime changes: inspect module syntax and serve the repository root over HTTP before browser checks; direct `file://` behavior is not a deployment guarantee.
- Published-surface changes: verify the affected desktop/mobile interaction and the corresponding canonical/SEO/indexing metadata after deployment.

## Acceptance Criteria

A new session can identify the public experience, runtime owners, world boundaries, publication metadata, licensing obligations, and proportionate validation path from this file.
