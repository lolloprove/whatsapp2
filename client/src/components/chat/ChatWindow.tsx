import React from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { EmptyChatState } from './EmptyChatState';

interface ChatWindowProps {
  onBackMobile?: () => void;
  onStartNewChat?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ onBackMobile, onStartNewChat }) => {
  const { user } = useAuth();
  const {
    activeConversation,
    messages,
    isLoadingMessages,
    sendMessage,
    sendTypingStatus
  } = useChat();

  if (!activeConversation) {
    return <EmptyChatState onStartNewChat={onStartNewChat} />;
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-chat-body)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div className="chat-wallpaper" />

      {/* 1. Sticky Compact Header */}
      <ChatHeader
        otherUser={activeConversation.otherParticipant}
        onBackMobile={onBackMobile}
      />

      {/* 2. Message List Area */}
      <MessageList
        messages={messages}
        currentUserId={user?.id}
        isLoading={isLoadingMessages}
      />

      {/* 3. Sticky Bottom Composer */}
      <MessageInput
        onSendMessage={sendMessage}
        onTypingStatus={sendTypingStatus}
      />
    </div>
  );
};
