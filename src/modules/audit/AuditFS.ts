/**
 * File system utilities for auditing
 * Uses Electron IPC when available, provides stubs otherwise
 */

export class AuditFS {
  /**
   * Check if a file exists in the repository
   */
  static async checkFileExists(repoPath: string, filename: string): Promise<boolean> {
    if (typeof window !== 'undefined' && window.electron) {
      const result = await window.electron.auditCheckFileExists(repoPath, filename);
      return result.exists;
    }
    return false;
  }

  /**
   * Check if a file contains a specific pattern
   */
  static async checkFileContains(repoPath: string, filename: string, pattern: string): Promise<boolean> {
    if (typeof window !== 'undefined' && window.electron) {
      const result = await window.electron.auditCheckFileContains(repoPath, filename, pattern);
      return result.contains;
    }
    return false;
  }

  /**
   * Search for patterns in the repository
   */
  static async checkForPattern(repoPath: string, patterns: string[], exact: boolean = false): Promise<boolean> {
    if (typeof window !== 'undefined' && window.electron) {
      const result = await window.electron.auditSearchPattern(repoPath, patterns, exact);
      return result.found;
    }
    return false;
  }

  /**
   * List files matching a pattern
   */
  static async listFiles(repoPath: string, pattern: string = '*'): Promise<string[]> {
    if (typeof window !== 'undefined' && window.electron) {
      const result = await window.electron.auditListFiles(repoPath, pattern);
      return result.files || [];
    }
    return [];
  }
}
