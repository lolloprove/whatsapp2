/**
 * E2E smoke test contro il server in esecuzione su localhost:5000.
 * Verifica: registrazione username-only, ricerca utenti reali, creazione
 * conversazione, invio/ricezione messaggi via socket (user room),
 * read receipts e lista conversazioni.
 */
import { io as Client } from 'socket.io-client';

const API = 'http://localhost:5000/api/v1';
const SOCKET = 'http://localhost:5000';

const results = [];
function check(name, ok, extra = '') {
  results.push({ name, ok });
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
}

async function api(path, { method = 'GET', userId, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(userId ? { 'x-user-id': userId } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return { status: res.status, data: await res.json() };
}

function waitEvent(socket, event, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout ${event}`)), timeoutMs);
    socket.once(event, (d) => {
      clearTimeout(t);
      resolve(d);
    });
  });
}

const run = async () => {
  const suffix = Date.now().toString(36);

  // 1. Registrazione username-only di due utenti reali
  const regA = await api('/auth/register', { method: 'POST', body: { username: `alice_e2e_${suffix}`, fullName: 'Alice E2E' } });
  const regB = await api('/auth/register', { method: 'POST', body: { username: `bob_e2e_${suffix}`, fullName: 'Bob E2E' } });
  check('Registrazione Alice', regA.status === 201 && regA.data.data.id, regA.data.data?.id);
  check('Registrazione Bob', regB.status === 201 && regB.data.data.id, regB.data.data?.id);
  const alice = regA.data.data;
  const bob = regB.data.data;

  // 1b. Re-register stesso username -> stesso ID (persistenza credenziale)
  const regA2 = await api('/auth/register', { method: 'POST', body: { username: `alice_e2e_${suffix}` } });
  check('Login implicito stesso username = stesso ID', regA2.status === 200 && regA2.data.data.id === alice.id);

  // 2. Ricerca utenti reali
  const search = await api(`/users/search?q=bob_e2e`, { userId: alice.id });
  check('Ricerca utente reale trova Bob', search.status === 200 && search.data.data.some((u) => u.id === bob.id));
  check('Ricerca esclude se stessi', !search.data.data.some((u) => u.id === alice.id));

  // 3. Creazione conversazione
  const conv = await api('/conversations', { method: 'POST', userId: alice.id, body: { recipientUserId: bob.id } });
  check('Creazione conversazione', conv.status === 200 && Boolean(conv.data.data.id));
  const convId = conv.data.data.id;

  // 4. Socket: Bob si connette MA non joina la stanza (app aperta sulla lista chat)
  const sockA = Client(SOCKET, { auth: { userId: alice.id }, transports: ['websocket'] });
  const sockB = Client(SOCKET, { auth: { userId: bob.id }, transports: ['websocket'] });
  await Promise.all([
    waitEvent(sockA, 'auth:authenticated'),
    waitEvent(sockB, 'auth:authenticated')
  ]);
  check('Handshake socket Alice', true);
  check('Handshake socket Bob', true);

  // Solo Alice joina la stanza (ha la chat aperta)
  sockA.emit('chat:join_room', { conversationId: convId });
  await new Promise((r) => setTimeout(r, 200));

  // 5. Alice invia messaggio via socket -> Bob deve riceverlo sulla user room
  const msgPromise = waitEvent(sockB, 'chat:new_message');
  sockA.emit('chat:send_message', {
    conversationId: convId,
    content: 'Ciao Bob, messaggio E2E!',
    targetLanguage: 'pirate',
    tempId: 'e2e-temp-1'
  });
  const received = await msgPromise;
  check('Bob riceve new_message SENZA joinare la stanza (user room)', received.originalContent === 'Ciao Bob, messaggio E2E!');
  check('Messaggio tradotto dalla pipeline', received.targetLanguage === 'pirate' && received.translatedContent.length > 0, `${received.targetLanguageFlag} ${received.translatedContent}`);

  // 5b. Il mittente riceve la conferma con tempId (reconciliation ottimistica)
  // (Alice è nella stanza, avrebbe ricevuto anche lei: verifica già coperta dai test unit)

  // 6. Bob apre la chat e segna come letta -> Alice riceve messages_read
  const readPromise = waitEvent(sockA, 'chat:messages_read');
  sockB.emit('chat:join_room', { conversationId: convId });
  await new Promise((r) => setTimeout(r, 200));
  sockB.emit('chat:mark_read', { conversationId: convId, messageIds: [] });
  const readData = await readPromise;
  check('Alice riceve messages_read (doppia spunta blu)', readData.readByUserId === bob.id && readData.messageIds.length > 0);

  // 7. Lista conversazioni di Bob: chat presente, ultimo messaggio, unread aggiornato (letto -> 0)
  const convListB = await api('/conversations', { userId: bob.id });
  const convB = convListB.data.data.find((c) => c.id === convId);
  check('Bob vede la conversazione nella sua lista', Boolean(convB));
  check('otherParticipant corretto per Bob', convB?.otherParticipant?.id === alice.id, convB?.otherParticipant?.fullName);
  check('Ultimo messaggio presente nella preview', convB?.lastMessage?.originalContent === 'Ciao Bob, messaggio E2E!');
  check('Unread azzerato dopo mark_read', convB?.unreadCount === 0);

  // 8. Cronologia messaggi via REST
  const history = await api(`/conversations/${convId}/messages`, { userId: bob.id });
  check('Cronologia messaggi via REST', history.status === 200 && history.data.data.messages.length === 1);

  // 9. Persistenza profilo via sync-profile (update nome)
  const sync = await api('/auth/sync-profile', { method: 'POST', userId: bob.id, body: { statusMessage: 'Stato aggiornato E2E' } });
  check('sync-profile aggiorna lo stato', sync.status === 200 && sync.data.data.statusMessage === 'Stato aggiornato E2E');

  sockA.disconnect();
  sockB.disconnect();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n===== E2E: ${results.length - failed.length}/${results.length} PASS =====`);
  process.exit(failed.length > 0 ? 1 : 0);
};

run().catch((err) => {
  console.error('E2E fatal error:', err.message);
  process.exit(1);
});
