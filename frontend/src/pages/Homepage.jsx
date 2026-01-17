import { useEffect, useState } from "react";
import { fetchPosts } from "../lib/api";
import useToggleLike from "../hooks/useLike";
import * as jwtDecode from "jwt-decode";
import { Link } from "react-router";
import { Heart } from "lucide-react";

const Homepage = () => {
  const [posts, setPosts] = useState([]);
  const { toggleLikeMutation } = useToggleLike();
  const [commentText, setCommentText] = useState({});

  // get userId from jwt stored in  localStorage
  let userid = null;
  const token = localStorage.getItem("token");

  if (token) {
    try {
      const decoded = jwtDecode.default(token); //decode frontend safely
      userid = decoded.userId; //must match your backend payload
    } catch (error) {
      console.error("Invalid token:", error);
    }
  }

  //Fetch posts from API
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const data = await fetchPosts();
        setPosts(data);
      } catch (error) {
        console.error("Error loading posts:", error);
      }
    };
    loadPosts();
  }, []);

  //optimistic Like update
  const handleLike = (postId) => {
    setPosts((prev) =>
      prev.map((post) =>
        post._id === postId
          ? {
              ...post,
              likes: post.likes?.includes(userid)
                ? post.likes.filter((id) => id !== userid)
                : [...(post.likes || []), userid],
            }
          : post
      )
    );
    toggleLikeMutation(postId); //call backend mutation
  };

  return (
    <div className="max-w-2xl mx-auto mt-6 space-y-4">
      {posts.length > 0 ? (
        posts.map((post) => (
          <div
            key={post._id}
            className="bg-gray-900 text-white p-4 rounded-2xl shadow-md border border-gray-700"
          >
            {/* User Info */}
            <Link to={`/profile/${post.user?._id}`}>
              <div className="flex items-center space-x-3 mb-3">
                <img
                  src={
                    post.user?.profilepic || "https://via.placeholder.com/40"
                  }
                  alt="user avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-sm">
                    {post.user?.FullName || "Unknown User"}
                  </p>
                  <p className="text-xs text-gray-400">{post.user?.email}</p>
                </div>
              </div>
            </Link>

            {/* Post Content */}
            <div className="mb-3">
              <p className="text-base">{post.text}</p>

              {post.media && (
                <div className="mt-3">
                  {/* if media is base64 from backend */}
                  {post.media.data && post.media.contentType ? (
                    <img
                      className="rounded-xl max-h-72 object-cover w-full"
                      src={`data:${post.media.contentType};base64,${post.media.data}`}
                      alt="post media"
                    />
                  ) : (
                    // if media is a URL
                    <img
                      className="rounded-xl max-h-72 object-cover w-full"
                      src={post.media}
                      alt="post media"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between text-gray-400 text-sm mt-2">
              <button
                onClick={() => handleLike(post._id)}
                className={`flex items-center space-x-1 ${
                  post.likes?.includes(userid)
                    ? "text-pink-500"
                    : "hover:text-pink-500"
                }`}
              >
                <Heart className="w-4 h-4" />
                <span>{post.likes?.length || 0} Likes</span>
              </button>
              {/*<button className="flex items-center space-x-1 hover:text-blue-400">
                <MessageCircle className="w-4 h-4" />
                <span>Comment</span>
              </button>
              */}
            </div>
          </div>
        ))
      ) : (
        <p className="text-center text-gray-400">No posts yet</p>
      )}
    </div>
  );
};

export default Homepage;
