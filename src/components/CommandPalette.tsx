import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ModuleRegistry } from '../core/registry';
import type { QuickAction } from '../core/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectModule: (id: string) => void;
}

export const CommandPalette: React.FC<Props> = ({ isOpen, onClose, onSelectModule }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const allActions = ModuleRegistry.getAllQuickActions();
  const moduleActions = ModuleRegistry.getEnabled().map(m => ({
    id: `module.${m.id}`,
    label: m.name,
    description: m.description,
    icon: '',
    moduleId: m.id,
    action: () => onSelectModule(m.id),
  }));

  const combined = [...moduleActions, ...allActions];
  const filtered = query
    ? combined.filter(a =>
        a.label.toLowerCase().includes(query.toLowerCase()) ||
        a.description?.toLowerCase().includes(query.toLowerCase())
      )
    : combined;

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      filtered[selectedIndex].action();
      onClose();
    }
  }, [filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={e => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
          onKeyDown={handleKeyDown}
          placeholder="Search modules and actions..."
          className="command-input"
        />

        <div className="command-results">
          {filtered.map((action, i) => (
            <button
              key={action.id}
              className={`command-item ${i === selectedIndex ? 'selected' : ''}`}
              onClick={() => { action.action(); onClose(); }}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span className="command-label">{action.label}</span>
              {action.description && (
                <span className="command-desc">{action.description}</span>
              )}
            </button>
          ))}

          {filtered.length === 0 && (
            <div className="command-empty">No matching actions</div>
          )}
        </div>

        <div className="command-footer">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
};
