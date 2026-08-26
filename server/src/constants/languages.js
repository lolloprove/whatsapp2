/**
 * WhatsApp 2 - Supported Languages for Random Babel Engine (32+ Languages)
 */
export const SUPPORTED_LANGUAGES = [
  // European Languages
  { code: 'it', name: 'Italiano', native: 'Italiano', flag: '🇮🇹', category: 'european' },
  { code: 'en', name: 'Inglese', native: 'English', flag: '🇬🇧', category: 'european' },
  { code: 'fr', name: 'Francese', native: 'Français', flag: '🇫🇷', category: 'european' },
  { code: 'de', name: 'Tedesco', native: 'Deutsch', flag: '🇩🇪', category: 'european' },
  { code: 'es', name: 'Spagnolo', native: 'Español', flag: '🇪🇸', category: 'european' },
  { code: 'pt', name: 'Portoghese', native: 'Português', flag: '🇵🇹', category: 'european' },
  { code: 'nl', name: 'Olandese', native: 'Nederlands', flag: '🇳🇱', category: 'european' },
  { code: 'el', name: 'Greco', native: 'Ελληνικά', flag: '🇬🇷', category: 'european' },
  { code: 'hu', name: 'Ungherese', native: 'Magyar', flag: '🇭🇺', category: 'european' },

  // Slavic Languages
  { code: 'ru', name: 'Russo', native: 'Русский', flag: '🇷🇺', category: 'slavic' },
  { code: 'pl', name: 'Polacco', native: 'Polski', flag: '🇵🇱', category: 'slavic' },
  { code: 'cs', name: 'Ceco', native: 'Čeština', flag: '🇨🇿', category: 'slavic' },

  // Scandinavian & Celtic
  { code: 'sv', name: 'Svedese', native: 'Svenska', flag: '🇸🇪', category: 'scandinavian' },
  { code: 'no', name: 'Norvegese', native: 'Norsk', flag: '🇳🇴', category: 'scandinavian' },
  { code: 'fi', name: 'Finlandese', native: 'Suomi', flag: '🇫🇮', category: 'scandinavian' },
  { code: 'is', name: 'Islandese', native: 'Íslenska', flag: '🇮🇸', category: 'scandinavian' },
  { code: 'ga', name: 'Gaelico Irlandese', native: 'Gaeilge', flag: '🇮🇪', category: 'celtic' },

  // Asian Languages
  { code: 'ja', name: 'Giapponese', native: '日本語', flag: '🇯🇵', category: 'asian' },
  { code: 'ko', name: 'Coreano', native: '한국어', flag: '🇰🇷', category: 'asian' },
  { code: 'zh', name: 'Cinese Mandarino', native: '中文', flag: '🇨🇳', category: 'asian' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳', category: 'asian' },
  { code: 'vi', name: 'Vietnamita', native: 'Tiếng Việt', flag: '🇻🇳', category: 'asian' },
  { code: 'th', name: 'Thailandese', native: 'ไทย', flag: '🇹🇭', category: 'asian' },

  // Middle Eastern & African & Polynesian
  { code: 'ar', name: 'Arabo', native: 'العربية', flag: '🇸🇦', category: 'middle_eastern' },
  { code: 'tr', name: 'Turco', native: 'Türkçe', flag: '🇹🇷', category: 'middle_eastern' },
  { code: 'sw', name: 'Swahili', native: 'Kiswahili', flag: '🇿🇦', category: 'african' },
  { code: 'haw', name: 'Hawaiano', native: 'ʻŌlelo Hawaiʻi', flag: '🌺', category: 'polynesian' },

  // Humor, Fantasy & Classical Chaos Languages
  { code: 'pirate', name: 'Pirate English', native: 'Ahoy Talk', flag: '🏴‍☠️', category: 'humor' },
  { code: 'yoda', name: 'Linguaggio Maestro Yoda', native: 'Yoda-Speak', flag: '🌌', category: 'humor' },
  { code: 'nap', name: 'Napoletano', native: 'Nnapulitano', flag: '🍕', category: 'regional' },
  { code: 'klingon', name: 'Klingon', native: 'tlhIngan Hol', flag: '🛸', category: 'sci_fi' },
  { code: 'elvish', name: 'Elfico Sindarin', native: 'Edhellen', flag: '🧝', category: 'fantasy' },
  { code: 'la', name: 'Latino Classico', native: 'Lingua Latina', flag: '🏛️', category: 'classical' },
  { code: 'eo', name: 'Esperanto', native: 'Esperanto', flag: '🌐', category: 'constructed' }
];

export const getLanguageByCode = (code) => {
  if (!code) return null;
  const normalized = code.toLowerCase().trim();
  return SUPPORTED_LANGUAGES.find((lang) => lang.code.toLowerCase() === normalized) || {
    code: normalized,
    name: 'Lingua Misteriosa',
    native: normalized.toUpperCase(),
    flag: '🔮',
    category: 'custom'
  };
};

export const isValidLanguageCode = (code) => {
  if (!code) return false;
  return SUPPORTED_LANGUAGES.some((lang) => lang.code.toLowerCase() === code.toLowerCase().trim());
};
