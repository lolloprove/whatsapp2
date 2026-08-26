import { jsonStore } from './jsonStore.js';

/**
 * Contatti di sistema: utenti riservati gestiti dalla piattaforma.
 *
 * L'Onorevole Lisi è il contatto di benvenuto: esiste sempre nello store,
 * accoglie ogni nuovo utente con una conversazione 1-a-1 già avviata
 * e poi resta in silenzio. Non compare mai nella ricerca utenti.
 */
export const LISI_CONTACT = {
  id: 'onorevole-lisi',
  username: 'onorevole_lisi',
  fullName: 'Onorevole Lisi',
  avatarUrl: '/lisi-avatar.png',
  statusMessage: 'Il padrino di questa piazza.'
};

// Username riservati in forma già normalizzata (lowercase, solo [a-z0-9_]).
// Include la variante senza underscore: il normalize rimuove i caratteri
// non ammessi, quindi "onorevole-lisi" diventerebbe "onorevolelisi".
const RESERVED_USERNAMES = new Set(['onorevole_lisi', 'onorevolelisi']);

export function isReservedUsername(normalizedUsername) {
  return RESERVED_USERNAMES.has(normalizedUsername);
}

// Messaggi di benvenuto: asciutti, teatrali, zero riferimenti tecnici.
const SEED_MESSAGES = [
  'Finalmente. Un nome, niente password. Qui funziona così.',
  'Bene. Ora sei dentro.',
  'Se vuoi parlare con qualcuno, cercalo. Qui non si aspetta nessuno.',
  'Trovata la persona giusta, scrivile. Il resto viene da sé.'
];

// Sfasamento all'indietro rispetto a "ora": sembrano arrivati da poco,
// uno alla volta, e restano sempre prima dei messaggi reali dell'utente.
const SEED_OFFSETS_MS = [-240000, -170000, -95000, -20000];

/**
 * Garantisce che il contatto Lisi esista nello store con identità esatta.
 * Gira all'avvio e prima di ogni seed: ripara anche eventuali derive dei campi.
 */
export function ensureSystemContacts() {
  let lisi = jsonStore.state.users.find(
    (u) => u.id === LISI_CONTACT.id || u.username === LISI_CONTACT.username
  );

  if (!lisi) {
    lisi = {
      id: LISI_CONTACT.id,
      username: LISI_CONTACT.username,
      fullName: LISI_CONTACT.fullName,
      avatarUrl: LISI_CONTACT.avatarUrl,
      statusMessage: LISI_CONTACT.statusMessage,
      isSystem: true,
      lastSeen: null,
      createdAt: new Date().toISOString()
    };
    jsonStore.state.users.push(lisi);
    jsonStore.scheduleSave();
    return lisi;
  }

  const drift =
    lisi.fullName !== LISI_CONTACT.fullName ||
    lisi.avatarUrl !== LISI_CONTACT.avatarUrl ||
    lisi.statusMessage !== LISI_CONTACT.statusMessage ||
    lisi.isSystem !== true;
  if (drift) {
    lisi.fullName = LISI_CONTACT.fullName;
    lisi.avatarUrl = LISI_CONTACT.avatarUrl;
    lisi.statusMessage = LISI_CONTACT.statusMessage;
    lisi.isSystem = true;
    jsonStore.scheduleSave();
  }
  return lisi;
}

/**
 * Garantisce che l'utente abbia la sua conversazione di benvenuto con Lisi,
 * con i messaggi iniziali. Idempotente: sicuro chiamarlo a ogni login
 * o fetch conversazioni; non duplica mai conversazione né messaggi.
 */
export function ensureLisiChatForUser(userId) {
  if (!userId || userId === LISI_CONTACT.id) return null;
  const lisi = ensureSystemContacts();

  let conv = jsonStore.state.conversations.find(
    (c) =>
      c.type === 'direct' &&
      c.participants.includes(userId) &&
      c.participants.includes(lisi.id)
  );

  if (!conv) {
    const nowIso = new Date().toISOString();
    conv = {
      id: `conv_lisi_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      type: 'direct',
      participants: [userId, lisi.id],
      createdAt: nowIso,
      updatedAt: nowIso
    };
    jsonStore.state.conversations.push(conv);
    jsonStore.state.messages[conv.id] = [];
  }

  // Seed solo in conversazione vergine: mai doppioni, mai messaggi
  // retrodatati in mezzo a una conversazione già viva.
  const existing = jsonStore.state.messages[conv.id] || [];
  if (existing.length > 0) return conv;

  const now = Date.now();
  SEED_MESSAGES.forEach((text, i) => {
    const createdAt = new Date(now + (SEED_OFFSETS_MS[i] ?? -20000)).toISOString();
    existing.push({
      id: `msg_lisi_seed_${conv.id}_${i}`,
      tempId: null,
      conversationId: conv.id,
      senderId: lisi.id,
      originalContent: text,
      translatedContent: text,
      sourceLanguage: 'it',
      targetLanguage: 'it',
      targetLanguageName: null,
      targetLanguageFlag: null,
      translationProvider: 'none',
      status: 'delivered',
      mediaUrl: null,
      mediaType: null,
      mediaName: null,
      audioDuration: null,
      createdAt,
      updatedAt: createdAt
    });
  });
  conv.updatedAt = existing[existing.length - 1].createdAt;
  jsonStore.scheduleSave();
  return conv;
}
