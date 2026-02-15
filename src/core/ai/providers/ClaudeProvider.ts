import type { AIProvider, AIRequest, AIResponse } from '../../types';
import { PreferencesStore } from '../../memory/PreferencesStore';

export const ClaudeProvider: AIProvider = {
  id: 'claude',
  name: 'Anthropic Claude',
  models: [
    'claude-opus-4-6',
    'claude-sonnet-4-5-20250929',
    'claude-haiku-4-5-20251001',
  ],

  async chat(request: AIRequest): Promise<AIResponse> {
    const apiKey = PreferencesStore.getApiKey('anthropic');
    if (!apiKey) throw new Error('Anthropic API key not configured. Go to Settings to add it.');

    const body: Record<string, unknown> = {
      model: request.model,
      max_tokens: request.maxTokens || 4096,
      messages: request.messages.map(m => ({ role: m.role, content: m.content })),
    };
    if (request.system) body.system = request.system;
    if (request.temperature !== undefined) body.temperature = request.temperature;

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
      signal: request.signal,
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`Claude API error (${resp.status}): ${err}`);
    }

    const data = await resp.json();
    return {
      content: data.content?.[0]?.text || '',
      model: data.model,
      usage: {
        inputTokens: data.usage?.input_tokens || 0,
        outputTokens: data.usage?.output_tokens || 0,
      },
    };
  },

  async *stream(request: AIRequest): AsyncGenerator<string> {
    const apiKey = PreferencesStore.getApiKey('anthropic');
    if (!apiKey) throw new Error('Anthropic API key not configured.');

    const body: Record<string, unknown> = {
      model: request.model,
      max_tokens: request.maxTokens || 4096,
      stream: true,
      messages: request.messages.map(m => ({ role: m.role, content: m.content })),
    };
    if (request.system) body.system = request.system;
    if (request.temperature !== undefined) body.temperature = request.temperature;

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
      signal: request.signal,
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`Claude API error (${resp.status}): ${err}`);
    }

    const reader = resp.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') return;
          try {
            const event = JSON.parse(jsonStr);
            if (event.type === 'content_block_delta' && event.delta?.text) {
              yield event.delta.text;
            }
          } catch { /* skip malformed JSON */ }
        }
      }
    }
  },
};
