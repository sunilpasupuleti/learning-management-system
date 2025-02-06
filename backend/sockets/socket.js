const logger = require("../middleware/logger/logger");

let socketUsers = {};

module.exports = function socket(io) {
  io.on("connection", (socket) => {
    socket.setMaxListeners(15);
    var handshakeData = socket.request._query;
    if (handshakeData && handshakeData.id) {
      let metadata = handshakeData.id;
      socketUsers[socket.id] = metadata;
      // console.log(JSON.parse(handshakeData));
    }
    logger.debug("CLIENT CONNECTED with ID -  " + socket.id);

    socket.on("refreshUserData", (data) => {
      io.to(socket.id).emit("refreshUserData", data);
    });

    socket.on("refreshBatches", (data) => {
      io.to(socket.id).emit("refreshBatches", data);
    });

    socket.on("refreshUsers", (data) => {
      io.to(socket.id).emit("refreshUsers", data);
    });

    socket.on("refreshQuiz", (data) => {
      io.to(socket.id).emit("refreshQuiz", data);
    });

    socket.on("refreshCourses", (data) => {
      io.to(socket.id).emit("refreshCourses", data);
    });

    socket.on("refreshResources", (data) => {
      io.to(socket.id).emit("refreshResources", data);
    });

    socket.on("disconnect", (data) => {
      delete socketUsers[socket.id];
      logger.warn("CLIENT DISCONNECTED with ID -  " + socket.id);
    });
  });
};
