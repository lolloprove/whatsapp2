import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { apiRequest } from '../../services/api';
import type { UserProfile } from '../../types/chat';
import { Avatar } from '../common/Avatar';
import { BottomSheet } from '../common/BottomSheet';
import { Search, MessageSquarePlus, User, Loader2 } from 'lucide-react';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { startNewChatWithUser } = useChat();

  const [query, setQuery] = useState('');
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await apiRequest(`/users/search?q=${encodeURIComponent(query)}`, {}, user);
        if (res.data) {
          // Filter out current user from new chat contact list
          setUsersList(res.data.filter((u: UserProfile) => u.id !== user.id));
        }
      } catch (err) {
        console.warn('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(fetchUsers, 150);
    return () => clearTimeout(timeout);
  }, [isOpen, query, user]);

  const handleSelectUser = async (targetUser: UserProfile) => {
    await startNewChatWithUser(targetUser);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Nuova chat" maxHeight="85dvh">
      {/* Search Bar */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--panel-bg)'
        }}
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
          <Search size={18} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Cerca per nome o username..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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
        </div>
      </div>

      {/* Contacts List */}
      <div style={{ padding: '8px 0', minHeight: '200px' }}>
        {loading ? (
          <div
            style={{
              padding: '32px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: 'var(--text-secondary)',
              fontSize: '13px'
            }}
          >
            <Loader2 size={22} className="animate-spin" color="var(--brand-mint)" />
            <span>Ricerca contatti...</span>
          </div>
        ) : usersList.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: '14px'
            }}
          >
            <User size={32} style={{ margin: '0 auto 10px auto', opacity: 0.4 }} />
            <p>Nessun contatto trovato.</p>
          </div>
        ) : (
          usersList.map((target) => (
            <div
              key={target.id}
              onClick={() => handleSelectUser(target)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 18px',
                gap: '14px',
                cursor: 'pointer',
                transition: 'background 0.12s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--panel-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Avatar
                src={target.avatarUrl}
                name={target.fullName}
                size="md"
                isOnline={target.isOnline}
                showStatus
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>
                  {target.fullName}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {target.statusMessage || `@${target.username}`}
                </div>
              </div>
              <MessageSquarePlus size={18} color="var(--brand-mint)" />
            </div>
          ))
        )}
      </div>
    </BottomSheet>
  );
};
