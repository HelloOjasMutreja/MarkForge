import { useCallback, useEffect, useMemo, useState } from 'react'
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'
import './App.css'

const DRAFT_STORAGE_KEY = 'markforge.draft.v1'
const RECENT_FILES_KEY = 'markforge.recentFiles.v1'

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
- Export to MD, HTML, TXT, and PDF

> Start writing your document and use the toolbar above for file actions.
`

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
  const [status, setStatus] = useState('Ready')
  const isDirty = content !== lastSavedContent

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

    setContent(result.content)
    setActivePath(result.filePath)
    setLastSavedContent(result.content)
    addRecentFile(result.filePath)
    setStatus(`Opened ${result.filePath}`)
  }, [addRecentFile, shouldDiscardUnsaved])

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

      setContent(result.content)
      setActivePath(result.filePath)
      setLastSavedContent(result.content)
      addRecentFile(result.filePath)
      setStatus(`Opened ${result.filePath}`)
    },
    [addRecentFile, shouldDiscardUnsaved],
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

  const exportFile = useCallback(async (format: 'md' | 'html' | 'txt' | 'pdf') => {
    if (!window.desktopAPI) {
      setStatus('Export is available in desktop mode only.')
      return
    }

    const baseName = 'document'
    const exportContent =
      format === 'html'
        ? `<!doctype html><html><head><meta charset="UTF-8" /><title>${baseName}</title></head><body>${html}</body></html>`
        : format === 'txt'
          ? content.replace(/[#*_`>-]/g, '')
          : content

    const result = await window.desktopAPI.exportFile({
      format,
      suggestedName: `${baseName}.${format}`,
      content: exportContent,
      html,
    })

    if (result) {
      setStatus(`Exported ${result.filePath}`)
    }
  }, [content, html])

  const newDocument = useCallback(() => {
    if (!shouldDiscardUnsaved()) {
      return
    }

    setContent(starterDocument)
    setLastSavedContent(starterDocument)
    setActivePath(null)
    setStatus('Started a new document')
  }, [shouldDiscardUnsaved])

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

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1>MarkForge</h1>
          <p>Desktop Markdown editor for Windows and Linux.</p>
        </div>
        <div className="toolbar">
          <button onClick={newDocument}>New</button>
          <button onClick={openFile}>Open</button>
          <button onClick={saveFile}>Save</button>
          <button onClick={() => exportFile('md')}>Export MD</button>
          <button onClick={() => exportFile('html')}>Export HTML</button>
          <button onClick={() => exportFile('txt')}>Export TXT</button>
          <button onClick={() => exportFile('pdf')}>Export PDF</button>
        </div>
      </header>

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

        <article className="panel editor-panel">
          <div className="panel-title">Editor</div>
          <textarea
            className="editor"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            spellCheck
          />
        </article>

        <article className="panel preview-panel">
          <div className="panel-title">Preview</div>
          <div className="preview" dangerouslySetInnerHTML={{ __html: html }} />
        </article>
      </section>

      <footer className="status-bar">
        <span>{status}</span>
        <span>{isDirty ? 'Unsaved changes' : 'All changes saved'}</span>
        <span>{activePath ?? 'Untitled document'}</span>
      </footer>
    </main>
  )
}

export default App
