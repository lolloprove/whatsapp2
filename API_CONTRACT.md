# 🔌 WhatsApp 2 - API & Socket.io Contract Specification

> **Base URL (REST)**: `http://localhost:5000/api/v1` (or `https://whatsapp2-api.onrender.com/api/v1`)  
> **Socket.io Endpoint**: `ws://localhost:5000` (path: `/socket.io`)  
> **Protocol**: JSON over HTTP & WebSocket  
> **Authentication**: Bearer JWT (Supabase Access Token)

---

## 1. REST API Specification

### 1.1 Authentication & Profile Sync

#### `POST /auth/sync-profile`
Sincronizza l'utente autenticato Supabase con la tabella interna `profiles`. Da chiamare dopo il login/registrazione.

- **Headers**: `Authorization: Bearer <SUPABASE_JWT>`
- **Request Body**:
```json
{
  "username": "mario_rossi",
  "fullName": "Mario Rossi",
  "avatarUrl": "https://avatar.iran.liara.run/public/boy?username=mario",
  "statusMessage": "Sto usando WhatsApp 2 Babel Edition!"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "username": "mario_rossi",
    "fullName": "Mario Rossi",
    "avatarUrl": "https://avatar.iran.liara.run/public/boy?username=mario",
    "statusMessage": "Sto usando WhatsApp 2 Babel Edition!",
    "lastSeen": "2026-08-26T15:30:00Z",
    "createdAt": "2026-08-26T15:00:00Z"
  }
}
```

#### `GET /auth/me`
Recupera il profilo completo dell'utente correntemente autenticato.
- **Headers**: `Authorization: Bearer <SUPABASE_JWT>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "username": "mario_rossi",
    "fullName": "Mario Rossi",
    "avatarUrl": "https://...",
    "statusMessage": "...",
    "isOnline": true
  }
}
```

---

### 1.2 Users & Contacts

#### `GET /users/search?q=:query`
Cerca utenti registrati per iniziare una nuova conversazione.
- **Headers**: `Authorization: Bearer <SUPABASE_JWT>`
- **Query Params**: `q` (string, min 2 caratteri)
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": "b1ffcd88-8b1a-4ef8-bb6d-7cc8bd390b22",
      "username": "giulia_bianchi",
      "fullName": "Giulia Bianchi",
      "avatarUrl": "https://avatar.iran.liara.run/public/girl?username=giulia",
      "isOnline": false,
      "lastSeen": "2026-08-26T15:10:00Z"
    }
  ]
}
```

---

### 1.3 Conversations

#### `GET /conversations`
Ritorna la lista di tutte le conversazioni attive dell'utente autenticato con l'ultimo messaggio tradotto e conteggio non letti.
- **Headers**: `Authorization: Bearer <SUPABASE_JWT>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": "c2aacc77-7a2b-4ef8-bb6d-8dd9bd400c33",
      "type": "direct",
      "otherParticipant": {
        "id": "b1ffcd88-8b1a-4ef8-bb6d-7cc8bd390b22",
        "username": "giulia_bianchi",
        "fullName": "Giulia Bianchi",
        "avatarUrl": "https://...",
        "isOnline": true,
        "lastSeen": "2026-08-26T15:28:00Z"
      },
      "lastMessage": {
        "id": "m3bbdd66-6c3c-4ef8-bb6d-9ee0bd510d44",
        "senderId": "b1ffcd88-8b1a-4ef8-bb6d-7cc8bd390b22",
        "originalContent": "Ci vediamo per un caffè tra dieci minuti?",
        "translatedContent": "Shall we meet for grog in ten ticks o' the clock?",
        "targetLanguage": "pirate",
        "targetLanguageName": "Pirate English",
        "targetLanguageFlag": "🏴‍☠️",
        "createdAt": "2026-08-26T15:29:12Z"
      },
      "unreadCount": 1,
      "updatedAt": "2026-08-26T15:29:12Z"
    }
  ]
}
```

#### `POST /conversations`
Crea o recupera una conversazione diretta esistente con un altro utente.
- **Headers**: `Authorization: Bearer <SUPABASE_JWT>`
- **Request Body**:
```json
{
  "recipientUserId": "b1ffcd88-8b1a-4ef8-bb6d-7cc8bd390b22"
}
```
- **Response `200 OK` / `201 Created`**:
```json
{
  "success": true,
  "data": {
    "id": "c2aacc77-7a2b-4ef8-bb6d-8dd9bd400c33",
    "type": "direct",
    "createdAt": "2026-08-26T15:00:00Z"
  }
}
```

#### `GET /conversations/:conversationId/messages`
Recupera la cronologia dei messaggi per una specifica conversazione (supporta paginazione con cursore).
- **Headers**: `Authorization: Bearer <SUPABASE_JWT>`
- **Query Params**:
  - `limit` (default: 50, max: 100)
  - `before` (ISO timestamp cursor, optional)
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "m3bbdd66-6c3c-4ef8-bb6d-9ee0bd510d44",
        "conversationId": "c2aacc77-7a2b-4ef8-bb6d-8dd9bd400c33",
        "senderId": "b1ffcd88-8b1a-4ef8-bb6d-7cc8bd390b22",
        "originalContent": "Ci vediamo per un caffè tra dieci minuti?",
        "translatedContent": "Shall we meet for grog in ten ticks o' the clock?",
        "sourceLanguage": "it",
        "targetLanguage": "pirate",
        "targetLanguageName": "Pirate English",
        "targetLanguageFlag": "🏴‍☠️",
        "translationProvider": "chaos_fallback_pirate",
        "status": "delivered",
        "createdAt": "2026-08-26T15:29:12Z"
      }
    ],
    "hasMore": false,
    "nextCursor": null
  }
}
```

