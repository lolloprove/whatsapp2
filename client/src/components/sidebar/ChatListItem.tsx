import React from 'react';
import type { ConversationSummary } from '../../types/chat';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { formatChatListTime } from '../../utils/dateUtils';
import { Check, CheckCheck, Star } from 'lucide-react';

interface ChatListItemProps {
  conversation: ConversationSummary;
  isActive: boolean;
  onClick: () => void;
  currentUserId?: string;
}

export const ChatListItem: React.FC<ChatListItemProps> = ({
  conversation,
  isActive,
  onClick,
  currentUserId
}) => {
  const other = conversation.otherParticipant || {
    id: 'unknown',
    username: 'unknown',
    fullName: 'Chat',
    avatarUrl: '',
    isOnline: false
  };

  const lastMsg = conversation.lastMessage;
  const isMeSender = lastMsg?.senderId === currentUserId;
  const lastContent = lastMsg?.translatedContent || lastMsg?.originalContent || '';
  const hasUnread = conversation.unreadCount > 0;
  const isSystemContact = other.isSystem === true;

  return (
    <div
      onClick={onClick}
      role="button"
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '11px 16px',
        gap: '13px',
        cursor: 'pointer',
        backgroundColor: isActive ? 'var(--panel-active)' : 'transparent',
        transition: 'background-color 0.12s ease'
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = 'var(--panel-hover)';
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {/* Anello dorato discreto per il contatto di sistema */}
      <div
        style={
          isSystemContact
            ? {
                display: 'inline-flex',
                borderRadius: '50%',
                boxShadow: '0 0 0 2px var(--brand-gold), 0 0 10px rgba(212, 175, 55, 0.28)',
                flexShrink: 0
              }
            : { display: 'inline-flex', flexShrink: 0 }
        }
      >
        <Avatar
          src={other.avatarUrl}
          name={other.fullName}
          size="md"
          isOnline={other.isOnline}
          showStatus
        />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '2px'
          }}
        >
          <span
            style={{
              fontWeight: hasUnread ? 700 : 600,
              fontSize: '15.5px',
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              letterSpacing: '-0.2px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              minWidth: 0
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{other.fullName}</span>
            {isSystemContact && (
              <Star
                size={13}
                fill="var(--brand-gold)"
                color="var(--brand-gold)"
                style={{ flexShrink: 0 }}
                aria-label="Contatto ufficiale"
              />
            )}
          </span>
          {lastMsg && (
            <span
              style={{
                fontSize: '12px',
                flexShrink: 0,
                marginLeft: '8px',
                color: hasUnread ? 'var(--brand-mint)' : 'var(--text-secondary)',
                fontWeight: hasUnread ? 700 : 400
              }}
            >
              {formatChatListTime(lastMsg.createdAt)}
            </span>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13.5px',
              color: hasUnread ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: hasUnread ? 600 : 400,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flex: 1
            }}
          >
            {isMeSender && lastMsg && (
              <span
                style={{
                  display: 'inline-flex',
                  color: lastMsg.status === 'read' ? 'var(--tick-read)' : 'var(--text-secondary)',
                  flexShrink: 0
                }}
              >
                {lastMsg.status === 'read' || lastMsg.status === 'delivered' ? (
                  <CheckCheck size={15} />
                ) : (
                  <Check size={15} />
                )}
              </span>
            )}
            <span
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {lastContent || 'Nuova conversazione'}
            </span>
          </div>

          <Badge count={conversation.unreadCount} variant="unread" />
        </div>
      </div>
    </div>
  );
};
