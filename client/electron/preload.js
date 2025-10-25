import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (msg) => ipcRenderer.send('message', msg),
  onMessage: (callback) => ipcRenderer.on('message', (_event, data) => callback(data))
})
