import { useState, useCallback, useEffect } from 'react';
import { ConversationStore } from '../../../core/memory/ConversationStore';
import { PreferencesStore } from '../../../core/memory/PreferencesStore';
import type { Conversation } from '../../../core/types';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setConversations(ConversationStore.getAll());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createConversation = useCallback((title?: string) => {
    const model = PreferencesStore.getDefaultModel();
    const conv = ConversationStore.create(title, model);
    setActiveId(conv.id);
    refresh();
    return conv;
  }, [refresh]);

  const deleteConversation = useCallback((id: string) => {
    ConversationStore.delete(id);
    if (activeId === id) setActiveId(null);
    refresh();
  }, [activeId, refresh]);

  const renameConversation = useCallback((id: string, title: string) => {
    ConversationStore.update(id, { title });
    refresh();
  }, [refresh]);

  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const activeConversation = activeId ? ConversationStore.get(activeId) : undefined;

  return {
    conversations,
    activeId,
    activeConversation,
    createConversation,
    deleteConversation,
    renameConversation,
    selectConversation,
    refresh,
  };
}
