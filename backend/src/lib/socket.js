import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import crypto from "node:crypto";
let io;

// In-memory call state (single server only)
const calls = new Map();
const userCalls = new Map();

const authenticateSocket = async (socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie || "";

    const tokenCookie = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("jwt="));

    const token = tokenCookie ? decodeURIComponent(tokenCookie.slice(4)) : null;

    if (!token) return next(new Error("Unauthorized"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.userId).select("_id");

    if (!user) return next(new Error("Unauthorized"));

    socket.userId = user._id.toString();
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
};

const isParticipant = async (conversationId, userId) => {
  if (!conversationId) return false;
  if (!/^[a-f\d]{24}$/i.test(conversationId)) return false;

  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId,
  }).select("_id participants");

  return conversation;
};

const isUserOnline = (id) =>
  (io.sockets.adapter.rooms.get(`user:${id}`)?.size ?? 0) > 0;

const isCallMember = (call, userId) =>
  call && [call.callerId, call.receiverId].includes(userId);

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  // Authenticate every socket connection
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    const userId = socket.userId;

    // Each user can receive calls on all their connected devices
    socket.join(`user:${userId}`);

    // Pehla socket connect hua = user abhi online hua (multi-tab me baar-baar nahi)
    if (io.sockets.adapter.rooms.get(`user:${userId}`)?.size === 1) {
      io.to(`presence:${userId}`).emit("presence:update", {
        userId,
        isOnline: true,
      });
    }
    // Join conversation after membership verification
    socket.on("joinConversation", async (conversationId) => {
      try {
        const conversation = await isParticipant(conversationId, userId);

        if (!conversation) {
          return socket.emit("socket:error", {
            message: "Conversation access denied",
          });
        }

        socket.join(`conversation:${conversationId}`);
      } catch {
        socket.emit("socket:error", {
          message: "Could not join conversation",
        });
      }
    });

    // Kisi user ka online status follow karo (sirf jiske saath conversation hai)
    socket.on("presence:watch", async (targetId, ack) => {
      try {
        const id = String(targetId ?? "");

        if (!/^[a-f\d]{24}$/i.test(id)) return ack?.({ isOnline: false });

        const shared = await Conversation.exists({
          participants: { $all: [userId, id] },
        });

        if (!shared) return ack?.({ isOnline: false });

        socket.join(`presence:${id}`);
        ack?.({ userId: id, isOnline: isUserOnline(id) });
      } catch {
        ack?.({ isOnline: false });
      }
    });

    socket.on("presence:unwatch", (targetId) => {
      socket.leave(`presence:${String(targetId ?? "")}`);
    });

    // Existing chat event (relay only)
    // socket.on("sendMessage", async ({ conversationId, message } = {}) => {
    //   try {
    //     const conversation = await isParticipant(conversationId, userId);

    //     if (!conversation || !message) return;

    //     io.to(`conversation:${conversationId}`).emit("newMessage", message);
    //   } catch (error) {
    //     console.error("sendMessage error:", error.message);
    //   }
    // });

    socket.on("sendMessage", async ({ conversationId, message } = {}) => {
      try {
        const conversation = await isParticipant(conversationId, userId);

        if (!conversation || !message) return;

        // Sender details database se lo
        const sender = await User.findById(userId)
          .select("_id FullName profilepic")
          .lean();

        if (!sender) return;

        // Client ke sender ko trust nahi karna
        // const newMessage = {
        //   ...message,
        //   sender: {
        //     _id: sender._id.toString(),
        //     fullName: sender.fullName || sender.fullname || "User",
        //     profilePic: sender.profilePic || "",
        //   },
        const newMessage = {
          ...message,
          sender: {
            _id: sender._id.toString(),
            FullName: sender.FullName || "User",
            profilepic: sender.profilepic || "",
          },
        };

        io.to(`conversation:${conversationId}`).emit("newMessage", newMessage);
      } catch (error) {
        console.error("sendMessage error:", error.message);
      }
    });

    socket.on(
      "call:start",
      async ({ conversationId, toUserId, receiverId: rid, type } = {}) => {
        try {
          const receiverId = String(toUserId ?? rid ?? "");
          const callType = type === "audio" ? "audio" : "video";
          if (!receiverId || receiverId === userId) return;

          const conversation = await isParticipant(conversationId, userId);
          if (!conversation) return;

          const members = conversation.participants.map((id) => id.toString());
          if (!members.includes(receiverId)) return;

          if (userCalls.has(userId) || userCalls.has(receiverId)) {
            socket.emit("call:error", { message: "User is busy" });
            return;
          }

          const callId = crypto.randomUUID();
          calls.set(callId, {
            callId,
            conversationId,
            callerId: userId,
            receiverId,
            type: callType,
            status: "ringing",
          });
          userCalls.set(userId, callId);
          userCalls.set(receiverId, callId);

          io.to(`user:${receiverId}`).emit("call:incoming", {
            callId,
            conversationId,
            callerId: userId,
            type: callType,
          });
          socket.emit("call:ringing", { callId, type: callType });
        } catch (error) {
          console.error("call:start error:", error.message);
          socket.emit("call:error", { message: "Could not start call" });
        }
      },
    );

    // 2. Accept call
    socket.on("call:accept", ({ callId } = {}) => {
      const call = calls.get(callId);

      if (!call || call.receiverId !== userId) return;
      if (call.status !== "ringing") return;

      // call.status = "accepted";

      // io.to(`user:${call.callerId}`).emit("call:accepted", {
      //   callId,
      // });
      call.status = "accepted";
      io.to(`user:${call.callerId}`)
        .to(`user:${call.receiverId}`)
        .emit("call:accepted", { callId });
    });

    // 3. Reject call
    socket.on("call:reject", ({ callId } = {}) => {
      const call = calls.get(callId);

      if (!call || call.receiverId !== userId) return;
      if (call.status !== "ringing") return;

      io.to(`user:${call.callerId}`).emit("call:rejected", {
        callId,
      });

      calls.delete(callId);
      userCalls.delete(call.callerId);
      userCalls.delete(call.receiverId);
    });

    // 4. WebRTC signaling relay
    const relaySignal = (eventName) => {
      socket.on(eventName, ({ callId, data } = {}) => {
        const call = calls.get(callId);

        if (!call || call.status !== "accepted") return;
        if (!isCallMember(call, userId)) return;

        const peerId =
          call.callerId === userId ? call.receiverId : call.callerId;

        io.to(`user:${peerId}`).emit(eventName, {
          callId,
          from: userId,
          data,
        });
      });
    };

    relaySignal("call:offer");
    relaySignal("call:answer");
    relaySignal("call:ice-candidate");

    // 5. End call
    socket.on("call:end", ({ callId } = {}) => {
      const call = calls.get(callId);

      if (!call || !isCallMember(call, userId)) return;

      const peerId = call.callerId === userId ? call.receiverId : call.callerId;

      io.to(`user:${peerId}`).emit("call:ended", { callId });

      calls.delete(callId);
      userCalls.delete(call.callerId);
      userCalls.delete(call.receiverId);
    });

    // Disconnect handling will be added next.
    // socket.on("disconnect", () => {
    //   const callId = userCalls.get(userId);
    //   if (!callId) return;
    //   // user ke baaki tabs/devices connected hain to call mat todo
    //   if (io.sockets.adapter.rooms.get(`user:${userId}`)?.size) return;

    //   const call = calls.get(callId);
    //   if (call) {
    //     const peerId =
    //       call.callerId === userId ? call.receiverId : call.callerId;
    //     io.to(`user:${peerId}`).emit("call:ended", { callId });
    //     userCalls.delete(call.callerId);
    //     userCalls.delete(call.receiverId);
    //     calls.delete(callId);
    //   }
    // });
    socket.on("disconnect", () => {
      // Dusra tab/device connected hai to user abhi bhi online hai
      if (isUserOnline(userId)) return;

      io.to(`presence:${userId}`).emit("presence:update", {
        userId,
        isOnline: false,
      });

      const callId = userCalls.get(userId);
      if (!callId) return;

      const call = calls.get(callId);
      if (call) {
        const peerId =
          call.callerId === userId ? call.receiverId : call.callerId;
        io.to(`user:${peerId}`).emit("call:ended", { callId });
        userCalls.delete(call.callerId);
        userCalls.delete(call.receiverId);
        calls.delete(callId);
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
};
