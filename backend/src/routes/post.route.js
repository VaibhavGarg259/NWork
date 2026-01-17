import express from "express";
import Post from "../models/Post.js";
import upload from "../middleware/upload.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getAllPosts,
  getPostById,
  getPostsByUserId,
} from "../controllers/Post.controller.js";

const router = express.Router();

// ------------------ Create Post ------------------
router.post(
  "/create",
  upload.single("file"),
  protectRoute,
  async (req, res) => {
    try {
      const { text } = req.body;
      const file = req.file;

      if (!text && !file) {
        return res.status(400).json({ message: "Post must have text or file" });
      }

      const newPost = new Post({
        text,
        media: file ? { data: file.buffer, contentType: file.mimetype } : null,
        user: req.user.id,
      });

      await newPost.save();

      res
        .status(201)
        .json({ message: "Post created successfully", post: newPost });
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ------------------ Get All Posts ------------------
router.get("/", protectRoute, getAllPosts);

// ------------------ Get Posts by User ------------------
router.get("/user/:userId", protectRoute, getPostsByUserId);

// ------------------ Get Single Post ------------------
router.get("/:postId", protectRoute, getPostById);

// ------------------ Toggle Like ------------------
export const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.likes.includes(userId)) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();
    res.status(200).json(post);
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ message: "Server error" });
  }
};

router.put("/:postId/like", protectRoute, toggleLike);

export default router;
