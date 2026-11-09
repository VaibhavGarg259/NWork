import { useEffect, useState } from "react";
import PostCard from "../components/home/PostCard.jsx";
import { fetchPosts } from "../lib/api";

const PostSkeleton = () => (
  <div className="animate-pulse overflow-hidden rounded-2xl border border-base-300/80 bg-base-100">
    <div className="flex items-center gap-3 p-4 sm:px-5">
      <div className="size-11 rounded-full bg-base-300" />
      <div className="space-y-2">
        <div className="h-3 w-28 rounded bg-base-300" />
        <div className="h-3 w-40 rounded bg-base-300" />
      </div>
    </div>
    <div className="space-y-2 px-4 pb-3 sm:px-5">
      <div className="h-3 w-full rounded bg-base-300" />
      <div className="h-3 w-2/3 rounded bg-base-300" />
      <div className="mt-3 aspect-[4/3] w-full rounded-xl bg-base-200" />
    </div>
  </div>
);

const Homepage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setPosts(await fetchPosts());
      } catch (error) {
        console.error("Error loading posts:", error);
      } finally {
        setLoading(false);
      }
    };
    loadPosts();
  }, []);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 overflow-y-auto px-3 py-5 select-none scrollbar-none sm:px-5">
      {loading ? (
        <>
          <PostSkeleton />
          <PostSkeleton />
        </>
      ) : posts.length > 0 ? (
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
