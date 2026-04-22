import type { CSSProperties } from 'react'

export type ThemeId = 'aurora' | 'midnight' | 'paper'

export interface ThemeDefinition {
  id: ThemeId
  label: string
  description: string
  variables: Record<string, string>
}

export const themes: ThemeDefinition[] = [
  {
    id: 'aurora',
    label: 'Aurora',
    description: 'Warm editorial surfaces with a vivid blue accent.',
    variables: {
      '--mf-ui-font': "'Segoe UI', 'Aptos', Tahoma, sans-serif",
      '--mf-mono-font': "'Consolas', 'Cascadia Code', monospace",
      '--mf-bg': '#f7f6f1',
      '--mf-bg-accent-1': 'rgb(244 126 62 / 20%)',
      '--mf-bg-accent-2': 'rgb(43 149 255 / 18%)',
      '--mf-surface': '#ffffffde',
      '--mf-surface-strong': '#ffffff',
      '--mf-surface-muted': '#f7f8fd',
      '--mf-border': '#d4d7e2',
      '--mf-border-soft': '#e6e9f2',
      '--mf-text': '#1a2035',
      '--mf-text-soft': '#3f4761',
      '--mf-heading': '#1c2236',
      '--mf-accent': '#2773ff',
      '--mf-accent-contrast': '#ffffff',
      '--mf-button-bg': '#ffffff',
      '--mf-button-border': '#b4bac8',
      '--mf-button-hover-bg': '#1f3766',
      '--mf-button-hover-text': '#ffffff',
      '--mf-code-bg': '#ecedf6',
      '--mf-code-text': '#1e2640',
      '--mf-pre-bg': '#111827',
      '--mf-pre-text': '#f9fafb',
      '--mf-quote-border': '#2773ff',
      '--mf-link': '#184fd3',
      '--mf-link-hover': '#123a9c',
      '--mf-shadow': '0 18px 45px rgba(17, 24, 39, 0.08)',
      '--mf-preview-bg': '#ffffffc7',
    },
  },
  {
    id: 'midnight',
    label: 'Midnight',
    description: 'Low-light studio palette for long writing sessions.',
    variables: {
      '--mf-ui-font': "'Segoe UI', 'Aptos', Tahoma, sans-serif",
      '--mf-mono-font': "'Consolas', 'Cascadia Code', monospace",
      '--mf-bg': '#11131a',
      '--mf-bg-accent-1': 'rgb(95 131 255 / 18%)',
      '--mf-bg-accent-2': 'rgb(73 208 171 / 14%)',
      '--mf-surface': '#171a23de',
      '--mf-surface-strong': '#1c2030',
      '--mf-surface-muted': '#181b26',
      '--mf-border': '#2b3141',
      '--mf-border-soft': '#222838',
      '--mf-text': '#e7e9ef',
      '--mf-text-soft': '#abb3c7',
      '--mf-heading': '#f7f8fc',
      '--mf-accent': '#7da8ff',
      '--mf-accent-contrast': '#09111e',
      '--mf-button-bg': '#1a1f2d',
      '--mf-button-border': '#30384e',
      '--mf-button-hover-bg': '#7da8ff',
      '--mf-button-hover-text': '#08111e',
      '--mf-code-bg': '#23283a',
      '--mf-code-text': '#f1f5ff',
      '--mf-pre-bg': '#05070d',
      '--mf-pre-text': '#f3f5fb',
      '--mf-quote-border': '#7da8ff',
      '--mf-link': '#9fc0ff',
      '--mf-link-hover': '#c4d7ff',
      '--mf-shadow': '0 18px 45px rgba(0, 0, 0, 0.35)',
      '--mf-preview-bg': '#121522c7',
    },
  },
  {
    id: 'paper',
    label: 'Paper',
    description: 'High-contrast notebook look with soft ink tones.',
    variables: {
      '--mf-ui-font': "'Georgia', 'Times New Roman', serif",
      '--mf-mono-font': "'Consolas', 'Cascadia Code', monospace",
      '--mf-bg': '#fbf7ef',
      '--mf-bg-accent-1': 'rgb(207 176 110 / 20%)',
      '--mf-bg-accent-2': 'rgb(65 93 134 / 12%)',
      '--mf-surface': '#fffaf2de',
      '--mf-surface-strong': '#fffdf8',
      '--mf-surface-muted': '#f9f3e8',
      '--mf-border': '#d9cdbb',
      '--mf-border-soft': '#eadfcc',
      '--mf-text': '#2a2118',
      '--mf-text-soft': '#665446',
      '--mf-heading': '#1f160f',
      '--mf-accent': '#7a4f1d',
      '--mf-accent-contrast': '#fff8ee',
      '--mf-button-bg': '#fffaf2',
      '--mf-button-border': '#cab89c',
      '--mf-button-hover-bg': '#7a4f1d',
      '--mf-button-hover-text': '#fff8ee',
      '--mf-code-bg': '#f4ead8',
      '--mf-code-text': '#392819',
      '--mf-pre-bg': '#2b1d13',
      '--mf-pre-text': '#fff7eb',
      '--mf-quote-border': '#7a4f1d',
      '--mf-link': '#7a4f1d',
      '--mf-link-hover': '#54330e',
      '--mf-shadow': '0 18px 45px rgba(63, 41, 23, 0.12)',
      '--mf-preview-bg': '#fffaf2cc',
    },
  },
]

