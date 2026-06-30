import * as fs from 'fs';
import * as path from 'path';
import { shell } from 'electron';
import { exec } from 'child_process';

// Ignore common unhelpful directories and files
const IGNORE_DIRS = ['.git', 'node_modules', 'dist', 'build', '.next', 'out', 'coverage', '.cache', '.vscode', '.idea'];
const IGNORE_FILES = ['.DS_Store', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
const MAX_FILE_SIZE = 100 * 1024; // 100KB limit for reading text

export interface ProjectFile {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  children?: ProjectFile[];
}

export function setupFsHandlers(ipcMain: Electron.IpcMain, dialog: Electron.Dialog) {
  
  ipcMain.handle('fs:openPath', async (event, filePath: string) => {
    if (!filePath) return false;
    try {
      if (fs.existsSync(filePath)) {
        await shell.openPath(filePath);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to open path:', e);
      return false;
    }
  });
  ipcMain.handle('dialog:selectDirectory', async (event) => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory']
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  ipcMain.handle('fs:scanProject', async (event, rootPath: string) => {
    if (!rootPath || !fs.existsSync(rootPath)) {
      return null;
    }

    try {
      return scanDirectory(rootPath, rootPath);
    } catch (e) {
      console.error('Failed to scan directory:', e);
      return null;
    }
  });

  ipcMain.handle('fs:readFile', async (event, filePath: string) => {
    if (!filePath || !fs.existsSync(filePath)) {
      return null;
    }

    try {
      const stats = fs.statSync(filePath);
      if (stats.size > MAX_FILE_SIZE) {
        return `[File too large to read into context: ${(stats.size / 1024).toFixed(1)}KB]`;
      }
      return fs.readFileSync(filePath, 'utf-8');
    } catch (e) {
      console.error('Failed to read file:', e);
      return null;
    }
  });

  ipcMain.handle('fs:writeFile', async (event, filePath: string, content: string) => {
    if (!filePath) return false;
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, content, 'utf-8');
      return true;
    } catch (e) {
      console.error('Failed to write file:', e);
      return false;
    }
  });

  ipcMain.handle('fs:runCommand', async (event, command: string, cwd: string) => {
    return new Promise((resolve) => {
      exec(command, { cwd, maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
        let output = stdout || '';
        if (stderr) output += '\n[STDERR]:\n' + stderr;
        if (error) output += '\n[ERROR]:\n' + error.message;
        resolve(output.substring(0, 4000)); // Cap output to avoid token limits
      });
    });
  });
}

function scanDirectory(dir: string, rootDir: string): ProjectFile {
  const name = path.basename(dir);
  const result: ProjectFile = {
    path: path.relative(rootDir, dir) || '.',
    name: name,
    type: 'directory',
    children: []
  };

  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      if (item.isDirectory()) {
        if (IGNORE_DIRS.includes(item.name)) continue;
        
        const fullPath = path.join(dir, item.name);
        result.children!.push(scanDirectory(fullPath, rootDir));
      } else {
        if (IGNORE_FILES.includes(item.name)) continue;
        // Basic check for obvious binary extensions
        if (item.name.match(/\.(png|jpg|jpeg|gif|ico|mp4|mp3|wav|zip|tar|gz|pdf)$/i)) continue;

        const fullPath = path.join(dir, item.name);
        try {
          const stats = fs.statSync(fullPath);
          result.children!.push({
            path: path.relative(rootDir, fullPath),
            name: item.name,
            type: 'file',
            size: stats.size
          });
        } catch {
          // ignore stat errors (e.g. broken symlinks)
        }
      }
    }
    
    // Sort directories first, then alphabetically
    result.children!.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'directory' ? -1 : 1;
    });

  } catch (e) {
    console.error(`Failed to read directory ${dir}:`, e);
  }

  return result;
}
