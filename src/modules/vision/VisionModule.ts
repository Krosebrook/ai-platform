import type { AssistantModule, Intent, ContextSnapshot, ModuleResult, ModuleConfig, ToolDefinition, QuickAction } from '../../core/types';
import { isElectron } from '../../core/platform';

export class VisionModule implements AssistantModule {
  id = 'vision';
  name = 'Vision';
  description = 'Screenshot analysis, OCR, screen reading, and visual understanding';
  version = '1.0.0';
  triggers = ['screenshot', 'screen', 'ocr', 'image', 'what\'s on', 'analyze image', 'vision'];

  async init(_config: ModuleConfig) {}
  async destroy() {}

  canHandle(intent: Intent): boolean {
    if (!isElectron()) return false;
    return this.triggers.some(t => intent.raw.toLowerCase().includes(t));
  }

  async handle(intent: Intent, _context: ContextSnapshot): Promise<ModuleResult> {
    return { success: true, message: 'Vision module ready. Capture screenshots and analyze images.', ui: 'panel' };
  }

  getTools(): ToolDefinition[] {
    return [
      { name: 'vision.screenshot', description: 'Capture screen/window/region', inputSchema: { type: 'object', properties: { target: { type: 'string', enum: ['screen', 'window', 'region'] } } } },
      { name: 'vision.analyze', description: 'AI analysis of an image', inputSchema: { type: 'object', properties: { image: { type: 'string' }, prompt: { type: 'string' } } } },
      { name: 'vision.ocr', description: 'Extract text from an image', inputSchema: { type: 'object', properties: { image: { type: 'string' } } } },
      { name: 'vision.describe', description: 'Generate text description of an image', inputSchema: { type: 'object', properties: { image: { type: 'string' } } } },
    ];
  }

  async executeTool(name: string, args: Record<string, unknown>) {
    return { success: true, data: { tool: name, args, message: 'Vision tools require Electron desktop capturer' } };
  }

  getQuickActions(): QuickAction[] {
    return [
      { id: 'vision.screenshot', label: 'Screenshot', icon: 'monitor', description: 'Capture and analyze screen', moduleId: this.id, action: () => {} },
    ];
  }
}
