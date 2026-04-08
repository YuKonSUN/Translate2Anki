import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  onTextSelected: (callback: (text: string) => void) => {
    ipcRenderer.on('text-selected', (_, text) => callback(text));
  },
  getClipboardText: () => ipcRenderer.invoke('get-clipboard-text'),
  hideWindow: () => ipcRenderer.invoke('hide-window'),
  quitApp: () => ipcRenderer.invoke('quit-app'),
});
