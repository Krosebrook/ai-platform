import React, { useState } from 'react';
import type { Conversation } from '../../../core/types';

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

export const ConversationList: React.FC<Props> = ({
  conversations, activeId, onSelect, onCreate, onDelete, onRename,
}) => {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filtered = search
    ? conversations.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase())
      )
    : conversations;

  const handleRename = (id: string) => {
    if (editTitle.trim()) {
      onRename(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="conversation-list">
      <div className="conv-list-header">
        <button onClick={onCreate} className="btn btn-new-chat">+ New Chat</button>
      </div>

      <input
        type="text"
        className="conv-search"
        placeholder="Search conversations..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="conv-items">
        {filtered.map(conv => (
          <div
            key={conv.id}
            className={`conv-item ${conv.id === activeId ? 'active' : ''}`}
            onClick={() => onSelect(conv.id)}
          >
            {editingId === conv.id ? (
              <input
                className="conv-rename-input"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onBlur={() => handleRename(conv.id)}
                onKeyDown={e => e.key === 'Enter' && handleRename(conv.id)}
                autoFocus
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <>
                <span className="conv-title">{conv.title}</span>
                <span className="conv-date">
                  {new Date(conv.updatedAt).toLocaleDateString()}
                </span>
                <div className="conv-actions" onClick={e => e.stopPropagation()}>
                  <button
                    className="btn-icon"
                    onClick={() => { setEditingId(conv.id); setEditTitle(conv.title); }}
                    title="Rename"
                  >
                    r
                  </button>
                  <button
                    className="btn-icon btn-danger"
                    onClick={() => onDelete(conv.id)}
                    title="Delete"
                  >
                    x
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="conv-empty">
            {search ? 'No matching conversations' : 'No conversations yet'}
          </div>
        )}
      </div>
    </div>
  );
};
