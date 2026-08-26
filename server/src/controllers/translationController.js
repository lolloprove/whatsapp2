import { SUPPORTED_LANGUAGES } from '../constants/languages.js';
import { executeTranslationPipeline } from '../services/translation/index.js';

export const translationController = {
  getLanguages(req, res) {
    return res.status(200).json({
      success: true,
      count: SUPPORTED_LANGUAGES.length,
      data: SUPPORTED_LANGUAGES
    });
  },

  async testTranslate(req, res, next) {
    try {
      const { text, targetLanguage } = req.body;
      if (!text || !text.trim()) {
        return res.status(400).json({ success: false, error: 'Parametro text obbligatorio' });
      }

      const result = await executeTranslationPipeline(text.trim(), targetLanguage || null, 'it');
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
};
