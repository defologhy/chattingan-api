import dotenv from "dotenv";
dotenv.config();

import http from "http";
import {Server} from "socket.io";
import jwt from "jsonwebtoken";
import {Op} from "sequelize";
import logger from "./configurations/logger.js";
import sequelize from "./databases/connections/sequelize.js";
import Messages from "./databases/models/messages.js";
import Users from "./databases/models/users.js";
import app from "./app.js";

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  },
});

const onlineUsers = new Map();

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Authentication required"));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (error) {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.user.id;
  onlineUsers.set(userId, socket.id);
  io.emit("users:online", Array.from(onlineUsers.keys()));
  io.emit("users:last-seen", {userId, lastSeen: null});
  logger.info(`User ${socket.user.name} (${userId}) connected`);

  // Kirim pesan
  socket.on("message:send", async (data) => {
    try {
      const {receiverId, message} = data;
      const newMsg = await Messages.create({
        sender_id: userId,
        receiver_id: receiverId,
        message,
      });
      const result = {
        id: newMsg.id,
        sender_id: userId,
        sender_name: socket.user.name,
        receiver_id: receiverId,
        message,
        created_at: newMsg.created_at,
        is_read: false,
        read_at: null,
      };
      const receiverSocketId = onlineUsers.get(Number(receiverId));
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("message:new", result);
      }
      socket.emit("message:new", result);
    } catch (error) {
      logger.error(`Failed to send message: ${error.message}`);
      socket.emit("error", {message: "Failed to send message"});
    }
  });

  // Typing indicator
  socket.on("typing:start", (data) => {
    const {receiverId} = data;
    const receiverSocketId = onlineUsers.get(Number(receiverId));
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing:update", {userId, isTyping: true});
    }
  });

  socket.on("typing:stop", (data) => {
    const {receiverId} = data;
    const receiverSocketId = onlineUsers.get(Number(receiverId));
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing:update", {userId, isTyping: false});
    }
  });

  // Mark as read
  socket.on("message:read", async (data) => {
    try {
      const {senderId} = data;
      await Messages.update(
        {is_read: true, read_at: new Date()},
        {where: {sender_id: senderId, receiver_id: userId, is_read: false}}
      );
      const senderSocketId = onlineUsers.get(Number(senderId));
      if (senderSocketId) {
        io.to(senderSocketId).emit("messages:read", {userId, readAt: new Date()});
      }
    } catch (error) {
      logger.error(`Failed mark as read: ${error.message}`);
    }
  });

  // Delete message via socket
  socket.on("message:delete", async (data) => {
    try {
      const {messageId, mode} = data;
      const message = await Messages.findByPk(messageId);
      if (!message) return;
      if (message.sender_id !== userId && message.receiver_id !== userId) return;
      if (mode === "self") {
        if (message.deleted_by) {
          const existing = message.deleted_by.split(",");
          if (!existing.includes(String(userId))) {
            existing.push(String(userId));
            await message.update({deleted_by: existing.join(",")});
          }
        } else {
          await message.update({deleted_by: String(userId)});
        }
      } else {
        await message.update({deleted_by: `${message.sender_id},${message.receiver_id}`});
      }
      const receiverId = message.sender_id === userId ? message.receiver_id : message.sender_id;
      const receiverSocketId = onlineUsers.get(Number(receiverId));
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("message:deleted", {messageId, mode});
      }
      socket.emit("message:deleted", {messageId, mode});
    } catch (error) {
      logger.error(`Failed delete message: ${error.message}`);
    }
  });

  socket.on("disconnect", async () => {
    onlineUsers.delete(userId);
    const now = new Date();
    try {
      await Users.update({last_seen: now}, {where: {id: userId}});
    } catch (err) {
      logger.error(`Failed update last_seen: ${err.message}`);
    }
    io.emit("users:online", Array.from(onlineUsers.keys()));
    io.emit("users:last-seen", {userId, lastSeen: now});
    logger.info(`User ${socket.user.name} (${userId}) disconnected`);
  });
});

const PORT = process.env.PORT || 3001;

process.on("uncaughtException", (err) => {
  logger.error(`Uncaught: ${err.message}`);
});

process.on("unhandledRejection", (err) => {
  logger.error(`Unhandled: ${err.message}`);
});

server.on("error", (err) => {
  logger.error(`Server error: ${err.message}`);
});

(async () => {
  try {
    const startTime = Date.now();
    await sequelize.authenticate();
    logger.info("Database connected");
    await sequelize.sync();
    logger.info("Models synced");
    server.listen(PORT, "0.0.0.0", () => {
      logger.info(`Server running on port ${PORT} (${Date.now() - startTime}ms)`);
    });
  } catch (error) {
    logger.error(`Failed to start: ${error.message}`);
    process.exit(1);
  }
})();

setInterval(() => {}, 1 << 30);
