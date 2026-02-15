import type { AssistantModule, Intent, ContextSnapshot, ModuleResult, ModuleConfig, ToolDefinition, QuickAction } from '../../core/types';

interface SavedWorkflow {
  id: string;
  name: string;
  webhookUrl: string;
  description?: string;
  lastRun?: string;
  schedule?: string;
}

export class WorkflowModule implements AssistantModule {
  id = 'workflow';
  name = 'Workflow';
  description = 'Trigger, monitor, and orchestrate external automations (Make, n8n, Zapier)';
  version = '1.0.0';
  triggers = ['workflow', 'webhook', 'automate', 'trigger', 'make', 'zapier', 'n8n'];

  private workflows: SavedWorkflow[] = [];
  private storageKey = 'ai-platform-workflows';

  async init(_config: ModuleConfig) {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) this.workflows = JSON.parse(raw);
    } catch {}
  }

  async destroy() {}

  private persist() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.workflows));
  }

  canHandle(intent: Intent): boolean {
    return this.triggers.some(t => intent.raw.toLowerCase().includes(t));
  }

  async handle(intent: Intent, _context: ContextSnapshot): Promise<ModuleResult> {
    return { success: true, message: `Workflow module: ${this.workflows.length} workflows configured.`, ui: 'panel' };
  }

  getTools(): ToolDefinition[] {
    return [
      { name: 'workflow.trigger', description: 'Trigger a webhook with payload', inputSchema: { type: 'object', properties: { webhookUrl: { type: 'string' }, payload: { type: 'object' } }, required: ['webhookUrl'] } },
      { name: 'workflow.status', description: 'Check workflow status', inputSchema: { type: 'object', properties: { statusUrl: { type: 'string' } }, required: ['statusUrl'] } },
      { name: 'workflow.list', description: 'List configured workflows', inputSchema: { type: 'object', properties: {} } },
    ];
  }

  async executeTool(name: string, args: Record<string, unknown>) {
    switch (name) {
      case 'workflow.trigger': {
        try {
          const resp = await fetch(args.webhookUrl as string, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(args.payload || {}),
          });
          const data = await resp.json();
          return { success: true, data };
        } catch (err: any) {
          return { success: false, error: err.message };
        }
      }
      case 'workflow.list':
        return { success: true, data: this.workflows };
      default:
        return { success: false, error: `Unknown tool: ${name}` };
    }
  }

  getQuickActions(): QuickAction[] {
    return this.workflows.map(w => ({
      id: `workflow.run.${w.id}`,
      label: w.name,
      icon: 'zap',
      description: w.description || `Trigger ${w.name}`,
      moduleId: this.id,
      action: () => { this.executeTool('workflow.trigger', { webhookUrl: w.webhookUrl }); },
    }));
  }
}
