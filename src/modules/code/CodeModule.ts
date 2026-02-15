import type { AssistantModule, Intent, ContextSnapshot, ModuleResult, ModuleConfig, ToolDefinition, QuickAction } from '../../core/types';
import type { ProjectInfo } from './types';
import { isElectron } from '../../core/platform';

export class CodeModule implements AssistantModule {
  id = 'code';
  name = 'Code';
  description = 'Code generation, review, debugging, and git integration';
  version = '1.0.0';
  triggers = ['code', 'function', 'bug', 'debug', 'git', 'commit', 'review', 'refactor', 'test', 'programming'];

  private projectInfo: ProjectInfo | null = null;

  async init(_config: ModuleConfig) {}
  async destroy() {}

  canHandle(intent: Intent): boolean {
    return this.triggers.some(t => intent.raw.toLowerCase().includes(t));
  }

  async handle(intent: Intent, context: ContextSnapshot): Promise<ModuleResult> {
    return {
      success: true,
      message: 'Code module ready. Use tools for code generation, review, git operations, etc.',
      ui: 'panel',
    };
  }

  getTools(): ToolDefinition[] {
    return [
      {
        name: 'code.generate',
        description: 'Generate code from a description',
        inputSchema: {
          type: 'object',
          properties: { description: { type: 'string' }, language: { type: 'string' } },
          required: ['description'],
        },
      },
      {
        name: 'code.review',
        description: 'Review code for issues',
        inputSchema: { type: 'object', properties: { code: { type: 'string' } }, required: ['code'] },
      },
      {
        name: 'code.explain',
        description: 'Explain code or project structure',
        inputSchema: { type: 'object', properties: { code: { type: 'string' } }, required: ['code'] },
      },
      {
        name: 'code.git_status',
        description: 'Get git status of current project',
        inputSchema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
      },
      {
        name: 'code.git_diff',
        description: 'Get current git changes',
        inputSchema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
      },
      {
        name: 'code.suggest_commit',
        description: 'Generate a commit message from the current diff',
        inputSchema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
      },
    ];
  }

  async executeTool(name: string, args: Record<string, unknown>) {
    if (!isElectron() || !window.electron) {
      // In PWA mode, only code generation/review works
      if (!['code.generate', 'code.review', 'code.explain'].includes(name)) {
        return { success: false, error: 'Git operations require desktop app' };
      }
    }

    switch (name) {
      case 'code.git_status':
        return this.gitStatus(args.path as string);
      case 'code.git_diff':
        return this.gitDiff(args.path as string);
      default:
        return { success: true, data: { tool: name, args } };
    }
  }

  private async gitStatus(path: string) {
    const result = await window.electron!.shellExec('git status --porcelain', path);
    if (!result.success) return { success: false, error: result.error };
    return { success: true, data: result.stdout };
  }

  private async gitDiff(path: string) {
    const result = await window.electron!.shellExec('git diff', path);
    if (!result.success) return { success: false, error: result.error };
    return { success: true, data: result.stdout };
  }

  async detectProject(path: string): Promise<ProjectInfo> {
    const info: ProjectInfo = { path, name: path.split(/[/\\]/).pop() || '', type: 'unknown' };

    if (window.electron) {
      const hasPackageJson = await window.electron.fileExists(`${path}/package.json`);
      if (hasPackageJson) {
        info.type = 'node';
        const pkg = await window.electron.readFile(`${path}/package.json`);
        if (pkg.success && pkg.content) {
          try {
            const parsed = JSON.parse(pkg.content);
            info.name = parsed.name || info.name;
            if (parsed.dependencies?.next) info.framework = 'Next.js';
            else if (parsed.dependencies?.react) info.framework = 'React';
            else if (parsed.dependencies?.vue) info.framework = 'Vue';
            else if (parsed.dependencies?.svelte) info.framework = 'Svelte';
          } catch {}
        }
      }

      const branch = await window.electron.shellExec('git branch --show-current', path);
      if (branch.success) info.gitBranch = branch.stdout?.trim();
    }

    this.projectInfo = info;
    return info;
  }

  getQuickActions(): QuickAction[] {
    return [
      {
        id: 'code.git_status',
        label: 'Git Status',
        icon: 'git-branch',
        description: 'Show git status',
        moduleId: this.id,
        action: () => console.log('Git status'),
      },
    ];
  }

  getContextSignals() {
    if (!this.projectInfo) return [];
    return [{
      layer: 'session' as const,
      key: 'code.project',
      value: this.projectInfo,
      timestamp: Date.now(),
      source: 'code',
    }];
  }
}
