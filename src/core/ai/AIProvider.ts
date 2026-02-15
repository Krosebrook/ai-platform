import type { AIProvider, AIRequest, AIResponse } from '../types';

const providers = new Map<string, AIProvider>();

export const AIProviderRegistry = {
  register(provider: AIProvider) {
    providers.set(provider.id, provider);
  },

  get(id: string): AIProvider | undefined {
    return providers.get(id);
  },

  getAll(): AIProvider[] {
    return Array.from(providers.values());
  },

  getAllModels(): Array<{ provider: string; model: string }> {
    const models: Array<{ provider: string; model: string }> = [];
    providers.forEach((p) => {
      p.models.forEach(m => models.push({ provider: p.id, model: m }));
    });
    return models;
  },

  /**
   * Find the provider that supports a given model.
   */
  findProvider(model: string): AIProvider | undefined {
    for (const p of providers.values()) {
      if (p.models.includes(model)) return p;
    }
    return undefined;
  },

  async chat(request: AIRequest): Promise<AIResponse> {
    const provider = this.findProvider(request.model);
    if (!provider) throw new Error(`No provider for model: ${request.model}`);
    return provider.chat(request);
  },

  async *stream(request: AIRequest): AsyncGenerator<string> {
    const provider = this.findProvider(request.model);
    if (!provider) throw new Error(`No provider for model: ${request.model}`);
    yield* provider.stream(request);
  },
};
