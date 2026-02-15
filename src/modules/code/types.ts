export interface ProjectInfo {
  path: string;
  name: string;
  type: 'node' | 'python' | 'rust' | 'go' | 'java' | 'unknown';
  framework?: string;
  gitBranch?: string;
  gitStatus?: string;
}

export interface GitDiff {
  files: Array<{
    path: string;
    status: 'added' | 'modified' | 'deleted';
    diff: string;
  }>;
  summary: string;
}
