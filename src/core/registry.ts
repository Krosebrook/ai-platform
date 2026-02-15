import type { AssistantModule, ModuleConfig, ToolDefinition, QuickAction } from './types';

const modules = new Map<string, AssistantModule>();
const configs = new Map<string, ModuleConfig>();

export const ModuleRegistry = {
  register(module: AssistantModule, config?: Partial<ModuleConfig>) {
    modules.set(module.id, module);
    configs.set(module.id, {
      enabled: true,
      settings: {},
      ...config,
    });
  },

  unregister(id: string) {
    modules.delete(id);
    configs.delete(id);
  },

  get(id: string): AssistantModule | undefined {
    return modules.get(id);
  },

  getAll(): AssistantModule[] {
    return Array.from(modules.values());
  },

  getEnabled(): AssistantModule[] {
    return Array.from(modules.values()).filter(m => configs.get(m.id)?.enabled !== false);
  },

  getConfig(id: string): ModuleConfig | undefined {
    return configs.get(id);
  },

  setConfig(id: string, config: Partial<ModuleConfig>) {
    const existing = configs.get(id) || { enabled: true, settings: {} };
    configs.set(id, { ...existing, ...config });
  },

  getAllTools(): ToolDefinition[] {
    return this.getEnabled().flatMap(m => m.getTools?.() || []);
  },

  getAllQuickActions(): QuickAction[] {
    return this.getEnabled().flatMap(m => m.getQuickActions?.() || []);
  },

  async initAll(): Promise<void> {
    for (const mod of this.getEnabled()) {
      const config = configs.get(mod.id)!;
      await mod.init(config);
    }
  },

  async destroyAll(): Promise<void> {
    for (const mod of modules.values()) {
      await mod.destroy();
    }
  },
};
