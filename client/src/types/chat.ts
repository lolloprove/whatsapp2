export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string;
  statusMessage?: string;
  isOnline: boolean;
  lastSeen?: string;
  createdAt?: string;
}

export interface LanguageMeta {
  code: string;
  name: string;
  native: string;
  flag: string;
  category?: string;
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
  targetLanguage?: string;
  targetLanguageName?: string;
  targetLanguageFlag?: string;
  translationProvider?: string;
  status: MessageStatus;
  createdAt: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'audio' | 'document';
  mediaName?: string;
  audioDuration?: string;
}

export interface ConversationSummary {
  id: string;
  type: 'direct' | 'group';
  otherParticipant?: UserProfile;
  lastMessage?: ChatMessage;
  unreadCount: number;
  updatedAt: string;
}
