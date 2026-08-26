import { Router } from 'express';
import { z } from 'zod';
import { authController } from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';

const router = Router();

const registerSchema = {
  body: z.object({
    username: z
      .string()
      .min(2, 'Username deve avere almeno 2 caratteri')
      .max(30, 'Username massimo 30 caratteri')
      .regex(/^[a-z0-9_]+$/, 'Username: solo lettere minuscole, numeri e underscore'),
    fullName: z.string().max(100).optional()
  })
};

const syncProfileSchema = {
  body: z.object({
    username: z
      .string()
      .min(2, 'Username deve avere almeno 2 caratteri')
      .max(30)
      .regex(/^[a-z0-9_]+$/, 'Username: solo lettere minuscole, numeri e underscore')
      .optional(),
    fullName: z.string().max(100).optional(),
    avatarUrl: z.string().optional(),
    statusMessage: z.string().max(200, 'statusMessage massimo 200 caratteri').optional()
  })
};

// Registrazione username-only (pubblica, nessun auth richiesto)
router.post('/register', validate(registerSchema), authController.register);

router.post('/sync-profile', authMiddleware, validate(syncProfileSchema), authController.syncProfile);
router.get('/me', authMiddleware, authController.getMe);

export default router;
