import { pickRandomLanguage } from './languagePicker.js';
import { translateWithPrimary } from './primaryProvider.js';
import { translateWithSecondary } from './secondaryProvider.js';
import { translateWithFallback } from './fallbackProvider.js';
import { getLanguageByCode } from '../../constants/languages.js';

/**
 * Multi-Tier Translation Cascade Orchestrator
 *
 * Pattern:
 * 1. Sceglie lingua casuale (o usa target language richiesta).
 * 2. Se lingua speciale (pirate, yoda, etc.), usa motore chaos/humor.
 * 3. Altrimenti tenta Tier 1 (MyMemory API).
 * 4. In caso di errore/timeout tenta Tier 2 (Google GTX).
 * 5. In caso di errore/timeout passa a Tier 3 (Offline Babel Fallback).
 *
 * @param {string} text - Testo originale
 * @param {string} [requestedTargetLang=null] - Codice lingua opzionale
 * @param {string} [sourceLang='it'] - Lingua sorgente
 * @returns {Promise<object>}
 */
export async function executeTranslationPipeline(text, requestedTargetLang = null, sourceLang = 'it') {
  const cleanText = (text || '').trim();
  if (!cleanText) {
    return {
      originalContent: '',
      translatedContent: '',
      sourceLanguage: sourceLang,
      targetLanguage: 'it',
      targetLanguageName: 'Italiano',
      targetLanguageFlag: '🇮🇹',
      translationProvider: 'empty_input'
    };
  }

  const target = requestedTargetLang
    ? getLanguageByCode(requestedTargetLang)
    : pickRandomLanguage(sourceLang);

  const targetCode = target.code;
  let translatedContent = '';
  let providerUsed = 'unknown';

  const CHAOS_LANGUAGES = ['pirate', 'yoda', 'nap', 'elvish', 'klingon', 'la', 'eo'];

  if (CHAOS_LANGUAGES.includes(targetCode)) {
    translatedContent = translateWithFallback(cleanText, targetCode);
    providerUsed = `chaos_engine_${targetCode}`;
  } else {
    // 1. Tier 1: Primary MyMemory
    try {
      translatedContent = await translateWithPrimary(cleanText, targetCode, sourceLang);
      providerUsed = 'primary_mymemory';
    } catch (errPrimary) {
      console.warn(`[Translation Cascade] Tier 1 (${targetCode}) failed: ${errPrimary.message}. Falling back to Tier 2...`);

      // 2. Tier 2: Secondary Google GTX
      try {
        translatedContent = await translateWithSecondary(cleanText, targetCode, sourceLang);
        providerUsed = 'secondary_google_gtx';
      } catch (errSecondary) {
        console.warn(`[Translation Cascade] Tier 2 (${targetCode}) failed: ${errSecondary.message}. Falling back to Tier 3 Offline...`);

        // 3. Tier 3: Offline Fallback
        translatedContent = translateWithFallback(cleanText, targetCode);
        providerUsed = 'offline_babel_fallback';
      }
    }
  }

  return {
    originalContent: cleanText,
    translatedContent: translatedContent || cleanText,
    sourceLanguage: sourceLang,
    targetLanguage: target.code,
    targetLanguageName: target.name,
    targetLanguageFlag: target.flag,
    translationProvider: providerUsed
  };
}
