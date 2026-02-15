import { useState, useCallback, useRef } from 'react';
import { AIProviderRegistry } from '../../../core/ai/AIProvider';
import { ConversationStore } from '../../../core/memory/ConversationStore';
import { ContextEngine } from '../../../core/context/ContextEngine';
import { PreferencesStore } from '../../../core/memory/PreferencesStore';
import type { ConversationMessage } from '../../../core/types';

export function useChat(conversationId: string | null) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!conversationId || !content.trim()) return;

    setError(null);
    setIsStreaming(true);
    setStreamContent('');

    // Add user message
    ConversationStore.addMessage(conversationId, 'user', content);

    const conv = ConversationStore.get(conversationId);
    if (!conv) return;

    // Update context engine with recent messages
    ContextEngine.setRecentMessages(conv.messages);

    // Build messages for API
    const context = ContextEngine.getSnapshot();
    let systemPrompt = conv.systemPrompt || 'You are a helpful AI assistant. Be concise, accurate, and use markdown formatting.';
    if (context.time) systemPrompt += `\n\nCurrent time: ${context.time}`;

    const messages = conv.messages.slice(-20).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const model = conv.model || PreferencesStore.getDefaultModel();
    abortRef.current = new AbortController();

    try {
      let full = '';
      const stream = AIProviderRegistry.stream({
        model,
        system: systemPrompt,
        messages,
        signal: abortRef.current.signal,
      });

      for await (const chunk of stream) {
        full += chunk;
        setStreamContent(full);
      }

      // Save assistant message
      ConversationStore.addMessage(conversationId, 'assistant', full, model);
      setStreamContent('');
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [conversationId]);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { isStreaming, streamContent, error, sendMessage, stopGeneration };
}
