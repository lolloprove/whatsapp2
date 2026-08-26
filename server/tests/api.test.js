import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Store temporaneo isolato per i test (non inquina server/data)
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'whatsapp2-test-api-'));

const { default: app } = await import('../src/app.js');

let server;
let baseUrl;
let userA;
let userB;

test.before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}/api/v1`;

  // Registra due utenti reali usati dai test
  const regA = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: `tester_mario_${Date.now()}`, fullName: 'Mario Tester' })
  });
  userA = (await regA.json()).data;

  const regB = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: `tester_giulia_${Date.now()}`, fullName: 'Giulia Tester' })
  });
  userB = (await regB.json()).data;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('GET /health & /api/v1/health returns ok status', async () => {
  const res = await fetch(`${baseUrl}/health`);
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.status, 'ok');
  assert.strictEqual(data.service, 'WhatsApp 2 Babel Server');
});

test('POST /auth/register creates a persistent username-only user', async () => {
  const username = `nuovo_utente_${Date.now()}`;
  const res = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, fullName: 'Nuovo Utente' })
  });
  const data = await res.json();
  assert.strictEqual(res.status, 201);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.username, username);
  assert.ok(data.data.id);

  // Stessa username -> stesso utente (login implicito, idempotente)
  const res2 = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  });
  const data2 = await res2.json();
  assert.strictEqual(res2.status, 200);
  assert.strictEqual(data2.data.id, data.data.id);
});

test('POST /auth/register rejects invalid usernames', async () => {
  const res = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'x' })
  });
  assert.strictEqual(res.status, 400);
});

test('GET /auth/me requires a registered user', async () => {
  const resAnon = await fetch(`${baseUrl}/auth/me`);
  assert.strictEqual(resAnon.status, 401);

  const resUnknown = await fetch(`${baseUrl}/auth/me`, {
    headers: { 'x-user-id': 'utente_inesistente_999' }
  });
  assert.strictEqual(resUnknown.status, 401);

  const res = await fetch(`${baseUrl}/auth/me`, {
    headers: { 'x-user-id': userA.id }
  });
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.data.id, userA.id);
  assert.strictEqual(data.data.username, userA.username);
});

test('POST /auth/sync-profile updates user profile', async () => {
  const res = await fetch(`${baseUrl}/auth/sync-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userA.id
    },
    body: JSON.stringify({
      fullName: 'Mario Tester Aggiornato',
      statusMessage: 'Disponibile per chat Babel'
    })
  });
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.data.id, userA.id);
  assert.strictEqual(data.data.fullName, 'Mario Tester Aggiornato');
});

test('GET /users/search finds registered users matching query', async () => {
  const res = await fetch(`${baseUrl}/users/search?q=giulia`, {
    headers: { 'x-user-id': userA.id }
  });
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(Array.isArray(data.data));
  assert.ok(data.data.some((u) => u.id === userB.id));
  // L'utente corrente non deve comparire nei risultati
  assert.ok(!data.data.some((u) => u.id === userA.id));
});

test('POST /conversations creates or gets direct conversation', async () => {
  const res = await fetch(`${baseUrl}/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userA.id
    },
    body: JSON.stringify({ recipientUserId: userB.id })
  });
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(data.data.id);
  assert.strictEqual(data.data.type, 'direct');
});

test('GET /conversations returns conversation list with lastMessage and otherParticipant', async () => {
  const res = await fetch(`${baseUrl}/conversations`, {
    headers: { 'x-user-id': userA.id }
  });
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(Array.isArray(data.data));
  assert.ok(data.data.length > 0);
  assert.strictEqual(data.data[0].otherParticipant.id, userB.id);
});

test('POST /conversations/:id/messages sends message and returns translation metadata', async () => {
  const convRes = await fetch(`${baseUrl}/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userA.id
    },
    body: JSON.stringify({ recipientUserId: userB.id })
  });
  const convId = (await convRes.json()).data.id;

  const msgRes = await fetch(`${baseUrl}/conversations/${convId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userA.id
    },
    body: JSON.stringify({
      content: 'Ci vediamo stasera al porto?',
      targetLanguage: 'pirate'
    })
  });
  const msgData = await msgRes.json();
  assert.strictEqual(msgRes.status, 200);
  assert.strictEqual(msgData.success, true);
  assert.strictEqual(msgData.data.originalContent, 'Ci vediamo stasera al porto?');
  assert.strictEqual(msgData.data.targetLanguage, 'pirate');
  assert.strictEqual(msgData.data.targetLanguageFlag, '🏴‍☠️');
  assert.ok(msgData.data.translatedContent);

  const listRes = await fetch(`${baseUrl}/conversations/${convId}/messages`, {
    headers: { 'x-user-id': userB.id }
  });
  const listData = await listRes.json();
  assert.strictEqual(listRes.status, 200);
  assert.ok(listData.data.messages.length >= 1);
});

test('GET /conversations/:id/messages rejects non-participants', async () => {
  const res = await fetch(`${baseUrl}/conversations/conv_inesistente/messages`, {
    headers: { 'x-user-id': userA.id }
  });
  assert.strictEqual(res.status, 403);
});

test('GET /translations/languages returns 30+ supported languages', async () => {
  const res = await fetch(`${baseUrl}/translations/languages`);
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(data.count >= 30, `Expected >= 30 languages, got ${data.count}`);
  const pirate = data.data.find((l) => l.code === 'pirate');
  assert.ok(pirate);
  assert.strictEqual(pirate.flag, '🏴‍☠️');
});

test('POST /translations/test-translate translates text properly', async () => {
  const res = await fetch(`${baseUrl}/translations/test-translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'Ciao amico pizza', targetLanguage: 'pirate' })
  });
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.targetLanguage, 'pirate');
  assert.ok(data.data.translatedContent.includes('Ahoy') || data.data.translatedContent.includes('matey'));
});
