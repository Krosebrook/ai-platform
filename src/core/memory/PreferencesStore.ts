class PreferencesStoreImpl {
  private prefs: Record<string, unknown> = {};
  private storageKey = 'ai-platform-preferences';

  async init() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) this.prefs = JSON.parse(raw);
    } catch { /* fresh start */ }
  }

  private persist() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.prefs));
  }

  get<T = unknown>(key: string, defaultValue?: T): T {
    return (this.prefs[key] as T) ?? defaultValue as T;
  }

  set(key: string, value: unknown) {
    this.prefs[key] = value;
    this.persist();
  }

  delete(key: string) {
    delete this.prefs[key];
    this.persist();
  }

  getAll(): Record<string, unknown> {
    return { ...this.prefs };
  }

  // Convenience accessors
  getTheme(): 'light' | 'dark' | 'system' {
    return this.get('theme', 'dark');
  }

  setTheme(theme: 'light' | 'dark' | 'system') {
    this.set('theme', theme);
  }

  getDefaultModel(): string {
    return this.get('defaultModel', 'claude-sonnet-4-5-20250929');
  }

  setDefaultModel(model: string) {
    this.set('defaultModel', model);
  }

  getApiKey(provider: string): string | undefined {
    return this.get(`apiKey.${provider}`);
  }

  setApiKey(provider: string, key: string) {
    this.set(`apiKey.${provider}`, key);
  }
}

export const PreferencesStore = new PreferencesStoreImpl();
