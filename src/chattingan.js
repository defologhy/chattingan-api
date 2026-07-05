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
import GroupMembers from "./databases/models/group_members.js";
import BlockedUsers from "./databases/models/blocked_users.js";
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
  let token = socket.handshake.auth?.token;
  // Fallback ke cookie dari request header (untuk polling transport)
  if (!token && socket.request?.headers?.cookie) {
    const match = socket.request.headers.cookie.match(/(?:^|;\s*)token=([^;]*)/);
    if (match) token = match[1];
  }
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
      const {receiverId, message, messageType, replyToId} = data;
      // Cek block (dua arah)
      const userBlockedReceiver = await BlockedUsers.findOne({
        where: {user_id: userId, blocked_user_id: receiverId},
      });
      if (userBlockedReceiver) {
        return socket.emit("error", {message: "Pesan tidak terkirim. Anda telah memblokir pengguna ini."});
      }
      const userBlockedByReceiver = await BlockedUsers.findOne({
        where: {user_id: receiverId, blocked_user_id: userId},
      });
      if (userBlockedByReceiver) {
        return socket.emit("error", {message: "Pesan tidak terkirim. Anda telah diblokir oleh pengguna ini."});
      }
      const newMsg = await Messages.create({
        sender_id: userId,
        receiver_id: receiverId,
        message,
        message_type: messageType || "text",
        reply_to_id: replyToId || null,
      });
      const receiverSocketId = onlineUsers.get(Number(receiverId));
      let deliveredAt = null;
      if (receiverSocketId) {
        deliveredAt = new Date();
        await Messages.update({delivered_at: deliveredAt}, {where: {id: newMsg.id}});
      }
      const result = {
        id: newMsg.id,
        sender_id: userId,
        sender_name: socket.user.name,
        receiver_id: receiverId,
        message,
        message_type: newMsg.message_type,
        reply_to_id: newMsg.reply_to_id,
        created_at: newMsg.created_at,
        is_read: false,
        delivered_at: deliveredAt,
        read_at: null,
      };
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("message:new", result);
      }
      socket.emit("message:new", result);
    } catch (error) {
      logger.error(`Failed to send message: ${error.message}`);
      socket.emit("error", {message: "Failed to send message"});
    }
  });

  // Edit pesan
  socket.on("message:edit", async (data) => {
    try {
      const {messageId, message} = data;
      const msg = await Messages.findByPk(messageId);
      if (!msg || msg.sender_id !== userId) return;
      await msg.update({message, updated_at: new Date()});
      const result = {messageId, message, updated_at: msg.updated_at};
      // Kirim ke penerima
      if (msg.receiver_id) {
        const receiverSocketId = onlineUsers.get(Number(msg.receiver_id));
        if (receiverSocketId) io.to(receiverSocketId).emit("message:edited", result);
      }
      // Kirim ke semua anggota group
      if (msg.group_id) {
        const members = await GroupMembers.findAll({where: {group_id: msg.group_id}, raw: true});
        members.forEach((member) => {
          const memberSocketId = onlineUsers.get(Number(member.user_id));
          if (memberSocketId) io.to(memberSocketId).emit("message:edited", result);
        });
      }
      socket.emit("message:edited", result);
    } catch (error) {
      logger.error(`Failed to edit message: ${error.message}`);
    }
  });

  // Reaksi pesan
  socket.on("message:react", async (data) => {
    try {
      const {messageId, emoji} = data;
      const msg = await Messages.findByPk(messageId);
      if (!msg) return;
      let reactions = msg.reactions || {};
      if (emoji) {
        reactions[String(userId)] = emoji;
      } else {
        delete reactions[String(userId)];
      }
      await msg.update({reactions});
      const result = {messageId, reactions};
      // Broadcast ke semua pihak terkait
      const targets = [];
      if (msg.receiver_id) targets.push(msg.receiver_id);
      if (msg.group_id) {
        const members = await GroupMembers.findAll({where: {group_id: msg.group_id}, raw: true});
        members.forEach((m) => targets.push(m.user_id));
      }
      targets.push(msg.sender_id);
      [...new Set(targets)].forEach((uid) => {
        const sid = onlineUsers.get(Number(uid));
        if (sid) io.to(sid).emit("message:reacted", result);
      });
    } catch (error) {
      logger.error(`Failed to react: ${error.message}`);
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

  // -- Group Chat Events --
  socket.on("group:send", async (data) => {
    try {
      const {groupId, message, messageType, replyToId} = data;
      // Validasi anggota group
      const membership = await GroupMembers.findOne({
        where: {group_id: groupId, user_id: userId},
      });
      if (!membership) {
        return socket.emit("error", {message: "Anda bukan anggota group ini"});
      }
      const newMsg = await Messages.create({
        sender_id: userId,
        receiver_id: null,
        group_id: groupId,
        message,
        message_type: messageType || "text",
        reply_to_id: replyToId || null,
      });
      const result = {
        id: newMsg.id,
        sender_id: userId,
        sender_name: socket.user.name,
        group_id: groupId,
        message,
        message_type: newMsg.message_type,
        reply_to_id: newMsg.reply_to_id,
        created_at: newMsg.created_at,
        is_read: false,
        read_at: null,
      };
      // Kirim ke semua anggota group yang online
      const members = await GroupMembers.findAll({where: {group_id: groupId}, raw: true});
      members.forEach((member) => {
        const memberSocketId = onlineUsers.get(Number(member.user_id));
        if (memberSocketId) {
          io.to(memberSocketId).emit("group:message", result);
        }
      });
    } catch (error) {
      logger.error(`Failed to send group message: ${error.message}`);
      socket.emit("error", {message: `Failed to send group message: ${error.message}`});
    }
  });

  socket.on("group:typing:start", async (data) => {
    const {groupId} = data;
    const members = await GroupMembers.findAll({where: {group_id: groupId}, raw: true});
    members.forEach((member) => {
      if (Number(member.user_id) !== userId) {
        const memberSocketId = onlineUsers.get(Number(member.user_id));
        if (memberSocketId) {
          io.to(memberSocketId).emit("group:typing", {groupId, userId, isTyping: true});
        }
      }
    });
  });

  socket.on("group:typing:stop", async (data) => {
    const {groupId} = data;
    const members = await GroupMembers.findAll({where: {group_id: groupId}, raw: true});
    members.forEach((member) => {
      if (Number(member.user_id) !== userId) {
        const memberSocketId = onlineUsers.get(Number(member.user_id));
        if (memberSocketId) {
          io.to(memberSocketId).emit("group:typing", {groupId, userId, isTyping: false});
        }
      }
    });
  });

  socket.on("group:read", async (data) => {
    try {
      const {groupId} = data;
      await Messages.update(
        {is_read: true, read_at: new Date()},
        {where: {group_id: groupId, sender_id: {[Op.ne]: userId}, is_read: false}}
      );
    } catch (error) {
      logger.error(`Failed group mark as read: ${error.message}`);
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
