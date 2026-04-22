import { useCallback, useEffect, useMemo, useState } from 'react'
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'
import './App.css'
import {
  buildExportDocument,
  defaultThemeId,
  getTheme,
  themes,
  toThemeStyle,
  type ThemeId,
} from './themes'

const DRAFT_STORAGE_KEY = 'markforge.draft.v1'
const RECENT_FILES_KEY = 'markforge.recentFiles.v1'
const THEME_STORAGE_KEY = 'markforge.theme.v1'

type SplitStrategy = 'h1' | 'h2' | 'h3' | 'marker'
type SplitView = 'all' | 'single'

interface MarkdownSection {
  id: string
  title: string
  content: string
}

const mdEngine = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
})

const starterDocument = `# MarkForge

Welcome to your desktop Markdown workspace.

## What you can do

- Edit Markdown with live preview
- Open and save local files
- Split big markdown files into named sections
- Export to MD, HTML, TXT, and PDF

> Start writing your document and use the toolbar above for file actions.
`

function createSectionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function cloneSections(sections: MarkdownSection[]): MarkdownSection[] {
  return sections.map((section) => ({ ...section }))
}

function sectionHeadingTitle(content: string): string | null {
  const match = content.trimStart().match(/^#{1,6}\s+(.+)$/m)
  return match?.[1]?.trim() ?? null
}

function sectionTitleFromContent(content: string, index: number): string {
  return sectionHeadingTitle(content) ?? `Section ${index + 1}`
}

function joinSections(sections: MarkdownSection[]): string {
  const joined = sections
    .map((section) => section.content.trimEnd())
    .filter((sectionContent) => sectionContent.length > 0)
    .join('\n\n')

  return joined.length > 0 ? joined : ''
}

function withUpdatedHeading(content: string, nextTitle: string): string {
  const safeTitle = nextTitle.trim() || 'Untitled Section'
  const trimmedStart = content.trimStart()

  if (/^#{1,6}\s+/.test(trimmedStart)) {
    return trimmedStart.replace(/^#{1,6}\s+.*$/m, `## ${safeTitle}`)
  }

  return `## ${safeTitle}\n\n${trimmedStart}`.trimEnd()
}

function splitByHeadingLevel(markdown: string, level: number): string[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const headingRegex = new RegExp(`^#{${level}}\\s+`)
  const chunks: string[] = []
  let currentChunk: string[] = []

  for (const line of lines) {
    if (headingRegex.test(line) && currentChunk.length > 0) {
      const chunk = currentChunk.join('\n').trim()
      if (chunk.length > 0) {
        chunks.push(chunk)
      }
      currentChunk = [line]
      continue
    }

    currentChunk.push(line)
  }

  const lastChunk = currentChunk.join('\n').trim()
  if (lastChunk.length > 0) {
    chunks.push(lastChunk)
  }

  return chunks
}

function splitByMarker(markdown: string): string[] {
  const normalized = markdown.replace(/\r\n/g, '\n')
  const chunks = normalized
    .split(/\n(?:<!--\s*markforge:split\s*-->|---\s*split\s*---)\n/g)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0)

  return chunks
}

function makeSections(markdown: string, strategy: SplitStrategy): MarkdownSection[] {
  const rawChunks =
    strategy === 'h1'
      ? splitByHeadingLevel(markdown, 1)
      : strategy === 'h2'
        ? splitByHeadingLevel(markdown, 2)
        : strategy === 'h3'
          ? splitByHeadingLevel(markdown, 3)
          : splitByMarker(markdown)

  const fallbackChunk = markdown.trim().length > 0 ? [markdown.trim()] : [starterDocument.trim()]
  const chunks = rawChunks.length > 0 ? rawChunks : fallbackChunk

  return chunks.map((chunk, index) => ({
    id: createSectionId(),
    title: sectionTitleFromContent(chunk, index),
    content: chunk,
  }))
}

function App() {
  const [content, setContent] = useState(() => {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY)
    return saved ?? starterDocument
  })
  const [activePath, setActivePath] = useState<string | null>(() => {
    return localStorage.getItem(`${DRAFT_STORAGE_KEY}:path`)
  })
  const [lastSavedContent, setLastSavedContent] = useState(() => {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY)
    return saved ?? starterDocument
  })
  const [recentFiles, setRecentFiles] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(RECENT_FILES_KEY)
      return raw ? (JSON.parse(raw) as string[]) : []
    } catch {
      return []
    }
  })
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    return (localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null) ?? defaultThemeId
  })
  const [status, setStatus] = useState('Ready')

  const [isSplitMode, setIsSplitMode] = useState(false)
  const [splitStrategy, setSplitStrategy] = useState<SplitStrategy>('h2')
  const [splitView, setSplitView] = useState<SplitView>('all')
  const [sections, setSections] = useState<MarkdownSection[]>([])
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const [splitPast, setSplitPast] = useState<MarkdownSection[][]>([])
  const [splitFuture, setSplitFuture] = useState<MarkdownSection[][]>([])

  const isDirty = content !== lastSavedContent
  const theme = getTheme(themeId)
  const themeStyle = toThemeStyle(theme)

  const html = useMemo(() => {
    const parsed = mdEngine.render(content)
    return DOMPurify.sanitize(parsed)
  }, [content])

  const addRecentFile = useCallback((filePath: string) => {
    setRecentFiles((previous) => {
      const deduplicated = [filePath, ...previous.filter((item) => item !== filePath)]
      return deduplicated.slice(0, 10)
    })
  }, [])

  const resetSplitState = useCallback(() => {
    setIsSplitMode(false)
    setSections([])
    setActiveSectionId(null)
    setSplitPast([])
    setSplitFuture([])
    setSplitView('all')
  }, [])

  const shouldDiscardUnsaved = useCallback(() => {
    if (!isDirty) {
      return true
    }

    return window.confirm('You have unsaved changes. Discard them and continue?')
  }, [isDirty])

  const openFile = useCallback(async () => {
    if (!window.desktopAPI) {
      setStatus('Open is available in desktop mode only.')
      return
    }

    if (!shouldDiscardUnsaved()) {
      return
    }

    const result = await window.desktopAPI.openFile()
    if (!result) {
      return
    }

    resetSplitState()
    setContent(result.content)
    setActivePath(result.filePath)
    setLastSavedContent(result.content)
    addRecentFile(result.filePath)
    setStatus(`Opened ${result.filePath}`)
  }, [addRecentFile, resetSplitState, shouldDiscardUnsaved])

  const openRecentFile = useCallback(
    async (filePath: string) => {
      if (!window.desktopAPI?.openFileByPath) {
        setStatus('Recent file opening is available in desktop mode only.')
        return
      }

      if (!shouldDiscardUnsaved()) {
        return
      }

      const result = await window.desktopAPI.openFileByPath(filePath)
      if (!result) {
        setRecentFiles((previous) => previous.filter((item) => item !== filePath))
        setStatus('Could not open that recent file. It may have moved.')
        return
      }

      resetSplitState()
      setContent(result.content)
      setActivePath(result.filePath)
      setLastSavedContent(result.content)
      addRecentFile(result.filePath)
      setStatus(`Opened ${result.filePath}`)
    },
    [addRecentFile, resetSplitState, shouldDiscardUnsaved],
  )

  const saveFile = useCallback(async () => {
    if (!window.desktopAPI) {
      setStatus('Save is available in desktop mode only.')
      return
    }

    const result = await window.desktopAPI.saveFile({
      filePath: activePath,
      content,
    })

    if (!result) {
      return
    }

    setActivePath(result.filePath)
    setLastSavedContent(content)
    addRecentFile(result.filePath)
    setStatus(`Saved ${result.filePath}`)
  }, [activePath, addRecentFile, content])

  const exportFile = useCallback(
    async (format: 'md' | 'html' | 'txt' | 'pdf') => {
      if (!window.desktopAPI) {
        setStatus('Export is available in desktop mode only.')
        return
      }

      const baseName = 'document'
      const documentHtml = buildExportDocument(theme, html, baseName)
      const exportContent =
        format === 'html'
          ? documentHtml
          : format === 'txt'
            ? content.replace(/[#*_`>-]/g, '')
            : content

      const result = await window.desktopAPI.exportFile({
        format,
        suggestedName: `${baseName}.${format}`,
        content: exportContent,
        html: documentHtml,
      })

      if (result) {
        setStatus(`Exported ${result.filePath}`)
      }
    },
    [content, html, theme],
  )

  const newDocument = useCallback(() => {
    if (!shouldDiscardUnsaved()) {
      return
    }

    resetSplitState()
    setContent(starterDocument)
    setLastSavedContent(starterDocument)
    setActivePath(null)
    setStatus('Started a new document')
  }, [resetSplitState, shouldDiscardUnsaved])

  const startSplitWorkflow = () => {
    const nextSections = makeSections(content, splitStrategy)

    if (nextSections.length <= 1) {
      setStatus('Split produced one section. Add more headings or split markers first.')
      return
    }

    setIsSplitMode(true)
    setSections(nextSections)
    setSplitPast([])
    setSplitFuture([])
    setActiveSectionId(nextSections[0]?.id ?? null)
    setSplitView('all')
    setContent(joinSections(nextSections))
    setStatus(`Split into ${nextSections.length} sections using ${splitStrategy.toUpperCase()}.`)
  }

  const snapshotSplitState = (currentSections: MarkdownSection[]) => {
    setSplitPast((previous) => [...previous, cloneSections(currentSections)].slice(-100))
    setSplitFuture([])
  }

  const updateSections = (nextSections: MarkdownSection[]) => {
    setSections(nextSections)
    setContent(joinSections(nextSections))
  }

  const renameSection = (sectionId: string, nextTitle: string) => {
    const normalizedTitle = nextTitle.trim() || 'Untitled Section'
    const existing = sections.find((section) => section.id === sectionId)
    if (!existing || existing.title === normalizedTitle) {
      return
    }

    snapshotSplitState(sections)
    const nextSections = sections.map((section) => {
      if (section.id !== sectionId) {
        return section
      }

      return {
        ...section,
        title: normalizedTitle,
        content: withUpdatedHeading(section.content, normalizedTitle),
      }
    })

    updateSections(nextSections)
    setStatus(`Renamed section to "${normalizedTitle}".`)
  }

  const updateSectionTitleDraft = (sectionId: string, nextTitle: string) => {
    setSections((previous) =>
      previous.map((section) => {
        if (section.id !== sectionId) {
          return section
        }

        return {
          ...section,
          title: nextTitle,
        }
      }),
    )
  }

  const updateSectionContent = (sectionId: string, nextContent: string) => {
    const nextSections = sections.map((section) =>
      section.id === sectionId ? { ...section, content: nextContent } : section,
    )
    updateSections(nextSections)
  }

  const addBreakpointAfter = (sectionId: string) => {
    const currentIndex = sections.findIndex((section) => section.id === sectionId)
    if (currentIndex === -1) {
      return
    }

    snapshotSplitState(sections)
    const insertedSection: MarkdownSection = {
      id: createSectionId(),
      title: `Section ${sections.length + 1}`,
      content: '## Section Heading\n\nWrite this section...',
    }

    const nextSections = [
      ...sections.slice(0, currentIndex + 1),
      insertedSection,
      ...sections.slice(currentIndex + 1),
    ]

    updateSections(nextSections)
    setActiveSectionId(insertedSection.id)
    setStatus('Inserted a new breakpoint section.')
  }

  const removeSection = (sectionId: string) => {
    if (sections.length <= 1) {
      setStatus('At least one section is required.')
      return
    }

    snapshotSplitState(sections)
    const nextSections = sections.filter((section) => section.id !== sectionId)
    updateSections(nextSections)

    if (activeSectionId === sectionId) {
      setActiveSectionId(nextSections[0]?.id ?? null)
    }

    setStatus('Removed section.')
  }

  const undoSplitStep = () => {
    if (splitPast.length === 0) {
      setStatus('Nothing to undo.')
      return
    }

    const previousSnapshot = splitPast[splitPast.length - 1]
    setSplitPast((previous) => previous.slice(0, -1))
    setSplitFuture((previous) => [cloneSections(sections), ...previous].slice(0, 100))
    updateSections(cloneSections(previousSnapshot))
    setActiveSectionId(previousSnapshot[0]?.id ?? null)
    setStatus('Undo completed.')
  }

  const redoSplitStep = () => {
    if (splitFuture.length === 0) {
      setStatus('Nothing to redo.')
      return
    }

    const nextSnapshot = splitFuture[0]
    setSplitFuture((previous) => previous.slice(1))
    setSplitPast((previous) => [...previous, cloneSections(sections)].slice(-100))
    updateSections(cloneSections(nextSnapshot))
    setActiveSectionId(nextSnapshot[0]?.id ?? null)
    setStatus('Redo completed.')
  }

  const mergeSectionsBack = () => {
    if (!isSplitMode) {
      return
    }

    const merged = joinSections(sections)
    resetSplitState()
    setContent(merged)
    setStatus('Merged sections back into one Markdown document.')
  }

  useEffect(() => {
    localStorage.setItem(DRAFT_STORAGE_KEY, content)
    if (activePath) {
      localStorage.setItem(`${DRAFT_STORAGE_KEY}:path`, activePath)
    } else {
      localStorage.removeItem(`${DRAFT_STORAGE_KEY}:path`)
    }
  }, [activePath, content])

  useEffect(() => {
    localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(recentFiles))
  }, [recentFiles])

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, themeId)
  }, [themeId])

  useEffect(() => {
    const root = document.documentElement
    for (const [variableName, value] of Object.entries(theme.variables)) {
      root.style.setProperty(variableName, value)
    }
  }, [theme])

  useEffect(() => {
    document.title = `${isDirty ? '* ' : ''}MarkForge`
  }, [isDirty])

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) {
        return
      }

      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        void saveFile()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [saveFile])

  const formatFileName = (filePath: string) => {
    const segments = filePath.split(/\\|\//)
    return segments[segments.length - 1] || filePath
  }

  const visibleSections =
    splitView === 'single' && activeSectionId
      ? sections.filter((section) => section.id === activeSectionId)
      : sections

  return (
    <main className="app-shell" data-theme={theme.id} style={themeStyle}>
      <header className="app-header">
        <div>
          <h1>MarkForge</h1>
          <p>Desktop Markdown editor for Windows and Linux.</p>
        </div>
        <div className="toolbar">
          <label className="theme-picker">
            <span>Theme</span>
            <select value={themeId} onChange={(event) => setThemeId(event.target.value as ThemeId)}>
              {themes.map((themeOption) => (
                <option key={themeOption.id} value={themeOption.id}>
                  {themeOption.label}
                </option>
              ))}
            </select>
          </label>
          <button onClick={newDocument}>New</button>
          <button onClick={openFile}>Open</button>
          <button onClick={saveFile}>Save</button>
          <button onClick={() => exportFile('md')}>Export MD</button>
          <button onClick={() => exportFile('html')}>Export HTML</button>
          <button onClick={() => exportFile('txt')}>Export TXT</button>
          <button onClick={() => exportFile('pdf')}>Export PDF</button>
        </div>
      </header>

      <section className="split-controls panel">
        <div className="split-control-row">
          <label>
            <span>Breakpoints</span>
            <select
              value={splitStrategy}
              onChange={(event) => setSplitStrategy(event.target.value as SplitStrategy)}
            >
              <option value="h1">Heading H1</option>
              <option value="h2">Heading H2</option>
              <option value="h3">Heading H3</option>
              <option value="marker">Marker: &lt;!-- markforge:split --&gt;</option>
            </select>
          </label>

          {!isSplitMode && <button onClick={startSplitWorkflow}>Split Document</button>}
          {isSplitMode && (
            <>
              <button onClick={mergeSectionsBack}>Merge Sections</button>
              <button onClick={undoSplitStep} disabled={splitPast.length === 0}>
                Undo Step
              </button>
              <button onClick={redoSplitStep} disabled={splitFuture.length === 0}>
                Redo Step
              </button>
              <label>
                <span>Section View</span>
                <select value={splitView} onChange={(event) => setSplitView(event.target.value as SplitView)}>
                  <option value="all">Edit All Sections</option>
                  <option value="single">Single Section Focus</option>
                </select>
              </label>
            </>
          )}
        </div>
      </section>

      <section className="workspace">
        <article className="panel recents-panel">
          <div className="panel-title">Recent Files</div>
          <div className="recents-list">
            {recentFiles.length === 0 && (
              <p className="empty-state">Open or save files to build your recent list.</p>
            )}
            {recentFiles.map((filePath) => (
              <button
                key={filePath}
                className="recent-item"
                onClick={() => {
                  void openRecentFile(filePath)
                }}
                title={filePath}
              >
                <span className="recent-name">{formatFileName(filePath)}</span>
                <span className="recent-path">{filePath}</span>
              </button>
            ))}
          </div>
        </article>

        {!isSplitMode && (
          <article className="panel editor-panel">
            <div className="panel-title">Editor</div>
            <textarea
              className="editor"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              spellCheck
            />
          </article>
        )}

        {isSplitMode && (
          <article className="panel split-editor-panel">
            <div className="panel-title">Split Sections ({sections.length})</div>
            <div className="sections-stack">
              {visibleSections.map((section) => (
                <div key={section.id} className="section-card">
                  <div className="section-card-header">
                    <input
                      className="section-title-input"
                      value={section.title}
                      onChange={(event) => updateSectionTitleDraft(section.id, event.target.value)}
                      onBlur={(event) => renameSection(section.id, event.target.value)}
                      onFocus={() => setActiveSectionId(section.id)}
                    />
                    <div className="section-actions">
                      <button onClick={() => addBreakpointAfter(section.id)}>Add Breakpoint</button>
                      <button onClick={() => removeSection(section.id)} disabled={sections.length <= 1}>
                        Remove
                      </button>
                    </div>
                  </div>

                  <textarea
                    className="section-editor"
                    value={section.content}
                    onChange={(event) => updateSectionContent(section.id, event.target.value)}
                    onFocus={() => setActiveSectionId(section.id)}
                    spellCheck
                  />
                </div>
              ))}
            </div>
          </article>
        )}

        <article className="panel preview-panel">
          <div className="panel-title">Preview · {theme.label}</div>
          <div className="preview" dangerouslySetInnerHTML={{ __html: html }} />
        </article>
      </section>

      <footer className="status-bar">
        <span>{status}</span>
        <span>{isDirty ? 'Unsaved changes' : 'All changes saved'}</span>
        <span>{activePath ?? 'Untitled document'}</span>
        {isSplitMode ? <span>Split mode active</span> : <span>Single document mode</span>}
        <span>{theme.description}</span>
      </footer>
    </main>
  )
}

export default App
