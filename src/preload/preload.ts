import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getClipboardText: () => ipcRenderer.invoke('get-clipboard-text'),
  onClipboardText: (callback: (text: string) => void) => {
    ipcRenderer.on('clipboard-text', (_, text) => callback(text));
  },
});