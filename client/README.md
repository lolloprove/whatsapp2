# WhatsApp 2 — Client

Frontend mobile-first dell'app di messaggistica realtime **WhatsApp 2**: registrazione con solo username, chat 1-a-1 in tempo reale e traduzione automatica "Babel" dei messaggi in una lingua casuale (motore a cascata lato server).

## Stack

- React 19 + TypeScript + Vite
- Socket.io client per messaggi, typing indicator, presence e read receipts
- Nessun dato mock: ogni dato proviene dal backend (`server/`)

## Avvio

```bash
npm install
npm run dev
```

Richiede il backend in esecuzione sulla porta 5000 (vedi `server/`).
Variabili d'ambiente opzionali: `VITE_API_URL`, `VITE_SOCKET_URL`.

## Script

- `npm run dev` — dev server con HMR
- `npm run build` — type-check (`tsc -b`) + build di produzione
- `npm run lint` — oxlint
