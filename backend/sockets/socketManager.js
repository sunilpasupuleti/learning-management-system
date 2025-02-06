// socketManager.js
const socketIo = require("socket.io");

let io;

function initSocket(server) {
  io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "DELETE", "PATCH", "PUT"],
      transports: ["websocket"],
      credentials: true,
    },
    allowEIO3: true,
  });

  return io;
}

function getIo() {
  if (!io) {
    throw new Error("Socket.IO not initialized. Call initSocket first.");
  }
  return io;
}

module.exports = { initSocket, getIo };
