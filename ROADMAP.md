# MarkForge Roadmap

This roadmap groups the product into implementation pipelines so the app grows in layers instead of isolated features.

## Phase 1: Editor Core

- Multi-file workspace with tabs and file explorer
- Live Markdown preview with synchronized scrolling
- Autosave, recovery, recent files, and unsaved-change protection
- Keyboard shortcuts for common actions
- Find, replace, and document outline

## Phase 2: Document Splitting and Multi-Edit

- Split one large Markdown file into multiple linked sections
- Define explicit breakpoints or section markers
- Name each section and keep a visible table of sections
- Edit sections independently or in a linked multi-edit mode
- Undo and redo for split, merge, and section renaming operations
- Merge sections back into a single Markdown document
- Preserve relative links and assets during split/merge

## Phase 3: Theme System

- App-level theme presets for the editor UI
- Preview theme tokens that match the selected app theme
- Export themes carried into HTML, PDF, and other downloadable formats
- Per-theme typography, colors, spacing, code block styling, and callout colors
- User-customizable themes with import/export support
- Light, dark, and high-contrast variants

## Phase 4: Export and Publishing

- Export to Markdown, HTML, PDF, DOCX, and EPUB
- Styled exports that preserve the active theme
- Table of contents generation and page layout controls
- Batch export for whole workspaces or split documents
- Optional static-site publishing presets

## Phase 5: Advanced Writing Tools

- Command palette
- Block-level operations and slash commands
- Mermaid, math, tables, admonitions, and code block enhancements
- Version history and compare view
- Link graph, backlinks, and references

## Phase 6: Collaboration and Distribution

- Plugin API and theme marketplace
- Git integration and change tracking
- Auto-update pipeline and signed release artifacts
- Windows and Linux installers with stable/beta channels

## Theme Pipeline Notes

The theme system should be implemented as a shared design-token layer so the same palette and typography drive:

- the app UI
- the live preview renderer
- export templates and print styles

That keeps the exported document visually consistent with what the user sees in the editor.
