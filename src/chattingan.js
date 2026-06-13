import dotenv from "dotenv";
dotenv.config();

import http from "http";
import {Server} from "socket.io";
import jwt from "jsonwebtoken";
import logger from "./configurations/logger.js";
import sequelize from "./databases/connections/sequelize.js";
import Messages from "./databases/models/messages.js";
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
  logger.info(`User ${socket.user.name} (${userId}) connected`);

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
        receiver_id: receiverId,
        message,
        created_at: newMsg.created_at,
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

  socket.on("disconnect", () => {
    onlineUsers.delete(userId);
    io.emit("users:online", Array.from(onlineUsers.keys()));
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
