import type { Intent, AssistantModule, ContextSnapshot } from '../types';
import { ModuleRegistry } from '../registry';
import { v4 as uuid } from 'uuid';

class IntentRouterImpl {
  /**
   * Route a user message to the appropriate module(s).
   * Uses keyword matching first (fast), falls back to AI classification if available.
   */
  route(message: string): Intent {
    const intent: Intent = {
      id: uuid(),
      raw: message,
      modules: [],
      confidence: 0,
    };

    const lower = message.toLowerCase();
    const modules = ModuleRegistry.getEnabled();
    const scores: Array<{ id: string; score: number }> = [];

    for (const mod of modules) {
      let score = 0;
      for (const trigger of mod.triggers) {
        if (lower.includes(trigger.toLowerCase())) {
          score += 1;
        }
      }
      if (score > 0) scores.push({ id: mod.id, score });
    }

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    if (scores.length > 0) {
      intent.modules = scores.map(s => s.id);
      intent.type = scores[0].id;
      intent.confidence = Math.min(scores[0].score / 3, 1);
    } else {
      // Default to chat module
      intent.modules = ['chat'];
      intent.type = 'chat';
      intent.confidence = 0.5;
    }

    return intent;
  }

  /**
   * Execute intent through the matching module(s).
   * Primary module handles, others can contribute context.
   */
  async execute(intent: Intent, context: ContextSnapshot) {
    const primaryId = intent.modules?.[0] || 'chat';
    const primary = ModuleRegistry.get(primaryId);

    if (!primary) {
      const chat = ModuleRegistry.get('chat');
      if (chat) return chat.handle(intent, context);
      return { success: false, error: 'No module available' };
    }

    return primary.handle(intent, context);
  }

  /**
   * Build a system prompt that includes context for AI routing.
   */
  buildRoutingPrompt(modules: AssistantModule[]): string {
    const moduleList = modules.map(m =>
      `- ${m.id}: ${m.description} (triggers: ${m.triggers.join(', ')})`
    ).join('\n');

    return `You are an intent router. Given a user message, determine which module(s) should handle it.

Available modules:
${moduleList}

Respond with JSON: {"modules": ["module_id"], "type": "primary_module_id"}
If unsure, use "chat".`;
  }
}

export const IntentRouter = new IntentRouterImpl();
