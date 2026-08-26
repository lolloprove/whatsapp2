import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ChatMessage, ConversationSummary, UserProfile } from '../types/chat';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { apiRequest } from '../services/api';
import { playSendSound, playReceiveSound } from '../utils/soundUtils';

interface ChatContextType {
  conversations: ConversationSummary[];
  activeConversation: ConversationSummary | null;
  messages: ChatMessage[];
  isLoadingMessages: boolean;
  isTypingOther: boolean;
  typingUserText: string;
  selectConversation: (conv: ConversationSummary) => void;
  startNewChatWithUser: (user: UserProfile) => Promise<void>;
  sendMessage: (
    content: string,
    mediaUrl?: string,
    mediaType?: 'image' | 'audio' | 'document',
    mediaName?: string,
    audioDuration?: string
  ) => Promise<void>;
  sendTypingStatus: (isTyping: boolean) => void;
  loadConversations: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationSummary | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [isTypingOther, setIsTypingOther] = useState<boolean>(false);
  const [typingUserText, setTypingUserText] = useState<string>('');

  const activeConvRef = useRef<ConversationSummary | null>(null);
  activeConvRef.current = activeConversation;
  const conversationsRef = useRef<ConversationSummary[]>([]);
  conversationsRef.current = conversations;

  // Load conversations from the real backend
  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      const res = await apiRequest('/conversations', {}, user);
      if (res.data) {
        setConversations(res.data);
      }
    } catch (err) {
      console.warn('Error loading conversations:', err);
    }
  }, [user]);

  // Load messages when active conversation changes
  const loadMessages = useCallback(async (convId: string) => {
    if (!user) return;
    setIsLoadingMessages(true);
    try {
      const res = await apiRequest(`/conversations/${convId}/messages`, {}, user);
      if (res.data && res.data.messages) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.warn('Error loading messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [user]);

  // Select a conversation: join room, load messages, mark incoming as read
  const selectConversation = useCallback((conv: ConversationSummary) => {
    if (activeConvRef.current && activeConvRef.current.id !== conv.id && socket) {
      socket.emit('chat:leave_room', { conversationId: activeConvRef.current.id });
    }
    setActiveConversation(conv);
    if (socket) {
      socket.emit('chat:join_room', { conversationId: conv.id });
      // Conferma di lettura per i messaggi ricevuti in questa conversazione
      socket.emit('chat:mark_read', { conversationId: conv.id, messageIds: [] });
    }
    // Azzera subito il badge non letti nella sidebar
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
    );
    setMessages([]);
    loadMessages(conv.id);
    setIsTypingOther(false);
  }, [socket, loadMessages]);

  // Start new chat with user
  const startNewChatWithUser = async (targetUser: UserProfile) => {
    if (!user) return;
    try {
      const res = await apiRequest('/conversations', {
        method: 'POST',
        body: JSON.stringify({ recipientUserId: targetUser.id })
      }, user);

      if (res.data) {
        const existing = conversationsRef.current.find((c) => c.id === res.data.id);
        const convSummary: ConversationSummary = existing || {
          id: res.data.id,
          type: 'direct',
          otherParticipant: targetUser,
          unreadCount: 0,
          updatedAt: new Date().toISOString()
        };
        if (!existing) {
          setConversations((prev) => [convSummary, ...prev]);
        }
        selectConversation(convSummary);
      }
    } catch (err) {
      console.error('Error starting new chat:', err);
    }
  };

  // Send message (socket first, REST fallback)
  const sendMessage = async (
    content: string,
    mediaUrl?: string,
    mediaType?: 'image' | 'audio' | 'document',
    mediaName?: string,
    audioDuration?: string
  ) => {
    if (!user || !activeConversation || (!content.trim() && !mediaUrl)) return;

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const trimmed = content.trim() || (mediaType === 'image' ? '📷 Foto' : mediaType === 'audio' ? '🎙️ Messaggio vocale' : '📄 Allegato');

    // Optimistic message in UI
    const optimisticMsg: ChatMessage = {
      id: tempId,
      tempId,
      conversationId: activeConversation.id,
      senderId: user.id,
      originalContent: trimmed,
      translatedContent: trimmed,
      mediaUrl,
      mediaType,
      mediaName,
      audioDuration,
      targetLanguage: 'it',
      targetLanguageName: 'Italiano',
      targetLanguageFlag: '🇮🇹',
      status: 'sending',
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    playSendSound();

    if (socket && isConnected) {
      // Realtime WebSocket delivery
      socket.emit('chat:send_message', {
        conversationId: activeConversation.id,
        content: trimmed,
        tempId,
        mediaUrl,
        mediaType,
        mediaName,
        audioDuration
      });
    } else {
      // REST delivery fallback
      try {
        const res = await apiRequest(`/conversations/${activeConversation.id}/messages`, {
          method: 'POST',
          body: JSON.stringify({
            content: trimmed,
            tempId,
            mediaUrl,
            mediaType,
            mediaName,
            audioDuration
          })
        }, user);

        if (res.data) {
          const finalizedMsg: ChatMessage = res.data;
          setMessages((prev) =>
            prev.map((m) => (m.tempId === tempId ? finalizedMsg : m))
          );

          // Update sidebar preview
          setConversations((prev) =>
            prev.map((c) =>
              c.id === activeConversation.id
                ? { ...c, lastMessage: finalizedMsg, updatedAt: finalizedMsg.createdAt }
                : c
            ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          );
        }
      } catch (err) {
        console.error('REST message error:', err);
        setMessages((prev) =>
          prev.map((m) => (m.tempId === tempId ? { ...m, status: 'failed' } : m))
        );
      }
    }
  };

  // Send typing status
  const sendTypingStatus = useCallback((isTyping: boolean) => {
    if (!socket || !activeConversation) return;
    socket.emit('chat:typing', {
      conversationId: activeConversation.id,
      isTyping
    });
  }, [socket, activeConversation]);

  // Initial load + reload quando il socket si (ri)connette
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user, loadConversations]);

  useEffect(() => {
    if (isConnected) {
      loadConversations();
      // Re-join della stanza attiva dopo una riconnessione
      if (activeConvRef.current && socket) {
        socket.emit('chat:join_room', { conversationId: activeConvRef.current.id });
      }
    }
  }, [isConnected, socket, loadConversations]);

  // Listen to Socket.io Realtime Events
  useEffect(() => {
    if (!socket) return;

    // Incoming New Message from WebSocket
    const handleNewMessage = (newMsg: ChatMessage) => {
      const currentActiveId = activeConvRef.current?.id;

      if (newMsg.conversationId === currentActiveId) {
        setMessages((prev) => {
          if (newMsg.tempId) {
            const index = prev.findIndex((m) => m.tempId === newMsg.tempId);
            if (index !== -1) {
              const copy = [...prev];
              copy[index] = newMsg;
              return copy;
            }
          }
          if (prev.some((m) => m.id === newMsg.id)) {
            return prev;
          }
          return [...prev, newMsg];
        });

        if (newMsg.senderId !== user?.id) {
          playReceiveSound();
          // La chat è aperta: segna subito come letto
          socket.emit('chat:mark_read', { conversationId: newMsg.conversationId, messageIds: [newMsg.id] });
        }
      } else if (newMsg.senderId !== user?.id) {
        playReceiveSound();
      }

      // Update sidebar conversation item (o ricarica la lista se è una chat nuova)
      setConversations((prev) => {
        const exists = prev.some((conv) => conv.id === newMsg.conversationId);
        if (!exists) {
          // Conversazione creata da un altro utente: ricarica la lista dal server
          loadConversations();
          return prev;
        }
        return prev.map((conv) => {
          if (conv.id === newMsg.conversationId) {
            return {
              ...conv,
              lastMessage: newMsg,
              updatedAt: newMsg.createdAt,
              unreadCount:
                conv.id === currentActiveId || newMsg.senderId === user?.id
                  ? conv.id === currentActiveId
                    ? 0
                    : conv.unreadCount
                  : conv.unreadCount + 1
            };
          }
          return conv;
        }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      });
    };

    // User Typing
    const handleUserTyping = ({ conversationId, isTyping }: { conversationId: string; username: string; isTyping: boolean }) => {
      if (activeConvRef.current?.id === conversationId) {
        setIsTypingOther(isTyping);
        setTypingUserText(isTyping ? 'sta digitando...' : '');
      }
    };

    // Presence Update
    const handlePresenceUpdate = ({ userId, isOnline }: { userId: string; isOnline: boolean }) => {
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.otherParticipant?.id === userId) {
            return {
              ...conv,
              otherParticipant: {
                ...conv.otherParticipant,
                isOnline
              }
            };
          }
          return conv;
        })
      );
    };

    // Read receipts: l'altro partecipante ha letto i miei messaggi (doppia spunta blu)
    const handleMessagesRead = ({ conversationId, messageIds }: { conversationId: string; readByUserId: string; messageIds: string[] }) => {
      if (activeConvRef.current?.id === conversationId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId === user?.id && (messageIds.length === 0 || messageIds.includes(m.id))
              ? { ...m, status: 'read' }
              : m
          )
        );
      }
    };

    socket.on('chat:new_message', handleNewMessage);
    socket.on('chat:user_typing', handleUserTyping);
    socket.on('chat:presence_update', handlePresenceUpdate);
    socket.on('chat:messages_read', handleMessagesRead);

    return () => {
      socket.off('chat:new_message', handleNewMessage);
      socket.off('chat:user_typing', handleUserTyping);
      socket.off('chat:presence_update', handlePresenceUpdate);
      socket.off('chat:messages_read', handleMessagesRead);
    };
  }, [socket, user?.id, loadConversations]);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        isLoadingMessages,
        isTypingOther,
        typingUserText,
        selectConversation,
        startNewChatWithUser,
        sendMessage,
        sendTypingStatus,
        loadConversations
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
