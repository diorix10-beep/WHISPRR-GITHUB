"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupFsHandlers = setupFsHandlers;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const electron_1 = require("electron");
// Ignore common unhelpful directories and files
const IGNORE_DIRS = ['.git', 'node_modules', 'dist', 'build', '.next', 'out', 'coverage', '.cache', '.vscode', '.idea'];
const IGNORE_FILES = ['.DS_Store', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
const MAX_FILE_SIZE = 100 * 1024; // 100KB limit for reading text
function setupFsHandlers(ipcMain, dialog) {
    ipcMain.handle('fs:openPath', async (event, filePath) => {
        if (!filePath)
            return false;
        try {
            if (fs.existsSync(filePath)) {
                await electron_1.shell.openPath(filePath);
                return true;
            }
            return false;
        }
        catch (e) {
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
    ipcMain.handle('fs:scanProject', async (event, rootPath) => {
        if (!rootPath || !fs.existsSync(rootPath)) {
            return null;
        }
        try {
            return scanDirectory(rootPath, rootPath);
        }
        catch (e) {
            console.error('Failed to scan directory:', e);
            return null;
        }
    });
    ipcMain.handle('fs:readFile', async (event, filePath) => {
        if (!filePath || !fs.existsSync(filePath)) {
            return null;
        }
        try {
            const stats = fs.statSync(filePath);
            if (stats.size > MAX_FILE_SIZE) {
                return `[File too large to read into context: ${(stats.size / 1024).toFixed(1)}KB]`;
            }
            return fs.readFileSync(filePath, 'utf-8');
        }
        catch (e) {
            console.error('Failed to read file:', e);
            return null;
        }
    });
}
function scanDirectory(dir, rootDir) {
    const name = path.basename(dir);
    const result = {
        path: path.relative(rootDir, dir) || '.',
        name: name,
        type: 'directory',
        children: []
    };
    try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            if (item.isDirectory()) {
                if (IGNORE_DIRS.includes(item.name))
                    continue;
                const fullPath = path.join(dir, item.name);
                result.children.push(scanDirectory(fullPath, rootDir));
            }
            else {
                if (IGNORE_FILES.includes(item.name))
                    continue;
                // Basic check for obvious binary extensions
                if (item.name.match(/\.(png|jpg|jpeg|gif|ico|mp4|mp3|wav|zip|tar|gz|pdf)$/i))
                    continue;
                const fullPath = path.join(dir, item.name);
                try {
                    const stats = fs.statSync(fullPath);
                    result.children.push({
                        path: path.relative(rootDir, fullPath),
                        name: item.name,
                        type: 'file',
                        size: stats.size
                    });
                }
                catch {
                    // ignore stat errors (e.g. broken symlinks)
                }
            }
        }
        // Sort directories first, then alphabetically
        result.children.sort((a, b) => {
            if (a.type === b.type)
                return a.name.localeCompare(b.name);
            return a.type === 'directory' ? -1 : 1;
        });
    }
    catch (e) {
        console.error(`Failed to read directory ${dir}:`, e);
    }
    return result;
}
