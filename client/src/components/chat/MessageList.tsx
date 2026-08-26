import React, { useEffect, useRef } from 'react';
import type { ChatMessage } from '../../types/chat';
import { MessageBubble } from './MessageBubble';
import { Loader2 } from 'lucide-react';

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId?: string;
  isLoading: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  isLoading
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)'
        }}
      >
        <Loader2 size={24} className="animate-spin" color="var(--brand-mint)" />
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        padding: '14px 10px 8px 10px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 2
      }}
    >
      {messages.length === 0 ? (
        <div
          style={{
            margin: 'auto',
            padding: '8px 18px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--brand-mint-soft)',
            color: 'var(--brand-mint)',
            fontSize: '12.5px',
            fontWeight: 600,
            textAlign: 'center'
          }}
        >
          Nessun messaggio: scrivi il primo!
        </div>
      ) : (
        messages.map((msg) => (
          <MessageBubble
            key={msg.id || msg.tempId}
            message={msg}
            isMe={msg.senderId === currentUserId}
          />
        ))
      )}
      <div ref={bottomRef} style={{ height: '4px', flexShrink: 0 }} />
    </div>
  );
};