---

### 1.4 Translation Utilities

#### `GET /translations/languages`
Ritorna l'elenco di tutte le lingue supportate dal motore di traduzione casuale.
- **Response `200 OK`**:
```json
{
  "success": true,
  "count": 32,
  "data": [
    { "code": "ja", "name": "Giapponese", "native": "日本語", "flag": "🇯🇵" },
    { "code": "de", "name": "Tedesco", "native": "Deutsch", "flag": "🇩🇪" },
    { "code": "ru", "name": "Russo", "native": "Русский", "flag": "🇷🇺" },
    { "code": "pirate", "name": "Pirate English", "native": "Ahoy Talk", "flag": "🏴‍☠️" }
  ]
}
```

#### `POST /translations/test-translate`
Endpoint di debug/test per testare la pipeline di traduzione con fallback.
- **Request Body**:
```json
{
  "text": "Ciao come stai?",
  "targetLanguage": "ja" 
}
```
*(Se `targetLanguage` è omesso, il server ne sceglie una a caso)*

---

## 2. Realtime Socket.io Specification

### 2.1 Connection & Handshake

Il client deve inviare il token di autenticazione Supabase nell'handshake:

```typescript
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  auth: {
    token: supabaseAccessToken
  },
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000
});
```

All'autenticazione avvenuta con successo, il server aggiunge il socket al room personale `user:<userId>` e risponde con l'evento `auth:authenticated`.

---

### 2.2 Client-to-Server Events (Inviati dal Frontend)

| Evento | Payload | Descrizione |
| :--- | :--- | :--- |
| `chat:join_room` | `{ "conversationId": "UUID" }` | Il client si iscrive al canale di una specifica conversazione attiva. |
| `chat:leave_room` | `{ "conversationId": "UUID" }` | Il client lascia la visualizzazione della stanza. |
| `chat:send_message` | `{ "conversationId": "UUID", "content": "string", "tempId": "string" }` | Invia un nuovo messaggio di testo. Il server lo traduce e lo salva. |
| `chat:typing` | `{ "conversationId": "UUID", "isTyping": boolean }` | Notifica l'avvio o l'interruzione della digitazione. |
| `chat:mark_read` | `{ "conversationId": "UUID", "messageIds": ["UUID"] }` | Conferma di lettura per i messaggi ricevuti. |

