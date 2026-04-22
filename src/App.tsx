import { useMemo, useState } from 'react'
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'
import './App.css'

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
  const [content, setContent] = useState(starterDocument)
  const [activePath, setActivePath] = useState<string | null>(null)
  const [status, setStatus] = useState('Ready')

  const html = useMemo(() => {
    const parsed = mdEngine.render(content)
    return DOMPurify.sanitize(parsed)
  }, [content])

  const openFile = async () => {
    if (!window.desktopAPI) {
      setStatus('Open is available in desktop mode only.')
      return
    }

    const result = await window.desktopAPI.openFile()
    if (!result) {
      return
    }

    setContent(result.content)
    setActivePath(result.filePath)
    setStatus(`Opened ${result.filePath}`)
  }

  const saveFile = async () => {
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
    setStatus(`Saved ${result.filePath}`)
  }

  const exportFile = async (format: 'md' | 'html' | 'txt' | 'pdf') => {
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
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1>MarkForge</h1>
          <p>Desktop Markdown editor for Windows and Linux.</p>
        </div>
        <div className="toolbar">
          <button onClick={openFile}>Open</button>
          <button onClick={saveFile}>Save</button>
          <button onClick={() => exportFile('md')}>Export MD</button>
          <button onClick={() => exportFile('html')}>Export HTML</button>
          <button onClick={() => exportFile('txt')}>Export TXT</button>
          <button onClick={() => exportFile('pdf')}>Export PDF</button>
        </div>
      </header>

      <section className="workspace">
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
        <span>{activePath ?? 'Untitled document'}</span>
      </footer>
    </main>
  )
}

export default App
