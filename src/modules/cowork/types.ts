export interface CoworkTask {
  id: string;
  description: string;
  workingDirectory: string;
  status: 'pending' | 'planning' | 'executing' | 'completed' | 'failed' | 'cancelled';
  steps: TaskStep[];
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export interface TaskStep {
  id: string;
  description: string;
  type: 'read' | 'write' | 'create' | 'delete' | 'rename' | 'move' | 'analyze';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  target?: string;
  result?: string;
  error?: string;
}

export interface FileSnapshot {
  path: string;
  content: string;
  timestamp: string;
}
