import { SUPPORTED_LANGUAGES } from '../../constants/languages.js';

/**
 * Seleziona una lingua casuale diversa dalla lingua sorgente specificata.
 * @param {string} [excludeCode='it'] - Codice lingua da escludere (es. 'it')
 * @returns {object} Oggetto lingua con { code, name, native, flag, category }
 */
export function pickRandomLanguage(excludeCode = 'it') {
  const normExclude = (excludeCode || 'it').toLowerCase().trim();
  const eligible = SUPPORTED_LANGUAGES.filter(
    (lang) => lang.code.toLowerCase() !== normExclude
  );

  if (eligible.length === 0) {
    return SUPPORTED_LANGUAGES[0];
  }

  const randomIndex = Math.floor(Math.random() * eligible.length);
  return eligible[randomIndex];
}
