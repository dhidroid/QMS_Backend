let io;

function init(server) {
  const socketIo = require("socket.io");
  io = socketIo(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("socket connected", socket.id);

    socket.on("display:join", () => {
      console.log("display joined", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("disconnected", socket.id);
    });
  });
  return io;
}

function getIO() {
  if (!io)
    throw new Error("Socket.io not initialized. Call init(server) first.");
  return io;
}

module.exports = { init, getIO };
