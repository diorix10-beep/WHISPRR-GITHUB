"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    selectDirectory: () => electron_1.ipcRenderer.invoke('dialog:selectDirectory'),
    scanProject: (rootPath) => electron_1.ipcRenderer.invoke('fs:scanProject', rootPath),
    readFile: (filePath) => electron_1.ipcRenderer.invoke('fs:readFile', filePath),
    openPath: (fullPath) => electron_1.ipcRenderer.invoke('fs:openPath', fullPath),
});
