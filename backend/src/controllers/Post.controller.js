import Post from "../models/Post.js";

// ---- GET ALL POSTS ----
export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "FullName email profilepic")
      .sort({ createdAt: -1 });

    const formattedPosts = posts.map((post) => {
      let base64Image = null;
      if (post.media?.data) {
        base64Image = `data:${
          post.media.contentType
        };base64,${post.media.data.toString("base64")}`;
      }

      return {
        ...post._doc,
        media: base64Image,
      };
    });

    res.status(200).json(formattedPosts);
  } catch (error) {
    console.error("Get Posts Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ---- GET POSTS BY USER ID ----
export const getPostsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await Post.find({ user: userId })
      .populate("user", "FullName email profilepic")
      .sort({ createdAt: -1 });

    const formattedPosts = posts.map((post) => {
      let base64Image = null;
      if (post.media?.data) {
        base64Image = `data:${
          post.media.contentType
        };base64,${post.media.data.toString("base64")}`;
      }

      return {
        ...post._doc,
        media: base64Image,
      };
    });

    res.status(200).json(formattedPosts);
  } catch (error) {
    console.error("Error in getPostsByUserId:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ---- GET POST BY ID ----
export const getPostById = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId)
      .populate("user", "FullName email profilepic")
      .populate("comments.user", "FullName profilepic");

    if (!post) return res.status(404).json({ message: "Post not found" });

    const postObj = post.toObject();

    let media = null;
    if (postObj.media?.data) {
      media = `data:${postObj.media.contentType};base64,${postObj.media.data.toString("base64")}`;
    }

    res.status(200).json({ ...postObj, media });
  } catch (error) {
    console.error("Error in getPostById:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// like function
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

export const toggleComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    const { text } = req.body;

    // 1. Validate comment text
    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment is required",
      });
    }

    console.log("req.user:", req.user);
    console.log("userId used for comment:", userId);

    // 2. Find post
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // 3. Add comment
    post.comments.push({
      user: userId,
      text: text.trim(),
    });

    // 4. Save post
    await post.save();
    await post.populate("comments.user", "FullName profilepic");

    return res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comments: post.comments,
    });
  } catch (error) {
    console.error("Error adding comment:", error);

    return res.status(500).json({
      success: false,
      message: "Comment server error",
    });
  }
};

// 2. Edit Comment
export const editComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user.id;
    const { text } = req.body;

    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment is required",
      });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const comment = post.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (String(comment.user) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own comments",
      });
    }

    comment.text = text.trim();
    await post.save();

    // populate karo taaki frontend ko user ka naam/pic mil jaye
    await post.populate("comments.user", "FullName profilepic");

    return res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      comments: post.comments,
    });
  } catch (error) {
    console.error("Edit comment error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// 3. Delete Comment
export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const comment = post.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (String(comment.user) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own comments",
      });
    }

    comment.deleteOne();
    await post.save();

    await post.populate("comments.user", "FullName profilepic");

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
      comments: post.comments,
    });
  } catch (error) {
    console.error("Delete comment error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
