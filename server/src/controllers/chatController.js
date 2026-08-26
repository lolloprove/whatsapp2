import { storageService } from '../services/storageService.js';
import { executeTranslationPipeline } from '../services/translation/index.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';

export const chatController = {
  async getConversations(req, res, next) {
    try {
      const list = await storageService.getUserConversations(req.user.id);
      return res.status(200).json({ success: true, data: list });
    } catch (err) {
      next(err);
    }
  },

  async createOrGetConversation(req, res, next) {
    try {
      const { recipientUserId } = req.body;
      if (!recipientUserId) {
        return res.status(400).json({ success: false, error: 'recipientUserId è obbligatorio' });
      }

      if (recipientUserId === req.user.id) {
        return res.status(400).json({ success: false, error: 'Non puoi creare una conversazione con te stesso' });
      }

      const recipient = await storageService.getUserById(recipientUserId);
      if (!recipient) {
        return res.status(404).json({ success: false, error: 'Utente destinatario non trovato' });
      }

      const conv = await storageService.getOrCreateConversation(req.user.id, recipientUserId);
      return res.status(200).json({
        success: true,
        data: {
          id: conv.id,
          type: conv.type,
          createdAt: conv.createdAt
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async getMessages(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { limit, before } = req.query;

      const conv = await storageService.getConversationById(conversationId);
      if (!conv || !storageService.isParticipant(conv, req.user.id)) {
        return res.status(403).json({ success: false, error: 'Conversazione non accessibile' });
      }

      const parsedLimit = limit ? parseInt(limit, 10) : 50;
      const result = await storageService.getConversationMessages(conversationId, {
        limit: parsedLimit,
        before: before || null
      });

      return res.status(200).json({
        success: true,
        data: {
          messages: result.messages,
          hasMore: result.hasMore,
          nextCursor: result.nextCursor
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // REST fallback per l'invio messaggi (usato se il socket è disconnesso)
  async sendMessage(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { content, targetLanguage, tempId, mediaUrl, mediaType, mediaName, audioDuration } = req.body;

      if ((!content || !content.trim()) && !mediaUrl) {
        return res.status(400).json({ success: false, error: 'Contenuto del messaggio non valido o vuoto' });
      }

      const conv = await storageService.getConversationById(conversationId);
      if (!conv || !storageService.isParticipant(conv, req.user.id)) {
        return res.status(403).json({ success: false, error: 'Conversazione non accessibile' });
      }

      const translationResult = await executeTranslationPipeline(
        (content || '').trim(),
        targetLanguage || null,
        'it'
      );

      const savedMessage = await storageService.saveMessage({
        tempId,
        conversationId,
        senderId: req.user.id,
        originalContent: (content || '').trim(),
        translatedContent: translationResult.translatedContent,
        sourceLanguage: translationResult.sourceLanguage,
        targetLanguage: translationResult.targetLanguage,
        targetLanguageName: translationResult.targetLanguageName,
        targetLanguageFlag: translationResult.targetLanguageFlag,
        translationProvider: translationResult.translationProvider,
        status: 'delivered',
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        mediaName: mediaName || null,
        audioDuration: audioDuration || null
      });

      // Notifica realtime gli altri partecipanti anche se il mittente usa REST
      const io = req.app.get('io');
      if (io) {
        const targets = new Set([
          `conversation:${conv.id}`,
          ...conv.participants.map((id) => `user:${id}`)
        ]);
        io.to([...targets]).emit(SOCKET_EVENTS.NEW_MESSAGE, savedMessage);
      }

      return res.status(200).json({ success: true, data: savedMessage });
    } catch (err) {
      next(err);
    }
  }
};
