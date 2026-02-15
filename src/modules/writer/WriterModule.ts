import type { AssistantModule, Intent, ContextSnapshot, ModuleResult, ModuleConfig, ToolDefinition, QuickAction } from '../../core/types';
import { AIProviderRegistry } from '../../core/ai/AIProvider';
import { PreferencesStore } from '../../core/memory/PreferencesStore';

export class WriterModule implements AssistantModule {
  id = 'writer';
  name = 'Writer';
  description = 'Long-form writing, editing, tone adjustment, and content creation';
  version = '1.0.0';
  triggers = ['write', 'draft', 'blog', 'article', 'email', 'rewrite', 'proofread', 'grammar', 'tone', 'summarize', 'expand'];

  async init(_config: ModuleConfig) {}
  async destroy() {}

  canHandle(intent: Intent): boolean {
    return this.triggers.some(t => intent.raw.toLowerCase().includes(t));
  }

  async handle(intent: Intent, context: ContextSnapshot): Promise<ModuleResult> {
    return { success: true, message: 'Writer module ready.', ui: 'panel' };
  }

  getTools(): ToolDefinition[] {
    return [
      { name: 'writer.draft', description: 'Generate content from a prompt', inputSchema: { type: 'object', properties: { prompt: { type: 'string' }, tone: { type: 'string' }, template: { type: 'string' } }, required: ['prompt'] } },
      { name: 'writer.rewrite', description: 'Rewrite text with a tone/style', inputSchema: { type: 'object', properties: { text: { type: 'string' }, tone: { type: 'string' } }, required: ['text'] } },
      { name: 'writer.proofread', description: 'Check grammar and style', inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } },
      { name: 'writer.summarize', description: 'Summarize long text', inputSchema: { type: 'object', properties: { text: { type: 'string' }, length: { type: 'string' } }, required: ['text'] } },
      { name: 'writer.expand', description: 'Expand bullet points into prose', inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } },
    ];
  }

  async executeTool(name: string, args: Record<string, unknown>) {
    const model = PreferencesStore.getDefaultModel();
    const prompts: Record<string, string> = {
      'writer.draft': `Write content based on this prompt. Tone: ${args.tone || 'professional'}.\n\n${args.prompt}`,
      'writer.rewrite': `Rewrite the following text in a ${args.tone || 'professional'} tone:\n\n${args.text}`,
      'writer.proofread': `Proofread and correct the following text. List all grammar and style issues:\n\n${args.text}`,
      'writer.summarize': `Summarize the following text${args.length ? ` in ${args.length}` : ''}:\n\n${args.text}`,
      'writer.expand': `Expand these bullet points into well-written prose paragraphs:\n\n${args.text}`,
    };

    const prompt = prompts[name];
    if (!prompt) return { success: false, error: `Unknown tool: ${name}` };

    try {
      const response = await AIProviderRegistry.chat({
        model,
        messages: [{ role: 'user', content: prompt }],
        system: 'You are an expert writer and editor. Produce high-quality, polished content.',
      });
      return { success: true, data: response.content };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  getQuickActions(): QuickAction[] {
    return [
      { id: 'writer.draft', label: 'Draft', icon: 'pen-tool', description: 'Start a new draft', moduleId: this.id, action: () => {} },
      { id: 'writer.proofread', label: 'Proofread', icon: 'spell-check', description: 'Check clipboard text', moduleId: this.id, action: () => {} },
    ];
  }
}
