import type { AIProvider, AIRequest, AIResponse } from '../../types';
import { PreferencesStore } from '../../memory/PreferencesStore';

export const OpenAIProvider: AIProvider = {
  id: 'openai',
  name: 'OpenAI',
  models: ['gpt-4o', 'gpt-4o-mini', 'o1', 'o3-mini'],

  async chat(request: AIRequest): Promise<AIResponse> {
    const apiKey = PreferencesStore.getApiKey('openai');
    if (!apiKey) throw new Error('OpenAI API key not configured.');

    const messages = [];
    if (request.system) messages.push({ role: 'system', content: request.system });
    messages.push(...request.messages.map(m => ({ role: m.role, content: m.content })));

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages,
        max_completion_tokens: request.maxTokens || 4096,
        temperature: request.temperature,
      }),
      signal: request.signal,
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`OpenAI API error (${resp.status}): ${err}`);
    }

    const data = await resp.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      model: data.model,
      usage: {
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
      },
    };
  },

  async *stream(request: AIRequest): AsyncGenerator<string> {
    const apiKey = PreferencesStore.getApiKey('openai');
    if (!apiKey) throw new Error('OpenAI API key not configured.');

    const messages = [];
    if (request.system) messages.push({ role: 'system', content: request.system });
    messages.push(...request.messages.map(m => ({ role: m.role, content: m.content })));

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages,
        max_completion_tokens: request.maxTokens || 4096,
        temperature: request.temperature,
        stream: true,
      }),
      signal: request.signal,
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`OpenAI API error (${resp.status}): ${err}`);
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
            const delta = event.choices?.[0]?.delta?.content;
            if (delta) yield delta;
          } catch { /* skip */ }
        }
      }
    }
  },
};
