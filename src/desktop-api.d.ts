export {}

declare global {
  interface Window {
    desktopAPI?: {
      openFile: () => Promise<{ filePath: string; content: string } | null>
      saveFile: (payload: { filePath?: string | null; content: string }) => Promise<{ filePath: string } | null>
      exportFile: (payload: {
        format: 'md' | 'html' | 'txt' | 'pdf'
        suggestedName: string
        content: string
        html: string
      }) => Promise<{ filePath: string } | null>
    }
  }
}
