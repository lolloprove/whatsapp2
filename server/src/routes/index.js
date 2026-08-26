import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import chatRoutes from './chatRoutes.js';
import translationRoutes from './translationRoutes.js';

const router = Router();

// Healthcheck endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'WhatsApp 2 Babel Server',
    version: '1.0.0',
    uptimeSeconds: Math.floor(process.uptime()),
    database: 'json_file_persistent',
    timestamp: new Date().toISOString()
  });
});

// Modular sub-routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/conversations', chatRoutes);
router.use('/translations', translationRoutes);

export default router;
