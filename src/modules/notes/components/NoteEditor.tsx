import React, { useState } from 'react';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  updatedAt: string;
}

export const NoteEditor: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [search, setSearch] = useState('');
  const [newTag, setNewTag] = useState('');

  const createNote = () => {
    const note: Note = {
      id: Date.now().toString(),
      title: 'Untitled Note',
      content: '',
      tags: [],
      updatedAt: new Date().toISOString(),
    };
    setNotes([note, ...notes]);
    setActiveNote(note);
  };

  const updateNote = (field: keyof Note, value: string | string[]) => {
    if (!activeNote) return;
    const updated = { ...activeNote, [field]: value, updatedAt: new Date().toISOString() };
    setActiveNote(updated);
    setNotes(notes.map(n => n.id === updated.id ? updated : n));
  };

  const addTag = () => {
    if (!activeNote || !newTag.trim()) return;
    if (!activeNote.tags.includes(newTag.trim())) {
      updateNote('tags', [...activeNote.tags, newTag.trim()]);
    }
    setNewTag('');
  };

  const filtered = search
    ? notes.filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()))
    : notes;

  return (
    <div className="notes-panel">
      <div className="notes-sidebar">
        <div className="notes-header">
          <h3>Notes</h3>
          <button onClick={createNote} className="btn">+ New</button>
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search notes..."
          className="notes-search"
        />
        <div className="notes-list">
          {filtered.map(n => (
            <div
              key={n.id}
              className={`note-item ${activeNote?.id === n.id ? 'active' : ''}`}
              onClick={() => setActiveNote(n)}
            >
              <span className="note-title">{n.title}</span>
              <span className="note-date">{new Date(n.updatedAt).toLocaleDateString()}</span>
              {n.tags.length > 0 && (
                <div className="note-tags">{n.tags.map(t => <span key={t} className="tag">{t}</span>)}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="note-editor">
        {activeNote ? (
          <>
            <input
              type="text"
              value={activeNote.title}
              onChange={e => updateNote('title', e.target.value)}
              className="note-title-input"
              placeholder="Note title..."
            />
            <div className="note-tag-bar">
              {activeNote.tags.map(t => (
                <span key={t} className="tag">
                  {t}
                  <button onClick={() => updateNote('tags', activeNote.tags.filter(x => x !== t))}>x</button>
                </span>
              ))}
              <input
                type="text"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag()}
                placeholder="Add tag..."
                className="tag-input"
              />
            </div>
            <textarea
              value={activeNote.content}
              onChange={e => updateNote('content', e.target.value)}
              className="note-content"
              placeholder="Start writing in Markdown..."
            />
          </>
        ) : (
          <div className="empty-state">
            <p>Select or create a note to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};
