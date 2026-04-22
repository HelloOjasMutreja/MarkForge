const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopAPI', {
  openFile: () => ipcRenderer.invoke('file:open'),
  saveFile: (payload) => ipcRenderer.invoke('file:save', payload),
  exportFile: (payload) => ipcRenderer.invoke('file:export', payload),
});
