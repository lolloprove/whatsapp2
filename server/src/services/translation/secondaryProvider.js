import axios from 'axios';
import { config } from '../../config/env.js';

/**
 * Provider Secondario: Google Translate Public Mini Endpoint / GTX
 * Fallback automatico ultra-veloce per garantire continuità
 *
 * @param {string} text
 * @param {string} targetLangCode
 * @param {string} [sourceLangCode='auto']
 * @returns {Promise<string>}
 */
export async function translateWithSecondary(text, targetLangCode, sourceLangCode = 'auto') {
  if (!text || typeof text !== 'string') {
    throw new Error('Testo non valido');
  }

  const standardIsoRegex = /^[a-z]{2}(-[A-Z]{2})?$/;
  if (!standardIsoRegex.test(targetLangCode)) {
    throw new Error(`Target language '${targetLangCode}' non supportata da Google GTX`);
  }

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLangCode}&tl=${targetLangCode}&dt=t&q=${encodeURIComponent(text.trim())}`;

  const response = await axios.get(url, {
    timeout: config.translation.secondaryTimeoutMs || 2500,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  if (Array.isArray(response.data) && Array.isArray(response.data[0])) {
    const translatedText = response.data[0]
      .map((item) => (item && item[0] ? item[0] : ''))
      .join('');

    if (translatedText && translatedText.trim()) {
      return translatedText.trim();
    }
  }

  throw new Error('Formato risposta non valido da Secondary Provider');
}
