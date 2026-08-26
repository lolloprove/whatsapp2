import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ChatProvider, useChat } from './context/ChatContext';
import { Sidebar } from './components/sidebar/Sidebar';
import { SettingsTab } from './components/settings/SettingsTab';
import { BottomTabBar, type MainTabType } from './components/navigation/BottomTabBar';
import { ChatWindow } from './components/chat/ChatWindow';
import { OnboardingScreen } from './components/auth/OnboardingScreen';
import { Logo, Wordmark } from './components/common/Logo';
import { Loader2 } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { isRegistered, isLoading } = useAuth();
  const { activeConversation, conversations } = useChat();
  const [currentTab, setCurrentTab] = useState<MainTabType>('chats');
  const [mobileView, setMobileView] = useState<'tabs' | 'chat'>('tabs');

  const unreadCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  // 1. Splash brandizzata durante il ripristino sessione
  if (isLoading) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-app)',
          gap: '18px'
        }}
        className="animate-fade-in"
      >
        <Logo size={84} glow />
        <Wordmark fontSize={22} />
        <Loader2 size={20} className="animate-spin" color="var(--brand-mint)" style={{ marginTop: '6px' }} />
      </div>
    );
  }

  // 2. Onboarding con username
  if (!isRegistered) {
    return <OnboardingScreen />;
  }

  const handleSelectChat = () => setMobileView('chat');
  const handleBackToTabs = () => setMobileView('tabs');

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Vista 1: tab principali */}
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          transform: mobileView === 'chat' && activeConversation ? 'translateX(-30%)' : 'translateX(0)',
          opacity: mobileView === 'chat' && activeConversation ? 0.35 : 1,
          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease',
          pointerEvents: mobileView === 'chat' && activeConversation ? 'none' : 'auto'
        }}
      >
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {currentTab === 'chats' && <Sidebar onSelectChatMobile={handleSelectChat} />}
          {currentTab === 'settings' && <SettingsTab />}
        </div>

        <BottomTabBar
          activeTab={currentTab}
          onChangeTab={setCurrentTab}
          unreadChatCount={unreadCount}
        />
      </div>

      {/* Vista 2: conversazione a schermo intero */}
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          inset: 0,
          transform: mobileView === 'chat' && activeConversation ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          pointerEvents: mobileView === 'chat' && activeConversation ? 'auto' : 'none',
          zIndex: 20,
          boxShadow: mobileView === 'chat' ? '-4px 0 24px rgba(0, 0, 0, 0.35)' : 'none'
        }}
      >
        <ChatWindow
          onBackMobile={handleBackToTabs}
          onStartNewChat={() => {
            setMobileView('tabs');
            setCurrentTab('chats');
          }}
        />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <ChatProvider>
            <div className="mobile-app-frame">
              <MainLayout />
            </div>
          </ChatProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
