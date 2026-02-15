import type { ContextSignal, ContextSnapshot, ContextLayer, ConversationMessage } from '../types';
import { ModuleRegistry } from '../registry';
import { ModuleBus } from '../bus';
import { isElectron } from '../platform';

type ContextProvider = {
  layer: ContextLayer;
  key: string;
  source: string;
  fetch: () => Promise<unknown>;
  interval?: number;
};

class ContextEngineImpl {
  private signals = new Map<string, ContextSignal>();
  private providers: ContextProvider[] = [];
  private timers: ReturnType<typeof setInterval>[] = [];
  private recentMessages: ConversationMessage[] = [];

  registerProvider(provider: ContextProvider) {
    this.providers.push(provider);
  }

  async start() {
    // Register built-in providers
    this.registerProvider({
      layer: 'immediate',
      key: 'time',
      source: 'system',
      fetch: async () => new Date().toISOString(),
      interval: 1000,
    });

    if (isElectron() && window.electron) {
      this.registerProvider({
        layer: 'immediate',
        key: 'clipboard',
        source: 'system',
        fetch: async () => window.electron!.clipboardRead(),
        interval: 2000,
      });
    }

    // Collect signals from modules
    for (const mod of ModuleRegistry.getEnabled()) {
      const modSignals = mod.getContextSignals?.() || [];
      for (const signal of modSignals) {
        this.setSignal(signal);
      }
    }

    // Start periodic providers
    for (const provider of this.providers) {
      if (provider.interval) {
        const timer = setInterval(async () => {
          try {
            const value = await provider.fetch();
            this.setSignal({
              layer: provider.layer,
              key: provider.key,
              value,
              timestamp: Date.now(),
              source: provider.source,
            });
          } catch { /* ignore fetch errors */ }
        }, provider.interval);
        this.timers.push(timer);
      }

      // Initial fetch
      try {
        const value = await provider.fetch();
        this.setSignal({
          layer: provider.layer,
          key: provider.key,
          value,
          timestamp: Date.now(),
          source: provider.source,
        });
      } catch { /* ignore */ }
    }
  }

  stop() {
    this.timers.forEach(clearInterval);
    this.timers = [];
  }

  setSignal(signal: ContextSignal) {
    this.signals.set(signal.key, signal);
    ModuleBus.send('context:signal', 'context-engine', signal);
  }

  getSignal(key: string): unknown {
    return this.signals.get(key)?.value;
  }

  setRecentMessages(messages: ConversationMessage[]) {
    this.recentMessages = messages.slice(-10); // Last 10
  }

  getSnapshot(): ContextSnapshot {
    const signalEntries: Record<string, unknown> = {};
    this.signals.forEach((signal, key) => {
      signalEntries[key] = signal.value;
    });

    return {
      time: new Date().toISOString(),
      clipboard: this.signals.get('clipboard')?.value as string | undefined,
      signals: signalEntries,
      recentMessages: this.recentMessages,
    };
  }
}

export const ContextEngine = new ContextEngineImpl();
