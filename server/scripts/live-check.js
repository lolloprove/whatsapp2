/* Live E2E check against the deployed Render backend.
   Usage: node scripts/live-check.js [baseUrl] */
import { io } from 'socket.io-client';

const BASE = process.argv[2] || 'https://whatsapp2-backend-tz1e.onrender.com';
const API = `${BASE}/api/v1`;

const results = [];
const step = (name, ok, note = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${note ? ' — ' + note : ''}`);
};

async function api(path, { method = 'GET', body, userId } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(userId ? { 'x-user-id': userId } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const parsed = await res.json().catch(() => ({}));
  return { status: res.status, data: parsed.data };
}

const uniq = Date.now().toString(36);

try {
  // 1. Health
  const health = await fetch(`${BASE}/health`).then((r) => r.json());
  step('health endpoint', health.status === 'ok');

  // 2. Register two users
  const a = await api('/auth/register', { method: 'POST', body: { username: `live_a_${uniq}`, fullName: 'Live A' } });
  const b = await api('/auth/register', { method: 'POST', body: { username: `live_b_${uniq}`, fullName: 'Live B' } });
  step('register user A', a.status < 300 && Boolean(a.data?.id));
  step('register user B', b.status < 300 && Boolean(b.data?.id));

  // 3. Re-register same username returns same identity (persistenza "login")
  const a2 = await api('/auth/register', { method: 'POST', body: { username: `live_a_${uniq}` } });
  step('re-login same username -> same id', a2.data?.id === a.data.id);

  // 4. Search users
  const search = await api(`/users/search?q=live_b_${uniq}`, { userId: a.data.id });
  step('user search finds B', Array.isArray(search.data) && search.data.some((u) => u.id === b.data.id));

  // 5. Create conversation
  const conv = await api('/conversations', { method: 'POST', body: { recipientUserId: b.data.id }, userId: a.data.id });
  step('create conversation', conv.status < 300 && Boolean(conv.data?.id));
  const convId = conv.data.id;

  // 6. Socket.io realtime: B connects, joins, sends; A must receive
  const sockA = io(BASE, { auth: { userId: a.data.id }, transports: ['websocket'] });
  const sockB = io(BASE, { auth: { userId: b.data.id }, transports: ['websocket'] });

  const connectP = (s, label) =>
    new Promise((resolve) => {
      s.on('connect', () => resolve(true));
      s.on('connect_error', (e) => { console.log(`connect_error ${label}:`, e.message); resolve(false); });
      setTimeout(() => resolve(false), 15000);
    });

  const [okA, okB] = await Promise.all([connectP(sockA, 'A'), connectP(sockB, 'B')]);
  step('socket connect A (websocket)', okA);
  step('socket connect B (websocket)', okB);

  sockA.emit('chat:join_room', { conversationId: convId });
  sockB.emit('chat:join_room', { conversationId: convId });
  await new Promise((r) => setTimeout(r, 500));

  const receivedByA = new Promise((resolve) => {
    sockA.on('chat:new_message', (msg) => resolve(msg));
    setTimeout(() => resolve(null), 15000);
  });
  const readReceiptToB = new Promise((resolve) => {
    sockB.on('chat:messages_read', (payload) => resolve(payload));
    setTimeout(() => resolve(null), 15000);
  });

  sockB.emit('chat:send_message', { conversationId: convId, content: 'Ciao dal deploy live!', tempId: 'tmp_live_1' });

  const msg = await receivedByA;
  step('A receives B message via socket', Boolean(msg), msg ? `provider=${msg.translationProvider} lang=${msg.targetLanguage}` : 'timeout');
  if (msg) {
    step('message translated (Babel)', msg.translatedContent !== undefined && msg.translatedContent.length > 0, `"${msg.translatedContent}"`);
  }

  // 7. Read receipt: A marks read -> B notified
  if (msg) {
    sockA.emit('chat:mark_read', { conversationId: convId, messageIds: [msg.id] });
    const rr = await readReceiptToB;
    step('B receives read receipt', Boolean(rr && rr.readByUserId === a.data.id));
  }

  // 8. Persistence read-back via REST (come un refresh)
  const msgs = await api(`/conversations/${convId}/messages`, { userId: a.data.id });
  step('message persisted & re-fetchable (refresh)', msgs.status === 200 && msgs.data.messages.length === 1);

  const convListB = await api('/conversations', { userId: b.data.id });
  step('conversation list updated for B', convListB.data?.[0]?.lastMessage?.originalContent === 'Ciao dal deploy live!');

  // 9. Security: estraneo bloccato
  const eve = await api('/auth/register', { method: 'POST', body: { username: `live_eve_${uniq}` } });
  const forbidden = await api(`/conversations/${convId}/messages`, { userId: eve.data.id });
  step('non-participant blocked (403)', forbidden.status === 403);

  sockA.disconnect();
  sockB.disconnect();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n=== ${results.length - failed.length}/${results.length} PASS ===`);
  process.exit(failed.length ? 1 : 0);
} catch (e) {
  console.error('FATAL', e);
  process.exit(1);
}
