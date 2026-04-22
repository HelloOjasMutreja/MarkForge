# MarkForge

MarkForge is an open-source desktop Markdown editor for Windows and Linux with live preview and multi-format export.

## Current MVP Features

- Desktop app shell with Electron
- Markdown editing and live preview
- Open and save local Markdown files
- Recent files list with quick reopen
- Draft autosave and unsaved-change protection
- Keyboard save shortcut (`Ctrl+S` / `Cmd+S`)
- Split large Markdown files into named sections (H1/H2/H3 or marker breakpoints)
- Edit all split sections together or focus a single section
- Section breakpoint insertion/removal with split-step undo/redo
- Reopen files with split-session state restored automatically
- Shared theme selector for UI, preview, and exports
- Export to Markdown, HTML, TXT, and PDF
- Cross-platform packaging scripts for Windows and Linux

## Tech Stack

- React + TypeScript + Vite (renderer)
- Electron (desktop runtime)
- markdown-it + DOMPurify (rendering and sanitization)
- electron-builder (distribution packaging)

## Prerequisites

- Node.js 22+
- npm 11+

## Local Development

Install dependencies:

```bash
npm install
```

Run desktop mode (Vite + Electron):

```bash
npm run dev
```

Run web-only mode:

```bash
npm run dev:web
```

## Build and Package

Build web renderer only:

```bash
npm run build:web
```

Create installers/packages for the current platform:

```bash
npm run build
```

Windows packages:

```bash
npm run dist:win
```

Linux packages:

```bash
npm run dist:linux
```

Artifacts are emitted under `release/`.

Published Windows and Linux installers will be attached to GitHub Releases for tagged versions.

## Windows Packaging Note

If local Windows packaging fails with a symbolic link privilege error from `electron-builder`, enable Windows Developer Mode (or run the terminal as Administrator) and retry.

## Versioning and Releases

This project follows Semantic Versioning.

1. Update `package.json` version.
2. Commit and tag a release in the format `vX.Y.Z`.
3. Push the tag to trigger GitHub Actions packaging workflow.

## Open Source Standards

- License: MIT
- Contributor guide: CONTRIBUTING.md
- Conduct: CODE_OF_CONDUCT.md
- Security policy: SECURITY.md

## Planned Milestones

1. Editor core expansion: tabs, outline, search, and command palette
2. Split-document workflow: breakpoints, section naming, merge/unmerge, undo/redo
3. Theme pipeline: shared app, preview, and export themes
4. Advanced Markdown support: Mermaid, math, tables UX, callouts
5. Publish integrations, plugin API, and release automation

See [ROADMAP.md](ROADMAP.md) for the full implementation pipeline.

