import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Post from "../models/Post.js";
import { getIO } from "../lib/socket.js";

export const sharePostToFriend = async (req, res) => {
  try {
    const me = req.user;
    const { friendId, postId } = req.body;

    if (!friendId || !postId) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const isFriend = (me.friends || []).some(
      (id) => String(id) === String(friendId),
    );
    if (!isFriend) {
      return res
        .status(403)
        .json({ message: "You can only share with friends" });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // existing conversation dhundo, nahi hai to banao
    let conversation = await Conversation.findOne({
      participants: { $all: [me._id, friendId], $size: 2 },
    });
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [me._id, friendId],
      });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: me._id,
      text: "",
      attachments: [{ type: "post", postId: post._id }],
    });

    // Message.create ke baad
    await message.populate("sender", "FullName profilepic"); // yahan
    getIO().to(`conversation:${conversation._id}`).emit("newMessage", message);

    return res.status(200).json({ success: true, message });
  } catch (error) {
    console.error("Error in sharePostToFriend:", error);
    return res.status(500).json({ message: "Could not share post" });
  }
};
