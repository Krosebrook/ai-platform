import type { AIProvider, AIRequest, AIResponse } from '../../types';
import { PreferencesStore } from '../../memory/PreferencesStore';

export const OllamaProvider: AIProvider = {
  id: 'ollama',
  name: 'Ollama (Local)',
  models: ['llama3.2', 'mistral', 'codellama', 'deepseek-r1'],

  async chat(request: AIRequest): Promise<AIResponse> {
    const baseUrl = PreferencesStore.get<string>('ollamaUrl', 'http://localhost:11434');

    const messages = [];
    if (request.system) messages.push({ role: 'system', content: request.system });
    messages.push(...request.messages.map(m => ({ role: m.role, content: m.content })));

    const resp = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.model,
        messages,
        stream: false,
        options: { temperature: request.temperature },
      }),
      signal: request.signal,
    });

    if (!resp.ok) throw new Error(`Ollama error (${resp.status})`);

    const data = await resp.json();
    return {
      content: data.message?.content || '',
      model: data.model,
      usage: {
        inputTokens: data.prompt_eval_count || 0,
        outputTokens: data.eval_count || 0,
      },
    };
  },

  async *stream(request: AIRequest): AsyncGenerator<string> {
    const baseUrl = PreferencesStore.get<string>('ollamaUrl', 'http://localhost:11434');

    const messages = [];
    if (request.system) messages.push({ role: 'system', content: request.system });
    messages.push(...request.messages.map(m => ({ role: m.role, content: m.content })));

    const resp = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.model,
        messages,
        stream: true,
        options: { temperature: request.temperature },
      }),
      signal: request.signal,
    });

    if (!resp.ok) throw new Error(`Ollama error (${resp.status})`);

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
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line);
          if (data.message?.content) yield data.message.content;
        } catch { /* skip */ }
      }
    }
  },
};
