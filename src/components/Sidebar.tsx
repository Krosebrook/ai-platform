import React from 'react';

interface ModuleInfo {
  id: string;
  name: string;
  icon: string;
}

const MODULES: ModuleInfo[] = [
  { id: 'chat', name: 'Chat', icon: '💬' },
  { id: 'browser', name: 'Browser', icon: '🌐' },
  { id: 'cowork', name: 'Cowork', icon: '📁' },
  { id: 'code', name: 'Code', icon: '💻' },
  { id: 'writer', name: 'Writer', icon: '✍️' },
  { id: 'research', name: 'Research', icon: '🔍' },
  { id: 'voice', name: 'Voice', icon: '🎤' },
  { id: 'workflow', name: 'Workflows', icon: '⚡' },
  { id: 'vision', name: 'Vision', icon: '👁️' },
  { id: 'notes', name: 'Notes', icon: '📝' },
  { id: 'calendar', name: 'Calendar', icon: '📅' },
  { id: 'data', name: 'Data', icon: '📊' },
  { id: 'automation', name: 'Automation', icon: '🤖' },
  { id: 'email', name: 'Email', icon: '✉️' },
];

interface Props {
  activeModule: string;
  onSelectModule: (id: string) => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<Props> = ({ activeModule, onSelectModule, onOpenSettings }) => {
  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-text">AI</span>
      </div>

      <div className="sidebar-modules">
        {MODULES.map(mod => (
          <button
            key={mod.id}
            className={`sidebar-item ${activeModule === mod.id ? 'active' : ''}`}
            onClick={() => onSelectModule(mod.id)}
            title={mod.name}
          >
            <span className="sidebar-icon">{mod.icon}</span>
            <span className="sidebar-label">{mod.name}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-footer">
        <button className="sidebar-item" onClick={onOpenSettings} title="Settings">
          <span className="sidebar-icon">⚙️</span>
          <span className="sidebar-label">Settings</span>
        </button>
      </div>
    </nav>
  );
};
