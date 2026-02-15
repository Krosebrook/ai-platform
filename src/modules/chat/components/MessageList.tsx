import React, { useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import type { ConversationMessage } from '../../../core/types';

interface Props {
  messages: ConversationMessage[];
  streamContent?: string;
  isStreaming?: boolean;
}

export const MessageList: React.FC<Props> = ({ messages, streamContent, isStreaming }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamContent]);

  return (
    <div className="message-list">
      {messages.length === 0 && !isStreaming && (
        <div className="empty-state">
          <h2>AI Platform</h2>
          <p>Start a conversation or use Ctrl+Shift+Space for the command palette.</p>
          <div className="quick-starters">
            {['Explain this code', 'Write a blog post', 'Research a topic', 'Help me debug'].map(s => (
              <button key={s} className="starter-chip">{s}</button>
            ))}
          </div>
        </div>
      )}

      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {isStreaming && streamContent && (
        <div className="message message-assistant">
          <div className="message-header">
            <span className="message-role">AI</span>
            <span className="streaming-indicator">typing...</span>
          </div>
          <div className="message-content">
            <ReactMarkdownLazy content={streamContent} />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

// Lazy markdown renderer for streaming
const ReactMarkdownLazy: React.FC<{ content: string }> = ({ content }) => {
  const ReactMarkdown = React.lazy(() => import('react-markdown'));
  return (
    <React.Suspense fallback={<p>{content}</p>}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </React.Suspense>
  );
};
