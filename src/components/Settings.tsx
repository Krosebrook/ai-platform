import React, { useState, useEffect } from 'react';
import { PreferencesStore } from '../core/memory/PreferencesStore';
import { AIProviderRegistry } from '../core/ai/AIProvider';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const Settings: React.FC<Props> = ({ isOpen, onClose }) => {
  const [anthropicKey, setAnthropicKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [defaultModel, setDefaultModel] = useState('claude-sonnet-4-5-20250929');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAnthropicKey(PreferencesStore.getApiKey('anthropic') || '');
      setOpenaiKey(PreferencesStore.getApiKey('openai') || '');
      setOllamaUrl(PreferencesStore.get('ollamaUrl', 'http://localhost:11434'));
      setDefaultModel(PreferencesStore.getDefaultModel());
      setTheme(PreferencesStore.getTheme());
    }
  }, [isOpen]);

  const handleSave = () => {
    if (anthropicKey) PreferencesStore.setApiKey('anthropic', anthropicKey);
    if (openaiKey) PreferencesStore.setApiKey('openai', openaiKey);
    PreferencesStore.set('ollamaUrl', ollamaUrl);
    PreferencesStore.setDefaultModel(defaultModel);
    PreferencesStore.setTheme(theme);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!isOpen) return null;

  const allModels = AIProviderRegistry.getAllModels();

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button onClick={onClose} className="btn-close">x</button>
        </div>

        <div className="settings-content">
          <section>
            <h3>AI Providers</h3>

            <div className="form-group">
              <label>Anthropic API Key</label>
              <input
                type="password"
                value={anthropicKey}
                onChange={e => setAnthropicKey(e.target.value)}
                placeholder="sk-ant-..."
              />
            </div>

            <div className="form-group">
              <label>OpenAI API Key</label>
              <input
                type="password"
                value={openaiKey}
                onChange={e => setOpenaiKey(e.target.value)}
                placeholder="sk-..."
              />
            </div>

            <div className="form-group">
              <label>Ollama URL</label>
              <input
                type="text"
                value={ollamaUrl}
                onChange={e => setOllamaUrl(e.target.value)}
                placeholder="http://localhost:11434"
              />
            </div>

            <div className="form-group">
              <label>Default Model</label>
              <select value={defaultModel} onChange={e => setDefaultModel(e.target.value)}>
                {allModels.length > 0
                  ? allModels.map(m => (
                      <option key={m.model} value={m.model}>
                        {m.model} ({m.provider})
                      </option>
                    ))
                  : (
                    <>
                      <option value="claude-sonnet-4-5-20250929">Claude Sonnet 4.5</option>
                      <option value="claude-opus-4-6">Claude Opus 4.6</option>
                      <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5</option>
                      <option value="gpt-4o">GPT-4o</option>
                      <option value="gpt-4o-mini">GPT-4o Mini</option>
                    </>
                  )
                }
              </select>
            </div>
          </section>

          <section>
            <h3>Appearance</h3>
            <div className="form-group">
              <label>Theme</label>
              <select value={theme} onChange={e => setTheme(e.target.value as 'light' | 'dark' | 'system')}>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System</option>
              </select>
            </div>
          </section>

          <section>
            <h3>Keyboard Shortcuts</h3>
            <div className="shortcut-list">
              <div className="shortcut"><kbd>Ctrl+Shift+Space</kbd> Command Palette</div>
              <div className="shortcut"><kbd>Ctrl+N</kbd> New Chat</div>
              <div className="shortcut"><kbd>Ctrl+,</kbd> Settings</div>
            </div>
          </section>
        </div>

        <div className="settings-footer">
          <button onClick={handleSave} className="btn btn-primary">
            {saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};
