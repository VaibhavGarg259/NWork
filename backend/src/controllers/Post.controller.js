// import Post from "../models/Post.js";

// export const getAllPosts = async (req, res) => {
//   try {
//     const posts = await Post.find()
//       .populate("user", "FullName email profilepic")
//       .sort({ createdAt: -1 });

//     const formattedPosts = posts.map((post) => {
//       let base64Image = null;
//       if (post.media?.data) {
//         base64Image = `data:${
//           post.media.contentType
//         };base64,${post.media.data.toString("base64")}`;
//       }

//       return {
//         ...post._doc,
//         media: base64Image,
//       };
//     });

//     res.status(201).json(formattedPosts);
//   } catch (error) {
//     console.error("Create post error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// export const getPostsByUserId = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const posts = await Post.find({ user: userId })
//       .populate("user", "FullName email profilepic")
//       .sort({ createdAt: -1 });

//     const formattedPosts = posts.map((post) => {
//       let base64Image = null;
//       if (post.media?.data) {
//         base64Image = `data:${
//           post.media.contentType
//         };base64,${post.media.data.toString("base64")}`;
//       }

//       return {
//         ...post._doc,
//         media: base64Image,
//       };
//     });

//     res.json(formattedPosts);
//   } catch {
//     console.error("Error in getPostsByUserId:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // Get single post by postId

// export const getPostById = async (req, res) => {
//   try {
//     const { postId } = req.params;
//     const post = awaitPost
//       .findById(postId)
//       .populate("user", "FullName email profilepic");
//     if (!post) return res.status(404).json({ message: "Post not found" });

//     let base64Image = null;
//     if (post.media?.data) {
//       base64Image = `data:${
//         post.media.contentType
//       };base64,${post.media.data.toString("base64")}`;
//     }

//     res.json({
//       ...post._doc,
//       media: base64Image,
//     });
//   } catch (error) {
//     console.error("Error in getPostById:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

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

    const post = await Post.findById(postId).populate(
      "user",
      "FullName email profilepic"
    );

    if (!post) return res.status(404).json({ message: "Post not found" });

    let base64Image = null;
    if (post.media?.data) {
      base64Image = `data:${
        post.media.contentType
      };base64,${post.media.data.toString("base64")}`;
    }

    res.status(200).json({
      ...post._doc,
      media: base64Image,
    });
  } catch (error) {
    console.error("Error in getPostById:", error);
    res.status(500).json({ message: "Server error" });
  }
};
