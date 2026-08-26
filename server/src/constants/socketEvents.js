/**
 * WhatsApp 2 - Socket.io Event Names Contract
 * Strictly adheres to API_CONTRACT.md section 2
 */
export const SOCKET_EVENTS = {
  // Client-to-Server (Inviati dal Frontend)
  JOIN_ROOM: 'chat:join_room',
  LEAVE_ROOM: 'chat:leave_room',
  SEND_MESSAGE: 'chat:send_message',
  TYPING: 'chat:typing',
  MARK_READ: 'chat:mark_read',

  // Server-to-Client (Ricevuti dal Frontend)
  AUTHENTICATED: 'auth:authenticated',
  NEW_MESSAGE: 'chat:new_message',
  USER_TYPING: 'chat:user_typing',
  PRESENCE_UPDATE: 'chat:presence_update',
  MESSAGES_READ: 'chat:messages_read',
  SOCKET_ERROR: 'error:socket_error'
};
