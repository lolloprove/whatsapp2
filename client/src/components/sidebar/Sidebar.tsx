import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { ChatListItem } from './ChatListItem';
import { NewChatModal } from './NewChatModal';
import { Logo, Wordmark } from '../common/Logo';
import { MessageSquarePlus, Search, X, MessageCircle } from 'lucide-react';

interface SidebarProps {
  onSelectChatMobile?: () => void;
}

type FilterCategory = 'all' | 'unread';

export const Sidebar: React.FC<SidebarProps> = ({ onSelectChatMobile }) => {
  const { user } = useAuth();
  const { conversations, activeConversation, selectConversation } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  const filteredConversations = conversations.filter((conv) => {
    const name = conv.otherParticipant?.fullName || '';
    const lastContent = conv.lastMessage?.translatedContent || conv.lastMessage?.originalContent || '';
    const q = searchQuery.toLowerCase();
    if (!name.toLowerCase().includes(q) && !lastContent.toLowerCase().includes(q)) return false;
    if (activeFilter === 'unread') return conv.unreadCount > 0;
    return true;
  });

  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 16px',
    borderRadius: 'var(--radius-full)',
    fontSize: '13px',
    fontWeight: 600,
    backgroundColor: active ? 'var(--brand-mint-soft)' : 'var(--panel-header)',
    color: active ? 'var(--brand-mint)' : 'var(--text-secondary)',
    border: 'none',
    flexShrink: 0
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-sidebar)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Header con brand integrato */}
      <div
        style={{
          padding: '10px 16px',
          background: 'var(--bg-sidebar)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '62px',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Logo size={32} />
          <Wordmark fontSize={21} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setShowSearchInput(!showSearchInput)}
            title="Cerca"
            aria-label="Cerca nelle chat"
            style={{ width: '40px', height: '40px' }}
          >
            <Search size={21} />
          </button>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setIsNewChatOpen(true)}
            title="Nuova chat"
            aria-label="Nuova chat"
            style={{ width: '40px', height: '40px' }}
          >
            <MessageSquarePlus size={21} />
          </button>
        </div>
      </div>

      {/* Barra di ricerca espandibile */}
      {showSearchInput && (
        <div
          style={{ padding: '4px 16px 10px 16px', background: 'var(--bg-sidebar)' }}
          className="animate-pop-in"
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--input-bg)',
              borderRadius: 'var(--radius-full)',
              padding: '8px 16px',
              gap: '10px',
              border: '1px solid var(--input-border)'
            }}
          >
            <Search size={16} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder="Cerca una chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--input-text)',
                outline: 'none',
                width: '100%',
                fontSize: '14px',
                fontFamily: 'inherit'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ color: 'var(--text-secondary)' }}
                aria-label="Cancella ricerca"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filtri */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px 12px 16px',
          background: 'var(--bg-sidebar)',
          overflowX: 'auto',
          flexShrink: 0
        }}
      >
        <button type="button" onClick={() => setActiveFilter('all')} style={pillStyle(activeFilter === 'all')}>
          Tutte
        </button>
        <button type="button" onClick={() => setActiveFilter('unread')} style={pillStyle(activeFilter === 'unread')}>
          Non lette
        </button>
      </div>

      {/* Lista conversazioni */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: '88px'
        }}
      >
        {filteredConversations.length === 0 ? (
          <div
            style={{
              padding: '64px 28px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: '14px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px'
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '22px',
                background: 'var(--brand-mint-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-mint)'
              }}
            >
              <MessageCircle size={30} />
            </div>
            <p style={{ maxWidth: '250px', lineHeight: '1.45' }}>
              {searchQuery
                ? 'Nessuna conversazione trovata.'
                : 'Nessuna chat ancora. Tocca + per iniziare una conversazione.'}
            </p>
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <ChatListItem
              key={conv.id}
              conversation={conv}
              isActive={activeConversation?.id === conv.id}
              currentUserId={user?.id}
              onClick={() => {
                selectConversation(conv);
                if (onSelectChatMobile) onSelectChatMobile();
              }}
            />
          ))
        )}
      </div>

      {/* FAB nuova chat */}
      <button
        type="button"
        className="fab-new-chat"
        onClick={() => setIsNewChatOpen(true)}
        aria-label="Nuova conversazione"
        title="Nuova conversazione"
      >
        <MessageSquarePlus size={24} />
      </button>

      <NewChatModal isOpen={isNewChatOpen} onClose={() => setIsNewChatOpen(false)} />
    </div>
  );
};
