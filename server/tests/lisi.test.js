import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Store temporaneo isolato per i test (non inquina server/data)
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'whatsapp2-test-lisi-'));

const { default: app } = await import('../src/app.js');

let server;
let baseUrl;

const LISI_ID = 'onorevole-lisi';
const LISI_USERNAME = 'onorevole_lisi';
const EXPECTED_SEEDS = [
  'Finalmente. Un nome, niente password. Qui funziona così.',
  'Bene. Ora sei dentro.',
  'Se vuoi parlare con qualcuno, cercalo. Qui non si aspetta nessuno.',
  'Trovata la persona giusta, scrivile. Il resto viene da sé.'
];

async function register(username, fullName = 'Tester') {
  const res = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, fullName })
  });
  return { status: res.status, body: await res.json() };
}

async function getConversations(userId) {
  const res = await fetch(`${baseUrl}/conversations`, {
    headers: { 'x-user-id': userId }
  });
  return (await res.json()).data;
}

async function getMessages(userId, convId) {
  const res = await fetch(`${baseUrl}/conversations/${convId}/messages`, {
    headers: { 'x-user-id': userId }
  });
  return (await res.json()).data.messages;
}

function lisiConvs(convs) {
  return convs.filter((c) => c.otherParticipant?.id === LISI_ID);
}

test.before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://localhost:${server.address().port}/api/v1`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('nuovo utente riceve UNA chat con Lisi, identità esatta e 4 messaggi seed', async () => {
  const { status, body } = await register(`lisi_test_alpha_${Date.now()}`);
  assert.strictEqual(status, 201);
  const user = body.data;

  const convs = await getConversations(user.id);
  const mine = lisiConvs(convs);
  assert.strictEqual(mine.length, 1);

  const lisi = mine[0].otherParticipant;
  assert.strictEqual(lisi.fullName, 'Onorevole Lisi');
  assert.strictEqual(lisi.username, LISI_USERNAME);
  assert.strictEqual(lisi.avatarUrl, '/lisi-avatar.png');
  assert.strictEqual(lisi.isSystem, true);

  const msgs = await getMessages(user.id, mine[0].id);
  assert.strictEqual(msgs.length, EXPECTED_SEEDS.length);
  assert.deepStrictEqual(
    msgs.map((m) => m.originalContent),
    EXPECTED_SEEDS
  );
  for (const m of msgs) {
    assert.strictEqual(m.senderId, LISI_ID);
  }
  // Timestamp sfalsati e strettamente crescenti
  for (let i = 1; i < msgs.length; i++) {
    assert.ok(new Date(msgs[i].createdAt) > new Date(msgs[i - 1].createdAt));
  }
});

test('idempotenza: re-register, login e fetch ripetuti non duplicano chat né messaggi', async () => {
  const username = `lisi_test_beta_${Date.now()}`;
  const first = await register(username);
  const userId = first.body.data.id;

  // Re-register (login implicito) + doppio fetch conversazioni
  await register(username);
  await getConversations(userId);
  const convs = await getConversations(userId);

  const mine = lisiConvs(convs);
  assert.strictEqual(mine.length, 1);
  const msgs = await getMessages(userId, mine[0].id);
  assert.strictEqual(msgs.length, EXPECTED_SEEDS.length);
});

test('ogni utente ha la PROPRIA chat Lisi, separata dalle altre', async () => {
  const a = (await register(`lisi_test_gamma_${Date.now()}`)).body.data;
  const b = (await register(`lisi_test_delta_${Date.now()}`)).body.data;

  const convsA = lisiConvs(await getConversations(a.id));
  const convsB = lisiConvs(await getConversations(b.id));
  assert.strictEqual(convsA.length, 1);
  assert.strictEqual(convsB.length, 1);
  assert.notStrictEqual(convsA[0].id, convsB[0].id);
});

test('l\'utente può rispondere a Lisi: messaggio persiste, Lisi non risponde', async () => {
  const user = (await register(`lisi_test_reply_${Date.now()}`)).body.data;
  const conv = lisiConvs(await getConversations(user.id))[0];

  const sendRes = await fetch(`${baseUrl}/conversations/${conv.id}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
    body: JSON.stringify({ content: 'Ricevuto, Onorevole.' })
  });
  assert.strictEqual(sendRes.status, 200);

  // Nessun meccanismo di risposta automatica: attesa breve, poi verifica
  await new Promise((r) => setTimeout(r, 400));
  const msgs = await getMessages(user.id, conv.id);
  assert.strictEqual(msgs.length, EXPECTED_SEEDS.length + 1);
  const last = msgs[msgs.length - 1];
  assert.strictEqual(last.senderId, user.id);
  assert.strictEqual(last.originalContent, 'Ricevuto, Onorevole.');
  assert.strictEqual(msgs.filter((m) => m.senderId === LISI_ID).length, EXPECTED_SEEDS.length);
});

test('username riservato "onorevole_lisi" e varianti normalizzate sono rifiutati', async () => {
  for (const candidate of ['onorevole_lisi', 'onorevolelisi']) {
    const { status, body } = await register(candidate);
    assert.strictEqual(status, 400, `atteso 400 per ${candidate}`);
    assert.strictEqual(body.success, false);
    // Mai un login implicito col contatto di sistema
    assert.notStrictEqual(body?.data?.id, LISI_ID);
  }
});

test('Lisi non compare mai nella ricerca utenti', async () => {
  const user = (await register(`lisi_test_search_${Date.now()}`)).body.data;

  for (const q of ['', 'lisi', 'onorevole', 'onorevole_lisi']) {
    const res = await fetch(`${baseUrl}/users/search?q=${encodeURIComponent(q)}`, {
      headers: { 'x-user-id': user.id }
    });
    const data = (await res.json()).data;
    assert.ok(Array.isArray(data));
    assert.ok(
      !data.some((u) => u.id === LISI_ID || u.username === LISI_USERNAME || u.isSystem),
      `query "${q}" non deve contenere Lisi`
    );
  }
});
