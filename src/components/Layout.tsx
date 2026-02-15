import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { CommandPalette } from './CommandPalette';
import { Settings } from './Settings';
import { ChatView } from '../modules/chat/components/ChatView';
import { ConversationList } from '../modules/chat/components/ConversationList';
import { BrowserPanel } from '../modules/browser/components/BrowserPanel';
import { CoworkPanel } from '../modules/cowork/components/CoworkPanel';
import { CodePanel } from '../modules/code/components/CodePanel';
import { WriterPanel } from '../modules/writer/components/WriterPanel';
import { ResearchPanel } from '../modules/research/components/ResearchPanel';
import { VoicePanel } from '../modules/voice/components/VoicePanel';
import { WorkflowDashboard } from '../modules/workflow/components/WorkflowDashboard';
import { NoteEditor } from '../modules/notes/components/NoteEditor';
import { useConversations } from '../modules/chat/hooks/useConversations';

export const Layout: React.FC = () => {
  const [activeModule, setActiveModule] = useState('chat');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const {
    conversations, activeId, activeConversation,
    createConversation, deleteConversation, renameConversation,
    selectConversation, refresh,
  } = useConversations();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'Space') {
        e.preventDefault();
        setShowCommandPalette(v => !v);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        createConversation();
        setActiveModule('chat');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setShowSettings(v => !v);
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
        setShowSettings(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Electron IPC for global hotkey
    const cleanup = window.electron?.onToggleCommandPalette(() => {
      setShowCommandPalette(v => !v);
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cleanup?.();
    };
  }, [createConversation]);

  const renderModulePanel = useCallback(() => {
    switch (activeModule) {
      case 'chat':
        return (
          <div className="chat-layout">
            <ConversationList
              conversations={conversations}
              activeId={activeId}
              onSelect={selectConversation}
              onCreate={createConversation}
              onDelete={deleteConversation}
              onRename={renameConversation}
            />
            <ChatView conversation={activeConversation} onRefresh={refresh} />
          </div>
        );
      case 'browser':
        return <BrowserPanel />;
      case 'cowork':
        return <CoworkPanel />;
      case 'code':
        return <CodePanel />;
      case 'writer':
        return <WriterPanel />;
      case 'research':
        return <ResearchPanel />;
      case 'voice':
        return <VoicePanel />;
      case 'workflow':
        return <WorkflowDashboard />;
      case 'notes':
        return <NoteEditor />;
      case 'calendar':
        return <PlaceholderPanel name="Calendar" desc="Connect Google Calendar or Outlook in Settings." />;
      case 'data':
        return <PlaceholderPanel name="Data Pipeline" desc="Import CSV/JSON files to analyze and visualize." />;
      case 'automation':
        return <PlaceholderPanel name="Automation" desc="Create if/then recipes to automate tasks." />;
      case 'email':
        return <PlaceholderPanel name="Email" desc="Connect Gmail or Outlook in Settings for inbox management." />;
      case 'vision':
        return <PlaceholderPanel name="Vision" desc="Screenshot analysis and OCR (Electron only)." />;
      default:
        return <PlaceholderPanel name={activeModule} desc="Module loading..." />;
    }
  }, [activeModule, conversations, activeId, activeConversation, selectConversation, createConversation, deleteConversation, renameConversation, refresh]);

  return (
    <div className="app-layout">
      <Sidebar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        onOpenSettings={() => setShowSettings(true)}
      />

      <main className="main-content">
        {renderModulePanel()}
      </main>

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onSelectModule={(id) => { setActiveModule(id); setShowCommandPalette(false); }}
      />

      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
};

// Simple placeholder for modules not yet fully built
const PlaceholderPanel: React.FC<{ name: string; desc: string }> = ({ name, desc }) => (
  <div className="placeholder-panel">
    <h3>{name}</h3>
    <p className="module-desc">{desc}</p>
    <p className="coming-soon">Full UI coming soon. Module tools are available via the command palette and chat.</p>
  </div>
);
