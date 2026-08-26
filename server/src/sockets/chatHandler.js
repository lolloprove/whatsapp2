import { SOCKET_EVENTS } from '../constants/socketEvents.js';
import { storageService } from '../services/storageService.js';
import { executeTranslationPipeline } from '../services/translation/index.js';

/**
 * Emette un evento a tutti i partecipanti di una conversazione:
 * sia alla stanza della conversazione (chi la sta guardando)
 * sia alle stanze personali `user:<id>` (chi ha l'app aperta altrove),
 * così la lista chat si aggiorna in tempo reale per tutti.
 */
function emitToConversationParticipants(io, conv, event, payload) {
  const room = `conversation:${conv.id}`;
  const targets = new Set([room, ...conv.participants.map((id) => `user:${id}`)]);
  io.to([...targets]).emit(event, payload);
}

export function registerChatHandlers(io, socket) {
  // Join Room (solo se partecipante reale della conversazione)
  socket.on(SOCKET_EVENTS.JOIN_ROOM, async ({ conversationId }) => {
    if (!conversationId) return;
    const conv = await storageService.getConversationById(conversationId);
    if (!conv || !storageService.isParticipant(conv, socket.userId)) return;
    socket.join(`conversation:${conversationId}`);
  });

  // Leave Room
  socket.on(SOCKET_EVENTS.LEAVE_ROOM, ({ conversationId }) => {
    if (!conversationId) return;
    socket.leave(`conversation:${conversationId}`);
  });

  // Typing indicator
  socket.on(SOCKET_EVENTS.TYPING, async ({ conversationId, isTyping }) => {
    if (!conversationId) return;
    const conv = await storageService.getConversationById(conversationId);
    if (!conv || !storageService.isParticipant(conv, socket.userId)) return;
    socket.to(`conversation:${conversationId}`).emit(SOCKET_EVENTS.USER_TYPING, {
      conversationId,
      userId: socket.userId,
      username: socket.user?.username || 'Utente',
      isTyping: Boolean(isTyping)
    });
  });

  // Mark messages as read (Read receipts)
  socket.on(SOCKET_EVENTS.MARK_READ, async ({ conversationId, messageIds }) => {
    if (!conversationId) return;
    const conv = await storageService.getConversationById(conversationId);
    if (!conv || !storageService.isParticipant(conv, socket.userId)) return;

    const ids = Array.isArray(messageIds) ? messageIds : [];
    const readIds = await storageService.markMessagesAsRead(conversationId, ids, socket.userId);
    if (readIds.length === 0) return;

    emitToConversationParticipants(io, conv, SOCKET_EVENTS.MESSAGES_READ, {
      conversationId,
      readByUserId: socket.userId,
      messageIds: readIds
    });
  });

  // Send Message
  socket.on(SOCKET_EVENTS.SEND_MESSAGE, async (payload) => {
    try {
      const { conversationId, content, targetLanguage, tempId, mediaUrl, mediaType, mediaName, audioDuration } = payload || {};

      if (!conversationId || (!content || !String(content).trim()) && !mediaUrl) {
        return socket.emit(SOCKET_EVENTS.SOCKET_ERROR, {
          code: 'INVALID_PAYLOAD',
          message: 'conversationId e content sono obbligatori',
          details: null
        });
      }

      const conv = await storageService.getConversationById(conversationId);
      if (!conv || !storageService.isParticipant(conv, socket.userId)) {
        return socket.emit(SOCKET_EVENTS.SOCKET_ERROR, {
          code: 'NOT_PARTICIPANT',
          message: 'Non sei un partecipante di questa conversazione',
          details: null
        });
      }

      const cleanContent = String(content || '').trim();

      // 1. Esegui la traduzione con il motore a cascata multi-tier
      const translation = await executeTranslationPipeline(
        cleanContent,
        targetLanguage || null,
        'it'
      );

      // 2. Salva il messaggio (persistente su disco)
      const savedMsg = await storageService.saveMessage({
        tempId: tempId || null,
        conversationId,
        senderId: socket.userId,
        originalContent: cleanContent,
        translatedContent: translation.translatedContent,
        sourceLanguage: translation.sourceLanguage,
        targetLanguage: translation.targetLanguage,
        targetLanguageName: translation.targetLanguageName,
        targetLanguageFlag: translation.targetLanguageFlag,
        translationProvider: translation.translationProvider,
        status: 'delivered',
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        mediaName: mediaName || null,
        audioDuration: audioDuration || null
      });

      // 3. Emetti a tutti i partecipanti (stanza + stanze personali)
      emitToConversationParticipants(io, conv, SOCKET_EVENTS.NEW_MESSAGE, savedMsg);

      console.log(`[Message Saved] Conv: ${conversationId} | Lang: ${savedMsg.targetLanguage} (${savedMsg.targetLanguageName}) | Provider: ${savedMsg.translationProvider}`);
    } catch (err) {
      console.error('[Socket Message Send Error]:', err);
      socket.emit(SOCKET_EVENTS.SOCKET_ERROR, {
        code: 'MESSAGE_SEND_FAILED',
        message: err.message || 'Invio messaggio fallito',
        details: null
      });
    }
  });
}
