import React from 'react';
import { MessageCircle, Settings } from 'lucide-react';
import { Badge } from '../common/Badge';

export type MainTabType = 'chats' | 'settings';

interface BottomTabBarProps {
  activeTab: MainTabType;
  onChangeTab: (tab: MainTabType) => void;
  unreadChatCount: number;
}

interface TabDef {
  id: MainTabType;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}

const TABS: TabDef[] = [
  { id: 'chats', label: 'Chat', icon: MessageCircle },
  { id: 'settings', label: 'Impostazioni', icon: Settings }
];

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onChangeTab,
  unreadChatCount
}) => {
  return (
    <nav
      style={{
        background: 'var(--panel-header)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'space-around',
        zIndex: 30,
        position: 'relative',
        flexShrink: 0,
        padding: '6px 12px 8px 12px',
        gap: '8px'
      }}
      className="safe-bottom"
      aria-label="Navigazione principale"
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChangeTab(tab.id)}
            aria-current={isActive ? 'page' : undefined}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              flex: 1,
              justifyContent: 'center',
              color: isActive ? 'var(--brand-mint)' : 'var(--text-secondary)',
              position: 'relative',
              padding: '2px 0 0 0'
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '56px',
                height: '30px',
                borderRadius: 'var(--radius-full)',
                background: isActive ? 'var(--brand-mint-soft)' : 'transparent',
                transition: 'background-color 0.18s ease',
                position: 'relative'
              }}
            >
              <Icon size={22} strokeWidth={isActive ? 2.4 : 1.8} />
              {tab.id === 'chats' && unreadChatCount > 0 && (
                <span style={{ position: 'absolute', top: '-3px', right: '2px' }}>
                  <Badge count={unreadChatCount} variant="unread" />
                </span>
              )}
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: isActive ? 700 : 500,
                letterSpacing: '0.1px'
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
