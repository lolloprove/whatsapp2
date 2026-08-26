import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
const SAVE_DEBOUNCE_MS = 150;

/**
 * JsonStore - Persistenza MVP su file JSON con scrittura atomica.
 * Carica lo stato all'avvio e salva (debounced) dopo ogni mutazione,
 * così utenti, conversazioni e messaggi sopravvivono al restart del server.
 */
class JsonStore {
  constructor() {
    this.state = { users: [], conversations: [], messages: {} };
    this.saveTimer = null;
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        this.state = {
          users: Array.isArray(parsed.users) ? parsed.users : [],
          conversations: Array.isArray(parsed.conversations) ? parsed.conversations : [],
          messages: parsed.messages && typeof parsed.messages === 'object' ? parsed.messages : {}
        };
        console.log(
          `[JsonStore] Loaded ${this.state.users.length} users, ${this.state.conversations.length} conversations from disk.`
        );
      }
    } catch (err) {
      console.warn('[JsonStore] Load failed, starting empty:', err.message);
    }
  }

  scheduleSave() {
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.saveNow();
    }, SAVE_DEBOUNCE_MS);
    if (typeof this.saveTimer.unref === 'function') this.saveTimer.unref();
  }

  saveNow() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${STORE_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.state), 'utf8');
      fs.renameSync(tmpFile, STORE_FILE);
    } catch (err) {
      console.warn('[JsonStore] Save failed:', err.message);
    }
  }

  flushSync() {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    this.saveNow();
  }
}

export const jsonStore = new JsonStore();

process.on('exit', () => jsonStore.flushSync());
process.on('SIGINT', () => {
  jsonStore.flushSync();
  process.exit(0);
});
process.on('SIGTERM', () => {
  jsonStore.flushSync();
  process.exit(0);
});
