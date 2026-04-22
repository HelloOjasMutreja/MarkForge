const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs/promises');

const isDev = !app.isPackaged;

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    autoHideMenuBar: true,
    title: 'MarkForge',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://127.0.0.1:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('file:open', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'txt'] }],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const filePath = result.filePaths[0];
  const content = await fs.readFile(filePath, 'utf-8');
  return { filePath, content };
});

ipcMain.handle('file:save', async (_event, payload) => {
  const hasPath = payload.filePath && payload.filePath.trim().length > 0;

  let targetPath = payload.filePath;
  if (!hasPath) {
    const result = await dialog.showSaveDialog({
      defaultPath: 'untitled.md',
      filters: [{ name: 'Markdown', extensions: ['md'] }],
    });

    if (result.canceled || !result.filePath) {
      return null;
    }

    targetPath = result.filePath;
  }

  await fs.writeFile(targetPath, payload.content, 'utf-8');
  return { filePath: targetPath };
});

ipcMain.handle('file:export', async (_event, payload) => {
  const filters = {
    md: [{ name: 'Markdown', extensions: ['md'] }],
    html: [{ name: 'HTML', extensions: ['html'] }],
    txt: [{ name: 'Text', extensions: ['txt'] }],
    pdf: [{ name: 'PDF', extensions: ['pdf'] }],
  };

  const result = await dialog.showSaveDialog({
    defaultPath: payload.suggestedName,
    filters: filters[payload.format] || [{ name: 'All Files', extensions: ['*'] }],
  });

  if (result.canceled || !result.filePath) {
    return null;
  }

  if (payload.format === 'pdf') {
    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: { sandbox: false },
    });

    const escaped = encodeURIComponent(payload.html);
    await printWindow.loadURL(`data:text/html;charset=UTF-8,${escaped}`);
    const pdfBuffer = await printWindow.webContents.printToPDF({
      printBackground: true,
      margins: { marginType: 'default' },
    });
    await fs.writeFile(result.filePath, pdfBuffer);
    printWindow.close();
  } else {
    await fs.writeFile(result.filePath, payload.content, 'utf-8');
  }

  return { filePath: result.filePath };
});
