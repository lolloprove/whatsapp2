import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Server } from 'socket.io';
import { io as Client } from 'socket.io-client';

// Store temporaneo isolato per i test (non inquina server/data)
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'whatsapp2-test-socket-'));

const { default: app } = await import('../src/app.js');
const { setupSockets } = await import('../src/sockets/index.js');
const { SOCKET_EVENTS } = await import('../src/constants/socketEvents.js');

let server;
let port;
let ioServer;
let baseUrl;

async function registerUser(username, fullName) {
  const res = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, fullName })
  });
  const data = await res.json();
  return data.data;
}

async function createConversation(userId, recipientUserId) {
  const res = await fetch(`${baseUrl}/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    body: JSON.stringify({ recipientUserId })
  });
  const data = await res.json();
  return data.data.id;
}

function connectSocket(userId) {
  return Client(`http://localhost:${port}`, {
    auth: { userId },
    transports: ['websocket']
  });
}

function waitEvent(socket, event, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Timeout waiting for ${event}`)), timeoutMs);
    socket.once(event, (data) => {
      clearTimeout(timeout);
      resolve(data);
    });
  });
}

test.before(async () => {
  server = http.createServer(app);
  ioServer = new Server(server, { cors: { origin: '*' } });
  setupSockets(ioServer);

  await new Promise((resolve) => server.listen(0, resolve));
  port = server.address().port;
  baseUrl = `http://localhost:${port}/api/v1`;
});

test.after(async () => {
  ioServer.close();
  await new Promise((resolve) => server.close(resolve));
});

test('Socket.io handshake rejects unregistered users', async () => {
  const clientSocket = Client(`http://localhost:${port}`, {
    auth: { userId: 'utente_mai_registrato_123' },
    transports: ['websocket']
  });

  const err = await new Promise((resolve) => {
    clientSocket.on('connect_error', (e) => resolve(e));
  });
  assert.ok(err.message.length > 0);
  clientSocket.disconnect();
});

test('Socket.io handshake authenticates registered user and emits auth:authenticated', async () => {
  const user = await registerUser(`socket_tester_${Date.now()}`, 'Socket Tester');
  const clientSocket = connectSocket(user.id);

  const authData = await waitEvent(clientSocket, SOCKET_EVENTS.AUTHENTICATED);
  assert.strictEqual(authData.userId, user.id);
  assert.strictEqual(authData.status, 'connected');
  assert.strictEqual(authData.user.username, user.username);

  clientSocket.disconnect();
});

test('Socket.io messaging flow translates and broadcasts chat:new_message', async () => {
  const alice = await registerUser(`alice_${Date.now()}`, 'Alice');
  const bob = await registerUser(`bob_${Date.now()}`, 'Bob');
  const conversationId = await createConversation(alice.id, bob.id);

  const clientA = connectSocket(alice.id);
  const clientB = connectSocket(bob.id);

  await Promise.all([
    waitEvent(clientA, SOCKET_EVENTS.AUTHENTICATED),
    waitEvent(clientB, SOCKET_EVENTS.AUTHENTICATED)
  ]);

  clientA.emit(SOCKET_EVENTS.JOIN_ROOM, { conversationId });
  clientB.emit(SOCKET_EVENTS.JOIN_ROOM, { conversationId });
  await new Promise((r) => setTimeout(r, 150));

  // Bob riceve anche se NON è nella stanza, grazie alla user room personale
  const messagePromise = waitEvent(clientB, SOCKET_EVENTS.NEW_MESSAGE);

  clientA.emit(SOCKET_EVENTS.SEND_MESSAGE, {
    conversationId,
    content: 'Ciao Bob come va?',
    targetLanguage: 'pirate',
    tempId: 'temp-socket-1'
  });

  const received = await messagePromise;
  assert.strictEqual(received.conversationId, conversationId);
  assert.strictEqual(received.senderId, alice.id);
  assert.strictEqual(received.originalContent, 'Ciao Bob come va?');
  assert.strictEqual(received.targetLanguage, 'pirate');
  assert.strictEqual(received.targetLanguageFlag, '🏴‍☠️');
  assert.strictEqual(received.tempId, 'temp-socket-1');
  assert.ok(received.translatedContent.length > 0);

  clientA.disconnect();
  clientB.disconnect();
});

test('Socket.io typing indicator emits chat:user_typing to other participants', async () => {
  const alice = await registerUser(`alice_typing_${Date.now()}`, 'Alice');
  const bob = await registerUser(`bob_typing_${Date.now()}`, 'Bob');
  const conversationId = await createConversation(alice.id, bob.id);

  const clientA = connectSocket(alice.id);
  const clientB = connectSocket(bob.id);

  await Promise.all([
    waitEvent(clientA, SOCKET_EVENTS.AUTHENTICATED),
    waitEvent(clientB, SOCKET_EVENTS.AUTHENTICATED)
  ]);

  clientA.emit(SOCKET_EVENTS.JOIN_ROOM, { conversationId });
  clientB.emit(SOCKET_EVENTS.JOIN_ROOM, { conversationId });
  await new Promise((r) => setTimeout(r, 150));

  const typingPromise = waitEvent(clientB, SOCKET_EVENTS.USER_TYPING);

  clientA.emit(SOCKET_EVENTS.TYPING, { conversationId, isTyping: true });

  const typingData = await typingPromise;
  assert.strictEqual(typingData.conversationId, conversationId);
  assert.strictEqual(typingData.userId, alice.id);
  assert.strictEqual(typingData.isTyping, true);

  clientA.disconnect();
  clientB.disconnect();
});

test('Socket.io mark_read emits chat:messages_read to the sender', async () => {
  const alice = await registerUser(`alice_read_${Date.now()}`, 'Alice');
  const bob = await registerUser(`bob_read_${Date.now()}`, 'Bob');
  const conversationId = await createConversation(alice.id, bob.id);

  const clientA = connectSocket(alice.id);
  const clientB = connectSocket(bob.id);

  await Promise.all([
    waitEvent(clientA, SOCKET_EVENTS.AUTHENTICATED),
    waitEvent(clientB, SOCKET_EVENTS.AUTHENTICATED)
  ]);

  clientA.emit(SOCKET_EVENTS.JOIN_ROOM, { conversationId });
  clientB.emit(SOCKET_EVENTS.JOIN_ROOM, { conversationId });
  await new Promise((r) => setTimeout(r, 150));

  const readPromise = waitEvent(clientA, SOCKET_EVENTS.MESSAGES_READ);

  clientA.emit(SOCKET_EVENTS.SEND_MESSAGE, {
    conversationId,
    content: 'Messaggio da leggere',
    targetLanguage: 'pirate'
  });
  await new Promise((r) => setTimeout(r, 300));

  clientB.emit(SOCKET_EVENTS.MARK_READ, { conversationId, messageIds: [] });

  const readData = await readPromise;
  assert.strictEqual(readData.conversationId, conversationId);
  assert.strictEqual(readData.readByUserId, bob.id);
  assert.ok(readData.messageIds.length > 0);

  clientA.disconnect();
  clientB.disconnect();
});
