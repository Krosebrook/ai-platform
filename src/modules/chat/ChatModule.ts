import type { AssistantModule, Intent, ContextSnapshot, ModuleResult, ModuleConfig, ToolDefinition, QuickAction } from '../../core/types';
import { ConversationStore } from '../../core/memory/ConversationStore';
import { AIProviderRegistry } from '../../core/ai/AIProvider';
import { ContextEngine } from '../../core/context/ContextEngine';

export class ChatModule implements AssistantModule {
  id = 'chat';
  name = 'Chat';
  description = 'General AI conversation — the default handler';
  version = '1.0.0';
  triggers = ['chat', 'talk', 'ask', 'help', 'explain', 'tell me', 'what is', 'how to'];

  async init(_config: ModuleConfig) {
    await ConversationStore.init();
  }

  async destroy() {}

  canHandle(_intent: Intent): boolean {
    return true; // Chat handles everything as fallback
  }

  async handle(intent: Intent, context: ContextSnapshot): Promise<ModuleResult> {
    try {
      // Build system prompt with context
      const systemPrompt = this.buildSystemPrompt(context);

      const response = await AIProviderRegistry.chat({
        model: 'claude-sonnet-4-5-20250929',
        system: systemPrompt,
        messages: [{ role: 'user', content: intent.raw }],
      });

      return {
        success: true,
        data: response.content,
        message: response.content,
        ui: 'chat',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private buildSystemPrompt(context: ContextSnapshot): string {
    let prompt = 'You are a helpful AI assistant. Be concise and direct.';

    if (context.time) {
      prompt += `\n\nCurrent time: ${context.time}`;
    }

    if (context.clipboard) {
      prompt += `\n\nUser's clipboard: "${context.clipboard.slice(0, 500)}"`;
    }

    return prompt;
  }

  getTools(): ToolDefinition[] {
    return [
      {
        name: 'chat.send_message',
        description: 'Send a message to the AI and get response',
        inputSchema: { type: 'object', properties: { message: { type: 'string' } }, required: ['message'] },
      },
      {
        name: 'chat.get_history',
        description: 'Retrieve conversation history',
        inputSchema: { type: 'object', properties: { conversationId: { type: 'string' } } },
      },
      {
        name: 'chat.search',
        description: 'Full-text search across all conversations',
        inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
      },
    ];
  }

  async executeTool(name: string, args: Record<string, unknown>) {
    switch (name) {
      case 'chat.search':
        return { success: true, data: ConversationStore.search(args.query as string) };
      case 'chat.get_history': {
        const conv = ConversationStore.get(args.conversationId as string);
        return conv ? { success: true, data: conv } : { success: false, error: 'Not found' };
      }
      default:
        return { success: false, error: `Unknown tool: ${name}` };
    }
  }

  getQuickActions(): QuickAction[] {
    return [
      {
        id: 'chat.new',
        label: 'New Chat',
        icon: 'message-square-plus',
        description: 'Start a new conversation',
        moduleId: this.id,
        action: () => {
          ConversationStore.create();
        },
      },
    ];
  }
}
