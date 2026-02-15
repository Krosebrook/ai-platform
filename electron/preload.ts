import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  // File I/O
  readFile: (path: string) => ipcRenderer.invoke('read-file', path),
  writeFile: (path: string, content: string) => ipcRenderer.invoke('write-file', path, content),
  listDirectory: (path: string) => ipcRenderer.invoke('list-directory', path),
  deleteFile: (path: string) => ipcRenderer.invoke('delete-file', path),
  fileExists: (path: string) => ipcRenderer.invoke('file-exists', path),

  // Dialogs
  pickFile: (options?: any) => ipcRenderer.invoke('pick-file', options),
  pickDirectory: () => ipcRenderer.invoke('pick-directory'),
  saveFileDialog: (options?: any) => ipcRenderer.invoke('save-file-dialog', options),

  // Clipboard
  clipboardRead: () => ipcRenderer.invoke('clipboard-read'),
  clipboardWrite: (text: string) => ipcRenderer.invoke('clipboard-write', text),

  // Shell / Git
  shellExec: (command: string, cwd?: string) => ipcRenderer.invoke('shell-exec', command, cwd),

  // Workflows
  triggerWorkflow: (webhookUrl: string, payload: any) =>
    ipcRenderer.invoke('trigger-workflow', webhookUrl, payload),
  checkStatus: (statusUrl: string) => ipcRenderer.invoke('check-status', statusUrl),

  // Platform
  getPlatformInfo: () => ipcRenderer.invoke('get-platform-info'),

  // Events from main process
  onToggleCommandPalette: (callback: () => void) => {
    ipcRenderer.on('toggle-command-palette', callback);
    return () => ipcRenderer.removeListener('toggle-command-palette', callback);
  },
});

declare global {
  interface Window {
    electron?: {
      readFile: (path: string) => Promise<{ success: boolean; content?: string; error?: string }>;
      writeFile: (path: string, content: string) => Promise<{ success: boolean; error?: string }>;
      listDirectory: (path: string) => Promise<{ success: boolean; entries?: Array<{ name: string; isDirectory: boolean; path: string }>; error?: string }>;
      deleteFile: (path: string) => Promise<{ success: boolean; error?: string }>;
      fileExists: (path: string) => Promise<boolean>;
      pickFile: (options?: any) => Promise<string | null>;
      pickDirectory: () => Promise<string | null>;
      saveFileDialog: (options?: any) => Promise<string | null>;
      clipboardRead: () => Promise<string>;
      clipboardWrite: (text: string) => Promise<void>;
      shellExec: (command: string, cwd?: string) => Promise<{ success: boolean; stdout?: string; stderr?: string; error?: string }>;
      triggerWorkflow: (webhookUrl: string, payload: any) => Promise<{ success: boolean; data?: any; error?: string }>;
      checkStatus: (statusUrl: string) => Promise<{ success: boolean; data?: any; error?: string }>;
      getPlatformInfo: () => Promise<{ platform: string; isElectron: boolean; appPath: string; homePath: string }>;
      onToggleCommandPalette: (callback: () => void) => () => void;
    };
  }
}
