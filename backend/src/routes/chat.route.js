// import express from "express";
// import { protectRoute } from "../middleware/auth.middleware.js";
// import { getStreamToken } from "../controllers/chat.controller.js";

// const router = express.Router();

// router.get("/token", protectRoute, getStreamToken);

// export default router;

import express from "express";
import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getIO } from "../lib/socket.js";

const router = express.Router();

router.use(protectRoute);

// Create or get a one-to-one conversation
router.post("/conversations", async (req, res) => {
  try {
    const { receiverId } = req.body;
    const userId = req.user._id;

    if (
      !mongoose.isValidObjectId(receiverId) ||
      receiverId === String(userId)
    ) {
      return res.status(400).json({
        message: "Invalid receiver",
      });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [userId, receiverId], $size: 2 },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, receiverId],
      });
    }

    res.status(200).json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user's conversations
router.get("/conversations", async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      // .populate("participants", "name username profilePic")
      .populate("sender", "_id FullName profilepic")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get messages from a conversation
router.get("/conversations/:id/messages", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid conversation ID" });
    }

    const conversation = await Conversation.findOne({
      _id: id,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const messages = await Message.find({ conversation: id })
      .populate("sender", "name username profilePic")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send a message

/* Send a message */
router.post("/conversations/:id/messages", async (req, res) => {
  try {
    const { id } = req.params;
    const text = req.body.text?.trim();

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid conversation ID",
      });
    }

    if (!text || text.length > 5000) {
      return res.status(400).json({
        message: "Message must contain 1–5000 characters",
      });
    }

    const conversation = await Conversation.findOne({
      _id: id,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    // Save message in MongoDB
    const message = await Message.create({
      conversation: id,
      sender: req.user._id,
      text,
      readBy: [req.user._id],
    });

    conversation.lastMessage = message._id;
    conversation.updatedAt = new Date();
    await conversation.save();

    // Populate sender details
    const populatedMessage = await Message.findById(message._id).populate(
      "sender",
      "_id FullName profilepic",
    );

    // Broadcast to everyone in this conversation
    getIO().to(`conversation:${id}`).emit("newMessage", populatedMessage);

    // Respond to the sender
    return res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Send message error:", error);

    return res.status(500).json({
      message: "Failed to send message",
    });
  }
});

// Delete own message (for everyone)
router.delete("/conversations/:id/messages/:messageId", async (req, res) => {
  try {
    const { id, messageId } = req.params;

    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(messageId)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const conversation = await Conversation.findOne({
      _id: id,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const message = await Message.findOne({
      _id: messageId,
      conversation: id,
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (String(message.sender) !== String(req.user._id)) {
      return res
        .status(403)
        .json({ message: "You can delete only your own messages" });
    }

    if (!message.isDeleted) {
      message.isDeleted = true;
      message.deletedAt = new Date();
      message.text = "";
      message.attachments = [];
      await message.save();
    }

    getIO()
      .to(`conversation:${id}`)
      .emit("messageDeleted", { messageId, conversationId: id });

    return res.json({ messageId, conversationId: id });
  } catch (error) {
    console.error("Delete message error:", error);
    return res.status(500).json({ message: "Failed to delete message" });
  }
});

export default router;
