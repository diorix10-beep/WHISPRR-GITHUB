import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electronAPI',
  {
    selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),
    scanProject: (rootPath: string) => ipcRenderer.invoke('fs:scanProject', rootPath),
    readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
    writeFile: (filePath: string, content: string) => ipcRenderer.invoke('fs:writeFile', filePath, content),
    runCommand: (command: string, cwd: string) => ipcRenderer.invoke('fs:runCommand', command, cwd),
    openPath: (fullPath: string) => ipcRenderer.invoke('fs:openPath', fullPath),
  }
);
