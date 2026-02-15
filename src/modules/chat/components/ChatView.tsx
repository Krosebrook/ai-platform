import React from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useChat } from '../hooks/useChat';
import type { Conversation } from '../../../core/types';

interface Props {
  conversation: Conversation | undefined;
  onRefresh: () => void;
}

export const ChatView: React.FC<Props> = ({ conversation, onRefresh }) => {
  const { isStreaming, streamContent, error, sendMessage, stopGeneration } = useChat(
    conversation?.id || null
  );

  const handleSend = async (content: string) => {
    await sendMessage(content);
    onRefresh();
  };

  if (!conversation) {
    return (
      <div className="chat-view chat-empty">
        <div className="empty-state">
          <h2>AI Platform</h2>
          <p>Select a conversation or create a new one to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-view">
      <div className="chat-header">
        <h3>{conversation.title}</h3>
        <span className="chat-model">{conversation.model}</span>
      </div>

      <MessageList
        messages={conversation.messages}
        streamContent={streamContent}
        isStreaming={isStreaming}
      />

      {error && (
        <div className="chat-error">
          <p>{error}</p>
        </div>
      )}

      <MessageInput
        onSend={handleSend}
        onStop={stopGeneration}
        isStreaming={isStreaming}
      />
    </div>
  );
};
