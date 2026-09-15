# AGENTS.md

## Project Contract

- Before file-changing work, read `docs/PROJECT.md` and use its authority map to select only the relevant owner.
- Keep accepted experience and public claims separate from implemented behavior. Update the contract and affected owner together when either changes.
- Before changing `.agents/**`, read `.agents/AGENTS.md`. Before changing `docs/**`, read `docs/AGENTS.md`.

## Product and Publication Rules

- Keep Ambient Worlds a dependency-free static visual player. Do not add a build system, hosted account, upload service, or generative-model runtime without explicit direction.
- Preserve the full-screen world, minimal chrome, pause/random/focus controls, reduced-motion handling, and sound-off-until-opt-in behavior.
- Treat `worlds/**/source/` as retained world implementations and their adapters as compatibility boundaries. Do not rewrite large embedded sources for unrelated work.
- Keep Korean and English public copy, canonical URLs, screenshots, structured metadata, security headers, and sitemap/robots/LLM metadata synchronized when a public claim changes.
- Preserve third-party notices and license files with any imported or redistributed asset/source change.

## Validation

- No package or test runner is defined. Start with `git diff --check`, focused path/reference checks, and direct inspection of changed static files.
- Browser or deployment verification is required only when the runtime or published surface changes; documentation-only work does not imply a live-site pass.
