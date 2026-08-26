import React from 'react';
import type { ConversationSummary } from '../../types/chat';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { formatChatListTime } from '../../utils/dateUtils';
import { Check, CheckCheck } from 'lucide-react';

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
      <Avatar
        src={other.avatarUrl}
        name={other.fullName}
        size="md"
        isOnline={other.isOnline}
        showStatus
      />

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
              letterSpacing: '-0.2px'
            }}
          >
            {other.fullName}
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