export const defaultThemeId: ThemeId = 'aurora'

export function getTheme(themeId: string | null | undefined): ThemeDefinition {
  return themes.find((theme) => theme.id === themeId) ?? themes[0]
}

export function toThemeStyle(theme: ThemeDefinition): CSSProperties {
  return theme.variables as unknown as CSSProperties
}

export function getThemeCss(theme: ThemeDefinition): string {
  const rootVars = Object.entries(theme.variables)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n    ')

  return `
:root {
    ${rootVars}
}

html, body {
    margin: 0;
    padding: 0;
    background: var(--mf-bg);
    color: var(--mf-text);
    font-family: var(--mf-ui-font);
}

body {
    line-height: 1.7;
}

.document {
    max-width: 900px;
    margin: 0 auto;
    padding: 2.5rem 1.5rem 4rem;
    box-sizing: border-box;
    background: transparent;
}

.document h1,
.document h2,
.document h3,
.document h4,
.document h5,
.document h6 {
    color: var(--mf-heading);
    line-height: 1.2;
    margin-top: 1.4em;
    margin-bottom: 0.5em;
}

.document h1 {
    font-size: 2.2rem;
}

.document a {
    color: var(--mf-link);
    text-decoration-thickness: 2px;
    text-underline-offset: 0.15em;
}

.document a:hover {
    color: var(--mf-link-hover);
}

.document p,
.document ul,
.document ol,
.document blockquote,
.document pre,
.document table {
    margin-top: 0.9rem;
    margin-bottom: 0.9rem;
}

.document blockquote {
    border-left: 4px solid var(--mf-quote-border);
    padding: 0.2rem 0 0.2rem 1rem;
    color: var(--mf-text-soft);
}

.document code {
    font-family: var(--mf-mono-font);
    background: var(--mf-code-bg);
    color: var(--mf-code-text);
    padding: 0.12rem 0.35rem;
    border-radius: 0.35rem;
}

.document pre {
    background: var(--mf-pre-bg);
    color: var(--mf-pre-text);
    padding: 1rem 1.1rem;
    border-radius: 0.9rem;
    overflow: auto;
}

.document pre code {
    background: transparent;
    color: inherit;
    padding: 0;
}

.document table {
    width: 100%;
    border-collapse: collapse;
}

.document th,
.document td {
    border: 1px solid var(--mf-border);
    padding: 0.55rem 0.75rem;
    text-align: left;
}

.document th {
    background: color-mix(in srgb, var(--mf-surface-strong) 70%, var(--mf-bg) 30%);
}

.document hr {
    border: 0;
    border-top: 1px solid var(--mf-border);
    margin: 1.4rem 0;
}

.document img {
    max-width: 100%;
}

.document .theme-note {
    display: inline-block;
    margin-top: 1.25rem;
    padding: 0.4rem 0.75rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--mf-accent) 15%, transparent);
    color: var(--mf-text);
    font-size: 0.9rem;
}
`
}

export function buildExportDocument(theme: ThemeDefinition, bodyHtml: string, title: string): string {
  const themeCss = getThemeCss(theme)

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>${themeCss}</style>
</head>
<body>
  <article class="document">
    ${bodyHtml}
    <div class="theme-note">Theme: ${theme.label}</div>
  </article>
</body>
</html>`
}
