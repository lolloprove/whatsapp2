# 📋 WhatsApp 2 - Task Breakdown & Parallel Agent Assignment

> **Coordination Rule**: I task sono divisi in 3 stream paralleli (**Frontend Agent**, **Backend Agent**, **QA & DevOps Agent**).
> Nessun agente deve modificare file di competenza altrui senza previa sincronizzazione su `shared/contract.ts`.

---

## 🎯 Stream 1: Frontend Specialist Agent (FE)

### Obiettivo:
Creare un'interfaccia mobile-first ultra reattiva, pulita e moderna con il design system WhatsApp 2 (Dark theme predefinito, accenti WhatsApp green + neon violet per il "Babel translator"), con animazioni fluide per il reveal del messaggio originale.

### 📁 Cartelle di competenza esclusiva:
`client/` (e sottocartelle)

### 📝 Backlog Task FE:

- [ ] **FE-01 [P0] - Project Bootstrap & Design Tokens**
  - Inizializzare React 18 + Vite + TypeScript in `client/`.
  - Configurare `src/styles/themes.css` e `src/styles/index.css` con le variabili WhatsApp 2 (Dark theme, bubble colors, scrollbar custom, fonts).
  - Installare `lucide-react`, `socket.io-client`, `@supabase/supabase-js`, `canvas-confetti`.

- [ ] **FE-02 [P0] - Supabase Auth & Session State**
  - Implementare `src/context/AuthContext.tsx` per gestire login rapido (email/password o Quick Username login).
  - Creare componenti `LoginForm.tsx` e `RegisterForm.tsx` con design mobile-friendly e validazione input.

- [ ] **FE-03 [P0] - Mobile-First Responsive Layout & Sidebar**
  - Creare il layout principale `src/App.tsx` (Split-view su schermi > 768px, single-view dinamico su mobile con back button).
  - Componente `Sidebar.tsx`: barra profilo utente, campo di ricerca contatti `SearchBar.tsx`, lista chat `ChatListItem.tsx` con badge non letti e orari formattati.
  - Modale `NewChatModal.tsx` per cercare nuovi utenti e iniziare una conversazione.

- [ ] **FE-04 [P0] - Active Chat Window & Message Input**
  - Componente `ChatWindow.tsx`: Header con avatar destinatario, status online/typing, pulsante opzioni.
  - Componente `MessageInput.tsx`: Campo testo elastico auto-espandibile, pulsante emoji, pulsante invio con icona paper-plane / microfono mockup.
  - Auto-scroll intelligente ai nuovi messaggi con rilevamento scroll dell'utente.

- [ ] **FE-05 [P0] - WhatsApp 2 Translation Message Bubble (Signature Feature!)**
  - Componente `MessageBubble.tsx`:
    - Mostra il testo tradotto in primo piano con font chiaro e leggibile.
    - Mostra il badge lingua e bandierina (es. `🇯🇵 Giapponese · Auto-Babel`).
    - Integra il pulsante "Mostra originale / Nascondi originale" con animazione accordion a scorrimento.
    - Doppia spunta grigia/blu per lo status `sent`/`delivered`/`read`.

- [ ] **FE-06 [P1] - Realtime Socket.io Integration**
  - Implementare `src/context/SocketContext.tsx` e `src/context/ChatContext.tsx`.
  - Ascoltare `chat:new_message`, `chat:user_typing`, `chat:presence_update`.
  - Gestire ottimisticamente l'invio del messaggio (mostra messaggio locale in stato `sending` con shimmer di traduzione prima della risposta del server).

- [ ] **FE-07 [P1] - SFX & Haptics Polish**
  - Hook `useSound.ts` per riprodurre suoni leggeri all'invio e ricezione (`send.mp3`, `pop.mp3`).
  - Vibrazione aptica per dispositivi Android/iOS compatibili (`navigator.vibrate`).

---

## ⚙️ Stream 2: Backend & Realtime Specialist Agent (BE)

### Obiettivo:
Realizzare l'architettura server Node.js + Express con Socket.io e la pipeline resiliente di traduzione casuale multi-provider a 3 livelli (Primary -> Secondary -> Fallback).

### 📁 Cartelle di competenza esclusiva:
`server/`, `shared/`

### 📝 Backlog Task BE:

- [ ] **BE-01 [P0] - Project Bootstrap & Architecture**
  - Inizializzare progetto Node.js (ES Modules) in `server/`.
  - Installare `express`, `socket.io`, `@supabase/supabase-js`, `cors`, `dotenv`, `axios`, `zod`.
  - Configurare `server/src/app.js` e `server/src/server.js` con gestione CORS e porta dinamica (`PORT`).

