import test from 'node:test';
import assert from 'node:assert';
import { executeTranslationPipeline } from '../src/services/translation/index.js';
import { translateWithFallback } from '../src/services/translation/fallbackProvider.js';
import { pickRandomLanguage } from '../src/services/translation/languagePicker.js';
import { SUPPORTED_LANGUAGES, getLanguageByCode } from '../src/constants/languages.js';

test('pickRandomLanguage returns a valid language object excluding source language', () => {
  for (let i = 0; i < 20; i++) {
    const lang = pickRandomLanguage('it');
    assert.ok(lang.code, 'Should have a code');
    assert.ok(lang.name, 'Should have a name');
    assert.ok(lang.flag, 'Should have a flag');
    assert.notStrictEqual(lang.code.toLowerCase(), 'it', 'Should not pick the excluded language');
  }
});

test('getLanguageByCode retrieves known and fallback languages', () => {
  const ja = getLanguageByCode('ja');
  assert.strictEqual(ja.name, 'Giapponese');
  assert.strictEqual(ja.flag, '🇯🇵');

  const custom = getLanguageByCode('unknown-xyz');
  assert.strictEqual(custom.code, 'unknown-xyz');
  assert.strictEqual(custom.flag, '🔮');
});

test('translateWithFallback handles Pirate English correctly', () => {
  const result = translateWithFallback('ciao amico birra pizza', 'pirate');
  assert.ok(result.includes('Ahoy'));
  assert.ok(result.includes('grog'));
  assert.ok(result.includes('🏴‍☠️'));
});

test('translateWithFallback handles Napoletano correctly', () => {
  const result = translateWithFallback('ciao pizza caffè', 'nap');
  assert.ok(result.includes('Uè uagliò'));
  assert.ok(result.includes('margherita') || result.includes('cafè'));
  assert.ok(result.includes('🍕'));
});

test('translateWithFallback handles Yoda-Speak correctly', () => {
  const result = translateWithFallback('Il codice funziona bene', 'yoda');
  assert.ok(result.includes('🌌'));
  assert.ok(result.includes('Force') || result.includes('wisdom'));
});

test('translateWithFallback handles Klingon correctly', () => {
  const result = translateWithFallback('Attacco alle navi', 'klingon');
  assert.ok(result.includes('🛸'));
  assert.ok(result.includes('tlhIngan Hol'));
});

test('translateWithFallback handles Sindarin Elvish correctly', () => {
  const result = translateWithFallback('Stella della sera', 'elvish');
  assert.ok(result.includes('🧝'));
  assert.ok(result.includes('Elen síla'));
});

test('translateWithFallback handles Latin correctly', () => {
  const result = translateWithFallback('La verità vince', 'la');
  assert.ok(result.includes('🏛️'));
});

test('translateWithFallback handles Esperanto correctly', () => {
  const result = translateWithFallback('ciao amico pizza', 'eo');
  assert.ok(result.includes('🌐'));
  assert.ok(result.includes('Saluton') || result.includes('amiko'));
});

test('executeTranslationPipeline handles normal text with auto random target language', async () => {
  const result = await executeTranslationPipeline('Buongiorno a tutti quanti!');
  assert.strictEqual(result.originalContent, 'Buongiorno a tutti quanti!');
  assert.ok(result.translatedContent.length > 0);
  assert.ok(result.targetLanguage);
  assert.ok(result.targetLanguageName);
  assert.ok(result.targetLanguageFlag);
  assert.ok(result.translationProvider);
});

test('executeTranslationPipeline handles specific chaos target language', async () => {
  const result = await executeTranslationPipeline('Ci vediamo stasera per una pizza', 'pirate');
  assert.strictEqual(result.targetLanguage, 'pirate');
  assert.strictEqual(result.targetLanguageFlag, '🏴‍☠️');
  assert.strictEqual(result.targetLanguageName, 'Pirate English');
  assert.ok(result.translatedContent.includes('Ahoy') || result.translatedContent.includes('hardtack'));
});
