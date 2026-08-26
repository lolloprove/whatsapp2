import axios from 'axios';
import { config } from '../../config/env.js';

/**
 * Provider Primario: MyMemory Translation API
 * Endpoint gratuito pubblico ad alta precisione
 *
 * @param {string} text
 * @param {string} targetLangCode
 * @param {string} [sourceLangCode='it']
 * @returns {Promise<string>}
 */
export async function translateWithPrimary(text, targetLangCode, sourceLangCode = 'it') {
  if (!text || typeof text !== 'string') {
    throw new Error('Testo non valido per la traduzione primario');
  }

  // Se è un linguaggio non ISO standard (es. pirate, yoda, nap, elvish), fallisci subito per passare al fallback
  const standardIsoRegex = /^[a-z]{2}(-[A-Z]{2})?$/;
  if (!standardIsoRegex.test(targetLangCode)) {
    throw new Error(`Target language '${targetLangCode}' non è un codice ISO standard.`);
  }

  const langPair = `${sourceLangCode}|${targetLangCode}`;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.trim())}&langpair=${langPair}`;

  const response = await axios.get(url, {
    timeout: config.translation.primaryTimeoutMs || 2500,
    headers: {
      'User-Agent': 'WhatsApp2-BabelEngine/1.0',
      'Accept': 'application/json'
    }
  });

  if (response.data && response.data.responseData && response.data.responseData.translatedText) {
    const translated = response.data.responseData.translatedText.trim();
    // Verifica che non sia un messaggio di warning / limit
    if (
      translated &&
      !translated.toUpperCase().includes('MYMEMORY WARNING') &&
      !translated.toUpperCase().includes('QUERY LENGTH LIMIT EXCEEDED') &&
      !translated.toUpperCase().includes('NO QUERY SPECIFIED')
    ) {
      return translated;
    }
  }

  throw new Error('Risposta vuota o quota MyMemory superata');
}
