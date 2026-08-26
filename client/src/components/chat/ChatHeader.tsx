import React, { useState } from 'react';
import type { UserProfile } from '../../types/chat';
import { Avatar } from '../common/Avatar';
import { useChat } from '../../context/ChatContext';
import { BottomSheet } from '../common/BottomSheet';
import { ArrowLeft, MoreVertical } from 'lucide-react';

interface ChatHeaderProps {
  otherUser?: UserProfile;
  onBackMobile?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ otherUser, onBackMobile }) => {
  const { isTypingOther } = useChat();
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const user = otherUser || {
    id: 'unknown',
    username: 'user',
    fullName: 'Chat',
    avatarUrl: '',
    isOnline: false
  };

  return (
    <>
      <div
        style={{
          minHeight: '58px',
          padding: '4px 6px 4px 2px',
          background: 'var(--bg-chat-header)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
          flexShrink: 0
        }}
      >
        {/* Back + Avatar + Nome/Stato */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            minWidth: 0,
            cursor: 'pointer',
            flex: 1
          }}
          onClick={() => setIsInfoOpen(true)}
        >
          {onBackMobile && (
            <button
              type="button"
              className="btn-icon"
              onClick={(e) => {
                e.stopPropagation();
                onBackMobile();
              }}
              style={{ width: '38px', height: '38px', color: 'var(--text-primary)' }}
              aria-label="Torna alle chat"
            >
              <ArrowLeft size={22} />
            </button>
          )}

          <Avatar
            src={user.avatarUrl}
            name={user.fullName}
            size="sm"
            isOnline={user.isOnline}
            showStatus
          />

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, marginLeft: '4px' }}>
            <span
              style={{
                fontWeight: 600,
                fontSize: '15.5px',
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: '1.2',
                letterSpacing: '-0.2px'
              }}
            >
              {user.fullName}
            </span>
            <span
              style={{
                fontSize: '12px',
                color: isTypingOther || user.isOnline ? 'var(--brand-mint)' : 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {isTypingOther ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  sta digitando
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </span>
              ) : user.isOnline ? (
                'online'
              ) : (
                `@${user.username}`
              )}
            </span>
          </div>
        </div>

        {/* Unica azione reale: info contatto */}
        <button
          type="button"
          className="btn-icon"
          onClick={() => setIsInfoOpen(true)}
          title="Info contatto"
          aria-label="Info contatto"
          style={{ width: '38px', height: '38px' }}
        >
          <MoreVertical size={19} />
        </button>
      </div>

      {/* Scheda info contatto */}
      <BottomSheet
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        title="Info contatto"
      >
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <Avatar src={user.avatarUrl} name={user.fullName} size="xl" isOnline={user.isOnline} showStatus />

          <div style={{ textAlign: 'center' }}>
            <h4 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px', letterSpacing: '-0.3px' }}>
              {user.fullName}
            </h4>
            <p style={{ fontSize: '13.5px', color: 'var(--brand-mint)', fontWeight: 600 }}>
              @{user.username}
            </p>
          </div>

          <div
            style={{
              width: '100%',
              background: 'var(--panel-header)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              fontSize: '14px',
              color: 'var(--text-primary)'
            }}
          >
            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Info
            </span>
            {user.statusMessage || 'Disponibile'}
          </div>

          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12.5px',
              color: 'var(--text-muted)',
              justifyContent: 'center'
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: user.isOnline ? 'var(--brand-mint)' : 'var(--text-muted)'
              }}
            />
            {user.isOnline ? 'Online ora' : 'Non in linea'}
          </div>
        </div>
      </BottomSheet>
    </>
  );
};
