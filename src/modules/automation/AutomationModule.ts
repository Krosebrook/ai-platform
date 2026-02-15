import type { AssistantModule, Intent, ContextSnapshot, ModuleResult, ModuleConfig, ToolDefinition, QuickAction } from '../../core/types';
import { v4 as uuid } from 'uuid';
import { isElectron } from '../../core/platform';

interface Recipe {
  id: string;
  name: string;
  trigger: { type: 'time' | 'file_change' | 'hotkey' | 'idle' | 'manual'; config: Record<string, unknown> };
  actions: Array<{ moduleId: string; tool: string; args: Record<string, unknown> }>;
  enabled: boolean;
  lastRun?: string;
}

export class AutomationModule implements AssistantModule {
  id = 'automation';
  name = 'Automation';
  description = 'Local automation recipes — if/then rules combining signals from other modules';
  version = '1.0.0';
  triggers = ['automate', 'recipe', 'when', 'every morning', 'schedule', 'automatic', 'rule'];

  private recipes: Recipe[] = [];
  private storageKey = 'ai-platform-automations';

  async init(_config: ModuleConfig) {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) this.recipes = JSON.parse(raw);
    } catch {}
  }

  async destroy() {}

  private persist() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.recipes));
  }

  canHandle(intent: Intent): boolean {
    if (!isElectron()) return false;
    return this.triggers.some(t => intent.raw.toLowerCase().includes(t));
  }

  async handle(intent: Intent, _context: ContextSnapshot): Promise<ModuleResult> {
    return { success: true, message: `Automation: ${this.recipes.length} recipes configured.`, ui: 'panel' };
  }

  getTools(): ToolDefinition[] {
    return [
      { name: 'automation.create_recipe', description: 'Create a new automation rule', inputSchema: { type: 'object', properties: { name: { type: 'string' }, trigger: { type: 'object' }, actions: { type: 'array' } }, required: ['name', 'trigger', 'actions'] } },
      { name: 'automation.list_recipes', description: 'List active automations', inputSchema: { type: 'object', properties: {} } },
      { name: 'automation.trigger', description: 'Manually trigger a recipe', inputSchema: { type: 'object', properties: { recipeId: { type: 'string' } }, required: ['recipeId'] } },
      { name: 'automation.disable', description: 'Pause a recipe', inputSchema: { type: 'object', properties: { recipeId: { type: 'string' } }, required: ['recipeId'] } },
    ];
  }

  async executeTool(name: string, args: Record<string, unknown>) {
    switch (name) {
      case 'automation.create_recipe': {
        const recipe: Recipe = {
          id: uuid(),
          name: args.name as string,
          trigger: args.trigger as Recipe['trigger'],
          actions: args.actions as Recipe['actions'],
          enabled: true,
        };
        this.recipes.push(recipe);
        this.persist();
        return { success: true, data: recipe };
      }
      case 'automation.list_recipes':
        return { success: true, data: this.recipes };
      case 'automation.disable': {
        const recipe = this.recipes.find(r => r.id === args.recipeId);
        if (recipe) { recipe.enabled = false; this.persist(); }
        return { success: true, data: recipe };
      }
      default:
        return { success: false, error: `Unknown tool: ${name}` };
    }
  }

  getQuickActions(): QuickAction[] {
    return [
      { id: 'automation.new', label: 'New Recipe', icon: 'workflow', description: 'Create an automation recipe', moduleId: this.id, action: () => {} },
    ];
  }
}
