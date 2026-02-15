import React, { useState, useRef, useCallback } from 'react';

interface Props {
  onSend: (message: string) => void;
  onStop?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
}

export const MessageInput: React.FC<Props> = ({ onSend, onStop, isStreaming, disabled }) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleInput = useCallback(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
    }
  }, []);

  return (
    <div className="message-input">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        placeholder="Type a message... (Shift+Enter for new line)"
        disabled={disabled}
        rows={1}
      />
      <div className="input-actions">
        {isStreaming ? (
          <button onClick={onStop} className="btn btn-stop" title="Stop generation">
            Stop
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="btn btn-send"
            disabled={!value.trim() || disabled}
            title="Send message"
          >
            Send
          </button>
        )}
      </div>
    </div>
  );
};