#### Esempio Payload `chat:send_message`:
```json
{
  "conversationId": "c2aacc77-7a2b-4ef8-bb6d-8dd9bd400c33",
  "content": "Stasera pizza e film?",
  "tempId": "client-temp-1724686123-abc"
}
```

---

### 2.3 Server-to-Client Events (Ricevuti dal Frontend)

#### `auth:authenticated`
Emesso subito dopo l'handshake riuscito.
```json
{
  "userId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "status": "connected"
}
```

#### `chat:new_message`
Emesso a tutti i partecipanti della stanza quando un messaggio è stato salvato e tradotto con successo.
```json
{
  "id": "m99eedd1-5e2a-4ef8-bb6d-11aa22bb33cc",
  "tempId": "client-temp-1724686123-abc",
  "conversationId": "c2aacc77-7a2b-4ef8-bb6d-8dd9bd400c33",
  "senderId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "originalContent": "Stasera pizza e film?",
  "translatedContent": "今夜はピザと映画ですか？",
  "sourceLanguage": "it",
  "targetLanguage": "ja",
  "targetLanguageName": "Giapponese",
  "targetLanguageFlag": "🇯🇵",
  "translationProvider": "mymemory_primary",
  "status": "delivered",
  "createdAt": "2026-08-26T15:32:01.000Z"
}
```

#### `chat:user_typing`
Emesso quando l'altro utente sta digitando.
```json
{
  "conversationId": "c2aacc77-7a2b-4ef8-bb6d-8dd9bd400c33",
  "userId": "b1ffcd88-8b1a-4ef8-bb6d-7cc8bd390b22",
  "username": "giulia_bianchi",
  "isTyping": true
}
```

#### `chat:presence_update`
Emesso quando un contatto si connette o si disconnette.
```json
{
  "userId": "b1ffcd88-8b1a-4ef8-bb6d-7cc8bd390b22",
  "isOnline": true,
  "lastSeen": "2026-08-26T15:35:00Z"
}
```

#### `chat:messages_read`
Notifica al mittente che i messaggi sono stati letti (doppia spunta blu).
```json
{
  "conversationId": "c2aacc77-7a2b-4ef8-bb6d-8dd9bd400c33",
  "readByUserId": "b1ffcd88-8b1a-4ef8-bb6d-7cc8bd390b22",
  "messageIds": ["m99eedd1-5e2a-4ef8-bb6d-11aa22bb33cc"]
}
```

#### `error:socket_error`
Emesso in caso di fallimento o autorizzazione mancante.
```json
{
  "code": "TRANSLATION_FAIL_SAFE",
  "message": "Fallback language applied due to provider rate limit",
  "details": null
}
```

---

## 3. TypeScript Shared Interfaces (`shared/contract.ts`)

```typescript
export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string;
  statusMessage?: string;
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
}

export interface LanguageMeta {
  code: string;
  name: string;
  native: string;
  flag: string;
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface ChatMessage {
  id: string;
  tempId?: string;
  conversationId: string;
  senderId: string;
  originalContent: string;
  translatedContent: string;
  sourceLanguage?: string;
  targetLanguage: string;
  targetLanguageName: string;
  targetLanguageFlag: string;
  translationProvider: string;
  status: MessageStatus;
  createdAt: string;
  isOriginalVisible?: boolean; // UI Client state helper
}

export interface ConversationSummary {
  id: string;
  type: 'direct' | 'group';
  otherParticipant?: UserProfile;
  lastMessage?: ChatMessage;
  unreadCount: number;
  updatedAt: string;
}

export interface SendMessagePayload {
  conversationId: string;
  content: string;
  tempId: string;
}
```
