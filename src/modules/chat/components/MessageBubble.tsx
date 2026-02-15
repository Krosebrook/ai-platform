import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ConversationMessage } from '../../../core/types';

interface Props {
  message: ConversationMessage;
}

export const MessageBubble: React.FC<Props> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`message ${isUser ? 'message-user' : 'message-assistant'}`}>
      <div className="message-header">
        <span className="message-role">{isUser ? 'You' : 'AI'}</span>
        {message.model && <span className="message-model">{message.model}</span>}
      </div>
      <div className="message-content">
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const isBlock = String(children).includes('\n');
                return isBlock ? (
                  <div className="code-block">
                    {match && <span className="code-lang">{match[1]}</span>}
                    <pre><code className={className} {...props}>{children}</code></pre>
                  </div>
                ) : (
                  <code className="inline-code" {...props}>{children}</code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
};
