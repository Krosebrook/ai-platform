import type { AssistantModule, Intent, ContextSnapshot, ModuleResult, ModuleConfig, ToolDefinition, QuickAction } from '../../core/types';
import { isElectron } from '../../core/platform';

export class DataModule implements AssistantModule {
  id = 'data';
  name = 'Data Pipeline';
  description = 'Transform, analyze, and visualize CSV/JSON data with natural language queries';
  version = '1.0.0';
  triggers = ['data', 'csv', 'json', 'excel', 'chart', 'graph', 'analyze data', 'import', 'visualize'];

  private datasets = new Map<string, { name: string; rows: Record<string, unknown>[]; columns: string[] }>();

  async init(_config: ModuleConfig) {}
  async destroy() {}

  canHandle(intent: Intent): boolean {
    if (!isElectron()) return false;
    return this.triggers.some(t => intent.raw.toLowerCase().includes(t));
  }

  async handle(intent: Intent, _context: ContextSnapshot): Promise<ModuleResult> {
    return { success: true, message: 'Data Pipeline ready. Import CSV/JSON files to analyze.', ui: 'panel' };
  }

  getTools(): ToolDefinition[] {
    return [
      { name: 'data.import', description: 'Import a data file', inputSchema: { type: 'object', properties: { path: { type: 'string' }, format: { type: 'string' } }, required: ['path'] } },
      { name: 'data.query', description: 'Natural language query on data', inputSchema: { type: 'object', properties: { query: { type: 'string' }, dataset: { type: 'string' } }, required: ['query'] } },
      { name: 'data.transform', description: 'Apply transformation', inputSchema: { type: 'object', properties: { operation: { type: 'string' }, params: { type: 'object' } }, required: ['operation'] } },
      { name: 'data.chart', description: 'Generate a chart', inputSchema: { type: 'object', properties: { type: { type: 'string' }, xAxis: { type: 'string' }, yAxis: { type: 'string' } }, required: ['type'] } },
    ];
  }

  async executeTool(name: string, args: Record<string, unknown>) {
    return { success: true, data: { tool: name, args, datasets: this.datasets.size } };
  }

  getQuickActions(): QuickAction[] {
    return [
      { id: 'data.import', label: 'Import Data', icon: 'table', description: 'Import CSV/JSON file', moduleId: this.id, action: () => {} },
    ];
  }
}
