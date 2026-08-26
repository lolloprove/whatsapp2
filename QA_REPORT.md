# QA Report — WhatsApp 2 (MVP cleanup)

Data: 26/08/2026 — Ruolo: QA + refactor/cleanup

## Esito verifiche automatiche

| Verifica | Risultato |
|---|---|
| Build client (`tsc -b && vite build`) | ✅ 0 errori |
| Lint client (`oxlint`) | ✅ 0 errori, solo warning benigni (pattern context/hook) |
| Test server (`node --test`) | ✅ 28/28 passati |
| Smoke test REST E2E | ✅ vedi sotto |
| Test runtime browser (Chrome headless, viewport 390×844) | ✅ 11/11 passi, 0 errori console, 0 page error |

### Smoke test REST eseguiti
- Registrazione username → 201/200 con ID stabile
- Validazione input (username di 1 carattere) → 400 con messaggio leggibile
- Richiesta senza `x-user-id` → 401
- Creazione conversazione diretta → 200
- Invio messaggio → traduzione reale via provider primario (MyMemory), verificato Unicode valido nel payload e in `store.json`
- Lettura messaggi, unread count → coerenti
- Utente estraneo legge i messaggi altrui → **403** (falla di accesso chiusa)
- Persistenza: riavvio server con ricarica da `server/data/store.json` ✅

### Test runtime mobile (headless Chrome 390×844)
Onboarding → registrazione `qa_browser` → lista chat vuota → ricerca contatto → apertura conversazione → invio messaggio (bolla tradotta + spunte + presence "online") → ritorno alla lista → impostazioni (tema chiaro/scuro, suoni, profilo).
- Console: **0 errori**, 0 warning rilevanti
- Network: nessuna richiesta fallita (solo abort benigni delle anteprime avatar DiceBear durante la digitazione)
- Layout: nessun overflow orizzontale, tab bar, FAB, bottom sheet e splash corretti a 390px

## Bug corretti in questa sessione

1. **`server/src/middlewares/errorHandler.js`** — precedenza operatori: `err.statusCode || res.statusCode >= 400 ? ...` valutava quasi sempre 500. Ora rispetta `err.statusCode`.
2. **`validateMiddleware.js` (zod v4)** — gli errori di validazione crashavano con `Cannot read properties of undefined (reading 'map')` perché zod v4 espone `err.issues`, non `err.errors`. Verificato live, ora restituisce 400 leggibile.
3. Rimozioni dead code client: `loginAsGuest` (AuthContext), campo `isBot` dai tipi, parametro `_userToken` da `apiRequest` + call site, `playToggleSound` inutilizzato, `hero.png` orfano, dipendenza `@supabase/supabase-js` non usata.
4. **Player vocale finto** in `MessageBubble`: pulsante play/pausa che animava solo i colori di una waveform hardcoded senza riprodurre audio (e nessun client può più inviare audio). Rimosso.

## Feature finte rimosse (cleanup complessivo del MVP)

- Tab **Chiamate** e tab **Stato** con dati mock, `CallModal`, `StoryViewerModal`
- Pulsanti finti in `ChatHeader` (audio/video call), camera finta e riga "Archiviate" in `Sidebar`, voci morte in Impostazioni
- `mockData.ts` + fallback mock offline in `api.ts`, bot auto-risponditori client e server demo
- Componenti mai usati: `AuthModal`, `LoginModal`, `SettingsBottomSheet`, `LanguageSelectorModal`, CSS duplicati, asset template
- Testi fuorvianti ("crittografia E2E") sostituiti; branding uniformato a "WhatsApp 2"

## Cosa manca davvero (da pianificare, non bug)

1. **Toggle "mostra originale"** — il client mostra solo `translatedContent`; il testo originale è salvato ma non visualizzabile in UI.
2. **Paginazione messaggi in UI** — il server supporta cursore `before`/`hasMore`, il client carica solo gli ultimi 50.
3. **Retry messaggi falliti** — lo stato `failed` mostra un'icona rossa ma non c'è modo di reinviare.
4. **Note vocali reali** — UI finta rimossa; registrazione audio non implementata (il contratto dati la supporta già).
5. **Chat di gruppo** — il tipo esiste nel contratto, nessuna UI/endpoint.
6. **Test client** — assenti; il server ha copertura (28 test).
7. **Upload media su storage** — le immagini viaggiano in base64 dentro i messaggi e in `store.json` (limite 15MB configurato): ok per MVP, non scala.

## Limitazioni note (decisioni MVP, non bug)

- **Auth username-only**: chi conosce uno username esistente può "rientrare" come quell'utente (il register fa da login). Accettabile per demo locale, da sostituire con credenziali reali prima di qualsiasi rilascio.
- **Header `x-user-id` auto-dichiarato**: nessun token firmato; stessa nota sopra.
- Presence solo online/offline (nessun "ultimo accesso" in UI anche se `lastSeen` è tracciato).
- CORS aperto (`origin: '*'`) e nessun rate limit applicato: ok in dev.
