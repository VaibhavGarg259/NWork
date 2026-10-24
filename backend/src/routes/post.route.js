import express from "express";
import Post from "../models/Post.js";
import upload from "../middleware/upload.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  deleteComment,
  editComment,
  getAllPosts,
  getPostById,
  getPostsByUserId,
  toggleComment,
  toggleLike,
} from "../controllers/Post.controller.js";
import { sharePostToFriend } from "../controllers/share.controller.js";

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
  },
);

// ------------------ Get All Posts ------------------
router.get("/", protectRoute, getAllPosts);

// ------------------ Get Posts by User ------------------
router.get("/user/:userId", protectRoute, getPostsByUserId);

// ------------------ Get Single Post ------------------
router.get("/:postId", protectRoute, getPostById);
// share post
router.post("/share", protectRoute, sharePostToFriend);

// ------------------ Toggle Like ------------------

router.put("/:postId/like", protectRoute, toggleLike);

// // toggle comment
// router.put("/:postId/comment", protectRoute, toggleComment);
// router.put("/:postId/comment", protectRoute, editComment);
// router.delete("/:postId/comment", protectRoute, deleteComment);

/* Create comment */
router.put("/:postId/comment", protectRoute, toggleComment);

/* Edit comment */
router.patch("/:postId/comment/:commentId", protectRoute, editComment);

/* Delete comment */
router.delete("/:postId/comment/:commentId", protectRoute, deleteComment);

export default router;
