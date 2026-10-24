import { useEffect, useState } from "react";
import PostCard from "../components/home/PostCard.jsx";
import { fetchPosts } from "../lib/api";

const Homepage = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setPosts(await fetchPosts());
      } catch (error) {
        console.error("Error loading posts:", error);
      }
    };
    loadPosts();
  }, []);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 overflow-y-auto px-3 py-5 select-none scrollbar-none sm:px-5">
      {posts.length > 0 ? (
        posts.map((post) => <PostCard key={post._id} post={post} />)
      ) : (
        <p className="rounded-2xl border border-dashed border-base-300 bg-base-100 px-5 py-12 text-center text-sm text-base-content/60">
          No posts yet
        </p>
      )}
    </div>
  );
};

export default Homepage;
