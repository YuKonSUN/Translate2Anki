"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    onTextSelected: (callback) => {
        electron_1.ipcRenderer.on('text-selected', (_, text) => callback(text));
    },
    getClipboardText: () => electron_1.ipcRenderer.invoke('get-clipboard-text'),
    // Add more IPC methods as needed
});
