import { jsonStore } from './jsonStore.js';

// Socket tracking (volontariamente solo in-memory: la presenza è effimera)
const userSockets = new Map(); // userId -> Set of socketIds

const USERNAME_REGEX = /^[a-z0-9_]{2,30}$/;

function normalizeUsername(username) {
  return String(username || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '');
}

function toPublicUser(u) {
  return {
    id: u.id,
    username: u.username,
    fullName: u.fullName,
    avatarUrl: u.avatarUrl,
    statusMessage: u.statusMessage,
    isOnline: userSockets.has(u.id) && userSockets.get(u.id).size > 0,
    lastSeen: u.lastSeen,
    createdAt: u.createdAt
  };
}

function mutate() {
  jsonStore.scheduleSave();
}

export const storageService = {
  // === PROFILES / USERS ===

  /**
   * Registrazione username-only: se l'username esiste già restituisce
   * l'utente esistente (login), altrimenti crea un nuovo profilo persistente.
   */
  async registerUser({ username, fullName }) {
    const cleanUsername = normalizeUsername(username);
    if (!USERNAME_REGEX.test(cleanUsername)) {
      const err = new Error('Username non valido: usa 2-30 caratteri tra lettere minuscole, numeri e underscore.');
      err.statusCode = 400;
      throw err;
    }

    const existing = jsonStore.state.users.find((u) => u.username === cleanUsername);
    if (existing) {
      existing.lastSeen = new Date().toISOString();
      mutate();
      return { user: existing, created: false };
    }

    const nowIso = new Date().toISOString();
    const newUser = {
      id: `user_${cleanUsername}_${Math.random().toString(36).substring(2, 8)}`,
      username: cleanUsername,
      fullName: String(fullName || '').trim() || cleanUsername,
      avatarUrl: `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(cleanUsername)}`,
      statusMessage: 'Disponibile su WhatsApp 2',
      lastSeen: nowIso,
      createdAt: nowIso
    };
    jsonStore.state.users.push(newUser);
    mutate();
    return { user: newUser, created: true };
  },

  async getUserByUsername(username) {
    const clean = normalizeUsername(username);
    return jsonStore.state.users.find((u) => u.username === clean) || null;
  },

  async syncUser(userData) {
    if (!userData || !userData.id) return null;
    const cleanId = String(userData.id).trim();
    const existing = jsonStore.state.users.find((u) => u.id === cleanId);

    if (!existing) return null;

    // Se lo username cambia, deve restare univoco
    let nextUsername = existing.username;
    if (userData.username) {
      const candidate = normalizeUsername(userData.username);
      if (USERNAME_REGEX.test(candidate)) {
        const clash = jsonStore.state.users.find((u) => u.username === candidate && u.id !== cleanId);
        if (!clash) nextUsername = candidate;
      }
    }

    existing.username = nextUsername;
    existing.fullName = String(userData.fullName || '').trim() || existing.fullName;
    existing.avatarUrl = userData.avatarUrl || existing.avatarUrl;
    if (userData.statusMessage !== undefined && String(userData.statusMessage).trim()) {
      existing.statusMessage = String(userData.statusMessage).trim();
    }
    existing.lastSeen = new Date().toISOString();
    mutate();
    return existing;
  },

  async getUserById(userId) {
    if (!userId) return null;
    const cleanId = String(userId).trim();
    return jsonStore.state.users.find((u) => u.id === cleanId) || null;
  },

  async searchUsers(query = '', excludeUserId = null) {
    const q = String(query || '').toLowerCase().trim();
    let all = jsonStore.state.users.filter((u) => u.id !== excludeUserId);
    if (q) {
      all = all.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          (u.fullName && u.fullName.toLowerCase().includes(q))
      );
    }
    return all.map(toPublicUser);
  },

  // === CONVERSATIONS ===
  async getOrCreateConversation(userId1, userId2) {
    const existing = jsonStore.state.conversations.find(
      (conv) =>
        conv.type === 'direct' &&
        conv.participants.includes(userId1) &&
        conv.participants.includes(userId2)
    );
    if (existing) return existing;

    const nowIso = new Date().toISOString();
    const newConv = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      type: 'direct',
      participants: [userId1, userId2],
      createdAt: nowIso,
      updatedAt: nowIso
    };
    jsonStore.state.conversations.push(newConv);
    jsonStore.state.messages[newConv.id] = [];
    mutate();
    return newConv;
  },

  async getConversationById(convId) {
    return jsonStore.state.conversations.find((c) => c.id === convId) || null;
  },

  isParticipant(conv, userId) {
    return Boolean(conv && Array.isArray(conv.participants) && conv.participants.includes(userId));
  },

  async getUserConversations(userId) {
    const list = [];
    for (const conv of jsonStore.state.conversations) {
      if (!conv.participants.includes(userId)) continue;

      const otherId = conv.participants.find((id) => id !== userId);
      const otherUser = await this.getUserById(otherId);

      const convMessages = jsonStore.state.messages[conv.id] || [];
      const lastMessage = convMessages.length > 0 ? convMessages[convMessages.length - 1] : null;

      const unreadCount = convMessages.filter(
        (m) => m.senderId !== userId && m.status !== 'read'
      ).length;

      list.push({
        id: conv.id,
        type: conv.type,
        otherParticipant: otherUser
          ? toPublicUser(otherUser)
          : {
              id: otherId,
              username: 'utente',
              fullName: 'Utente WhatsApp 2',
              avatarUrl: `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(otherId)}`,
              isOnline: false,
              lastSeen: null
            },
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              senderId: lastMessage.senderId,
              originalContent: lastMessage.originalContent,
              translatedContent: lastMessage.translatedContent,
              targetLanguage: lastMessage.targetLanguage,
              targetLanguageName: lastMessage.targetLanguageName,
              targetLanguageFlag: lastMessage.targetLanguageFlag,
              mediaType: lastMessage.mediaType,
              createdAt: lastMessage.createdAt
            }
          : null,
        unreadCount,
        updatedAt: conv.updatedAt
      });
    }

    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  // === MESSAGES ===
  async saveMessage(messageData) {
    const convId = messageData.conversationId;
    if (!jsonStore.state.messages[convId]) {
      jsonStore.state.messages[convId] = [];
    }

    const nowIso = new Date().toISOString();
    const newMsg = {
      id: messageData.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      tempId: messageData.tempId || null,
      conversationId: convId,
      senderId: messageData.senderId,
      originalContent: messageData.originalContent,
      translatedContent: messageData.translatedContent,
      sourceLanguage: messageData.sourceLanguage || 'it',
      targetLanguage: messageData.targetLanguage,
      targetLanguageName: messageData.targetLanguageName,
      targetLanguageFlag: messageData.targetLanguageFlag,
      translationProvider: messageData.translationProvider || 'primary',
      status: messageData.status || 'delivered',
      mediaUrl: messageData.mediaUrl || null,
      mediaType: messageData.mediaType || null,
      mediaName: messageData.mediaName || null,
      audioDuration: messageData.audioDuration || null,
      createdAt: messageData.createdAt || nowIso,
      updatedAt: nowIso
    };

    jsonStore.state.messages[convId].push(newMsg);

    const conv = jsonStore.state.conversations.find((c) => c.id === convId);
    if (conv) {
      conv.updatedAt = newMsg.createdAt;
    }

    mutate();
    return newMsg;
  },

  async getConversationMessages(conversationId, { limit = 50, before = null } = {}) {
    const list = jsonStore.state.messages[conversationId] || [];
    let filtered = list;

    if (before) {
      const beforeTime = new Date(before).getTime();
      filtered = filtered.filter((m) => new Date(m.createdAt).getTime() < beforeTime);
    }

    const maxLimit = Math.min(Math.max(1, limit), 100);
    const paginated = filtered.slice(-maxLimit);
    const hasMore = filtered.length > maxLimit;
    const nextCursor = hasMore && paginated.length > 0 ? paginated[0].createdAt : null;

    return { messages: paginated, hasMore, nextCursor };
  },

  async markMessagesAsRead(conversationId, messageIds, userId) {
    const list = jsonStore.state.messages[conversationId];
    if (!list) return [];

    const updatedIds = [];
    for (const msg of list) {
      if (
        (messageIds.length === 0 || messageIds.includes(msg.id)) &&
        msg.senderId !== userId &&
        msg.status !== 'read'
      ) {
        msg.status = 'read';
        updatedIds.push(msg.id);
      }
    }

    if (updatedIds.length > 0) mutate();
    return updatedIds;
  },

  // === PRESENCE & SOCKET TRACKING (in-memory, effimero) ===
  addSocket(userId, socketId) {
    if (!userId) return;
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socketId);

    const user = jsonStore.state.users.find((u) => u.id === userId);
    if (user) {
      user.lastSeen = new Date().toISOString();
      mutate();
    }
  },

  removeSocket(userId, socketId) {
    if (!userId || !userSockets.has(userId)) return;
    userSockets.get(userId).delete(socketId);
    if (userSockets.get(userId).size === 0) {
      userSockets.delete(userId);
      const user = jsonStore.state.users.find((u) => u.id === userId);
      if (user) {
        user.lastSeen = new Date().toISOString();
        mutate();
      }
    }
  },

  isUserOnline(userId) {
    return userSockets.has(userId) && userSockets.get(userId).size > 0;
  }
};