- [ ] **BE-02 [P0] - Supabase Admin Client & JWT Auth Middleware**
  - Configurare client Supabase Admin in `server/src/config/supabase.js`.
  - Creare middleware Express `authMiddleware.js` per validare Bearer token JWT.
  - Creare middleware Socket.io `socketAuthMiddleware.js` per autenticare l'handshake e associare il socket a `socket.userId`.

- [ ] **BE-03 [P0] - Multi-Tier Translation Engine (Resilient Cascade)**
  - `server/src/services/translation/languagePicker.js`: Lista di 30+ lingue (codice ISO, nome, bandiera emoji, fallback humor). Selezione casuale escludendo la lingua sorgente.
  - `server/src/services/translation/primaryProvider.js`: Adapter per API MyMemory / LibreTranslate (con timeout 2.5s).
  - `server/src/services/translation/secondaryProvider.js`: Adapter secondario (Lingva scraper / Google mini endpoint).
  - `server/src/services/translation/fallbackProvider.js`: Motore offline locale (Dizionario frasi/parole + Pig Latin + Pirate + Glitch Babel) per garantire uptime 100%.
  - `server/src/services/translation/index.js`: Orchestratore a catena che intercetta qualsiasi messaggio e restituisce `{ originalText, translatedText, targetLanguage, targetLanguageName, targetLanguageFlag, provider }`.

- [ ] **BE-04 [P0] - REST API Endpoints**
  - `POST /api/v1/auth/sync-profile`: Sincronizzazione profilo utente su Supabase DB.
  - `GET /api/v1/users/search`: Ricerca utenti per username/nome.
  - `GET /api/v1/conversations`: Lista conversazioni con ultimo messaggio tradotto e conteggio unread.
  - `POST /api/v1/conversations`: Creazione/recupero chat diretta tra due utenti.
  - `GET /api/v1/conversations/:id/messages`: Cronologia paginata con cursore.
  - `GET /api/v1/translations/languages`: Lista lingue disponibili.

- [ ] **BE-05 [P0] - Realtime Socket.io Hub**
  - Gestione stanze: `socket.join("conversation:" + conversationId)`.
  - Gestione evento `chat:send_message`:
    1. Validazione payload.
    2. Chiamata al `translationEngine` per tradurre il testo in una lingua random.
    3. Persistenza su Supabase `messages` table.
    4. Broadcast `chat:new_message` alla stanza.
  - Gestione presenza online/offline con broadcast `chat:presence_update`.
  - Gestione evento `chat:typing` debounced.

---

## 🧪 Stream 3: QA, Testing & DevOps Agent (QA)

### Obiettivo:
Garantire qualità del codice, test automatizzati della pipeline di traduzione, simulazione di failover, mocking per sviluppo frontend disaccoppiato e script di deploy.

### 📁 Cartelle di competenza esclusiva:
`server/tests/`, `client/tests/`, file root di configurazione deploy (`Dockerfile`, `render.yaml`, `Procfile`)

### 📝 Backlog Task QA:

- [ ] **QA-01 [P0] - Translation Pipeline Unit & Resilience Tests**
  - Scrivere test con Vitest / Jest per `translationEngine`.
  - Verificare che se l'API Primaria risponde con errore 429/500 o timeout, il sistema passi istantaneamente all'API Secondaria.
  - Verificare che se entrambe le API falliscono (o modalità offline attiva), il `fallbackProvider` generi una traduzione valida senza crashare o bloccare la chat.

- [ ] **QA-02 [P0] - Socket & REST API Contract Verification**
  - Scrivere integration test con `supertest` e `socket.io-client` per verificare i contratti definiti in `API_CONTRACT.md`.
  - Testare il flusso completo: Invio messaggio originale -> Traduzione generata -> Ricezione su socket destinatario.

- [ ] **QA-03 [P1] - Frontend UI Responsiveness & Accessibility Check**
  - Verificare il comportamento della UI su viewport mobile (375px, 414px) e desktop (1440px).
  - Testare che la tastiera virtuale su mobile non copra il campo input (`MessageInput.tsx`).
  - Verificare che il toggle "Mostra originale" sia accessibile tramite touch e tastiera.

- [ ] **QA-04 [P0] - Deployment & Environment Configuration**
  - Creare `render.yaml` e `.env.example` dettagliati con tutte le chiavi richieste (`SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PORT`, `NODE_ENV`).
  - Verificare il comando di build `npm run build` sia per il frontend che per il backend.
