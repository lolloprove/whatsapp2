import http from 'node:http';
import { Server } from 'socket.io';
import app from './app.js';
import { setupSockets } from './sockets/index.js';
import { config } from './config/env.js';

const PORT = config.port;
const server = http.createServer(app);

// Socket.io initialization
const io = new Server(server, {
  cors: {
    origin: config.corsOrigin,
    methods: ['GET', 'POST']
  },
  pingTimeout: 30000,
  pingInterval: 10000,
  maxHttpBufferSize: 15 * 1024 * 1024 // supporta media base64 (foto, audio, documenti)
});

// Rende io accessibile ai controller REST per il broadcast realtime
app.set('io', io);

// Setup sockets
setupSockets(io);

// Start listening
server.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 WhatsApp 2 Backend Server Running!`);
  console.log(`📍 Port: http://localhost:${PORT}`);
  console.log(`⚡ Realtime: Socket.io Active`);
  console.log(`🌍 Babel Translation Cascade: Ready`);
  console.log(`=========================================`);
});
