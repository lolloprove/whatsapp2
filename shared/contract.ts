/**
 * WhatsApp 2 - Shared Contract & Types
 * Questo file definisce i tipi condivisi tra Frontend e Backend.
 */

export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string;
  statusMessage?: string;
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
}

export interface LanguageMeta {
  code: string;
  name: string;
  native: string;
  flag: string;
  chaosScore?: number;
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface ChatMessage {
  id: string;
  tempId?: string;
  conversationId: string;
  senderId: string;
  originalContent: string;
  translatedContent: string;
  sourceLanguage?: string;
  targetLanguage: string;
  targetLanguageName: string;
  targetLanguageFlag: string;
  translationProvider: string;
  status: MessageStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface ConversationSummary {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  otherParticipant?: UserProfile;
  lastMessage?: ChatMessage;
  unreadCount: number;
  updatedAt: string;
}

export interface SendMessagePayload {
  conversationId: string;
  content: string;
  tempId: string;
}

export interface TypingPayload {
  conversationId: string;
  userId: string;
  username: string;
  isTyping: boolean;
}

export interface PresencePayload {
  userId: string;
  isOnline: boolean;
  lastSeen: string;
}

export interface SocketErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}
