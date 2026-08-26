import { Router } from 'express';
import { z } from 'zod';
import { translationController } from '../controllers/translationController.js';
import { validate } from '../middlewares/validateMiddleware.js';

const router = Router();

const testTranslateSchema = {
  body: z.object({
    text: z.string().min(1, 'Parametro text non può essere vuoto'),
    targetLanguage: z.string().optional()
  })
};

router.get('/languages', translationController.getLanguages);
router.post('/test-translate', validate(testTranslateSchema), translationController.testTranslate);

export default router;
