// ============================================================
// ORACLE VERITY — ELECTRON BRIDGE
// Secure frontend interface to Electron APIs
// ============================================================

export interface ProjectFile {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  children?: ProjectFile[];
}

// Ensure TypeScript knows about window.electronAPI from preload.ts
declare global {
  interface Window {
    electronAPI?: {
      selectDirectory: () => Promise<string | null>;
      scanProject: (rootPath: string) => Promise<ProjectFile | null>;
      readFile: (filePath: string) => Promise<string | null>;
      writeFile: (filePath: string, content: string) => Promise<boolean>;
      runCommand: (command: string, cwd: string) => Promise<string>;
      openPath?: (fullPath: string) => Promise<boolean>;
    };
  }
}

export const electronBridge = {
  get isAvailable(): boolean {
    return !!window.electronAPI;
  },

  async selectDirectory(defaultPath?: string): Promise<string | null> {
    if (!window.electronAPI) {
      // Browser fallback: Prompt the user to enter the directory path manually.
      return prompt(
        "Enter absolute local folder path (e.g. /Users/username/Projects/my-app):",
        defaultPath || ""
      );
    }
    return await window.electronAPI.selectDirectory();
  },

  async scanProject(rootPath: string): Promise<ProjectFile | null> {
    if (!window.electronAPI) return null;
    return await window.electronAPI.scanProject(rootPath);
  },

  async readFile(filePath: string): Promise<string | null> {
    if (!window.electronAPI) return null;
    return await window.electronAPI.readFile(filePath);
  },

  async writeFile(filePath: string, content: string): Promise<boolean> {
    if (!window.electronAPI) {
      console.warn('writeFile is not available in browser mode.');
      return false;
    }
    return await window.electronAPI.writeFile(filePath, content);
  },

  async runCommand(command: string, cwd: string): Promise<string> {
    if (!window.electronAPI) {
      return "Terminal commands are not available in browser mode. Run the desktop app.";
    }
    return await window.electronAPI.runCommand(command, cwd);
  },

  async openPath(fullPath: string): Promise<boolean> {
    if (!window.electronAPI || !window.electronAPI.openPath) {
      console.log('Opening local folder is not supported in browser mode:', fullPath);
      // Let the browser user copy or read the path since we can't open Finder from here
      alert(`Local folder opening is only supported in the Desktop App.\n\nYour linked path is:\n${fullPath}`);
      return false;
    }
    return await window.electronAPI.openPath(fullPath);
  }
};
