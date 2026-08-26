import { Router } from 'express';
import { z } from 'zod';
import { chatController } from '../controllers/chatController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';

const router = Router();

const createConversationSchema = {
  body: z.object({
    recipientUserId: z.string().min(1, 'recipientUserId è obbligatorio')
  })
};

const sendMessageSchema = {
  body: z.object({
    content: z.string().min(1, 'Il messaggio non può essere vuoto'),
    targetLanguage: z.string().optional(),
    tempId: z.string().optional()
  })
};

router.get('/', authMiddleware, chatController.getConversations);
router.post('/', authMiddleware, validate(createConversationSchema), chatController.createOrGetConversation);
router.get('/:conversationId/messages', authMiddleware, chatController.getMessages);
router.post('/:conversationId/messages', authMiddleware, validate(sendMessageSchema), chatController.sendMessage);

export default router;
