const jwt = require("jsonwebtoken");

const initializeSocket = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error("Authentication error"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.id}`);

    socket.on("join-forum", (eventId) => {
      socket.join(`forum-${eventId}`);
      console.log(`User ${socket.user.id} joined forum-${eventId}`);
    });

    socket.on("leave-forum", (eventId) => {
      socket.leave(`forum-${eventId}`);
      console.log(`User ${socket.user.id} left forum-${eventId}`);
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user.id}`);
    });
  });

  global.io = io;
};

const emitNewMessage = (eventId, message) => {
  if (global.io) {
    global.io.to(`forum-${eventId}`).emit("new-message", message);
  }
};

const emitMessageDeleted = (eventId, messageId) => {
  if (global.io) {
    global.io.to(`forum-${eventId}`).emit("message-deleted", { messageId });
  }
};

const emitMessagePinned = (eventId, messageId, isPinned) => {
  if (global.io) {
    global.io.to(`forum-${eventId}`).emit("message-pinned", { messageId, isPinned });
  }
};

const emitReactionUpdate = (eventId, messageId, reactions) => {
  if (global.io) {
    global.io.to(`forum-${eventId}`).emit("reaction-update", { messageId, reactions });
  }
};

module.exports = {initializeSocket,emitNewMessage,emitMessageDeleted,emitMessagePinned,emitReactionUpdate,};
