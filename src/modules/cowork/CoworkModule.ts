import type { AssistantModule, Intent, ContextSnapshot, ModuleResult, ModuleConfig, ToolDefinition, QuickAction } from '../../core/types';
import type { CoworkTask, TaskStep, FileSnapshot } from './types';
import { v4 as uuid } from 'uuid';
import { isElectron } from '../../core/platform';

export class CoworkModule implements AssistantModule {
  id = 'cowork';
  name = 'Cowork';
  description = 'Autonomous file agent — reads, edits, creates, and organizes files within a sandboxed directory';
  version = '1.0.0';
  triggers = ['file', 'folder', 'organize', 'create file', 'edit file', 'refactor', 'rename', 'move', 'cowork'];

  private tasks: CoworkTask[] = [];
  private snapshots: FileSnapshot[] = [];

  async init(_config: ModuleConfig) {}
  async destroy() {}

  canHandle(intent: Intent): boolean {
    if (!isElectron()) return false;
    return this.triggers.some(t => intent.raw.toLowerCase().includes(t));
  }

  async handle(intent: Intent, _context: ContextSnapshot): Promise<ModuleResult> {
    return {
      success: true,
      message: 'Cowork module ready. Assign a task with a working directory to get started.',
      ui: 'panel',
    };
  }

  getTools(): ToolDefinition[] {
    return [
      {
        name: 'cowork.assign_task',
        description: 'Give the agent a task with a working directory',
        inputSchema: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            workingDirectory: { type: 'string' },
          },
          required: ['description', 'workingDirectory'],
        },
      },
      {
        name: 'cowork.read_file',
        description: 'Read a file within the sandbox',
        inputSchema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
      },
      {
        name: 'cowork.write_file',
        description: 'Write/create a file within the sandbox',
        inputSchema: {
          type: 'object',
          properties: { path: { type: 'string' }, content: { type: 'string' } },
          required: ['path', 'content'],
        },
      },
      {
        name: 'cowork.list_directory',
        description: 'List files in the sandbox',
        inputSchema: { type: 'object', properties: { path: { type: 'string' } } },
      },
      {
        name: 'cowork.search_files',
        description: 'Search file contents within the sandbox',
        inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
      },
      {
        name: 'cowork.get_progress',
        description: 'Get current task progress',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'cowork.cancel_task',
        description: 'Cancel the running task',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'cowork.rollback',
        description: 'Undo last file operation',
        inputSchema: { type: 'object', properties: {} },
      },
    ];
  }

  async executeTool(name: string, args: Record<string, unknown>) {
    if (!isElectron() || !window.electron) {
      return { success: false, error: 'Cowork requires Electron (desktop app)' };
    }

    switch (name) {
      case 'cowork.assign_task':
        return this.assignTask(args.description as string, args.workingDirectory as string);
      case 'cowork.read_file':
        return this.readFile(args.path as string);
      case 'cowork.write_file':
        return this.writeFile(args.path as string, args.content as string);
      case 'cowork.list_directory':
        return this.listDir(args.path as string);
      case 'cowork.get_progress':
        return { success: true, data: this.tasks };
      case 'cowork.cancel_task':
        return this.cancelCurrentTask();
      case 'cowork.rollback':
        return this.rollback();
      default:
        return { success: false, error: `Unknown tool: ${name}` };
    }
  }

  private async assignTask(description: string, workingDirectory: string) {
    // Validate path (no traversal)
    if (workingDirectory.includes('..')) {
      return { success: false, error: 'Path traversal not allowed' };
    }

    const task: CoworkTask = {
      id: uuid(),
      description,
      workingDirectory,
      status: 'pending',
      steps: [],
      createdAt: new Date().toISOString(),
    };

    this.tasks.push(task);
    return { success: true, data: task };
  }

  private async readFile(filePath: string) {
    if (filePath.includes('..')) return { success: false, error: 'Path traversal not allowed' };
    return window.electron!.readFile(filePath);
  }

  private async writeFile(filePath: string, content: string) {
    if (filePath.includes('..')) return { success: false, error: 'Path traversal not allowed' };

    // Snapshot before write
    try {
      const existing = await window.electron!.readFile(filePath);
      if (existing.success && existing.content) {
        this.snapshots.push({ path: filePath, content: existing.content, timestamp: new Date().toISOString() });
      }
    } catch { /* new file */ }

    return window.electron!.writeFile(filePath, content);
  }

  private async listDir(dirPath: string) {
    if (dirPath.includes('..')) return { success: false, error: 'Path traversal not allowed' };
    return window.electron!.listDirectory(dirPath);
  }

  private cancelCurrentTask() {
    const running = this.tasks.find(t => t.status === 'executing' || t.status === 'planning');
    if (running) {
      running.status = 'cancelled';
      return { success: true, data: running };
    }
    return { success: false, error: 'No running task' };
  }

  private async rollback() {
    const last = this.snapshots.pop();
    if (!last) return { success: false, error: 'Nothing to rollback' };
    await window.electron!.writeFile(last.path, last.content);
    return { success: true, data: { restored: last.path } };
  }

  getQuickActions(): QuickAction[] {
    return [
      {
        id: 'cowork.assign',
        label: 'Assign Task',
        icon: 'folder-cog',
        description: 'Assign a file task to the Cowork agent',
        moduleId: this.id,
        action: async () => {
          if (window.electron) {
            const dir = await window.electron.pickDirectory();
            if (dir) {
              console.log('Selected working directory:', dir);
            }
          }
        },
      },
    ];
  }
}
