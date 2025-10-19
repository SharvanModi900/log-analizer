// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { contextBridge, ipcRenderer } = require('electron');

// As an example, here we use the exposeInMainWorld API to expose the browsers
// and node integration
contextBridge.exposeInMainWorld('electronAPI', {
  selectFiles: () => ipcRenderer.invoke('select-files'),
  analyzeFiles: (language) => ipcRenderer.invoke('analyze-files', language),
  resetFiles: () => ipcRenderer.invoke('reset-files')
});