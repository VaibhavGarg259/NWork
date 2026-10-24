import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import PostCard from "../components/home/PostCard";
import { fetchPostById } from "../lib/api";

const PostPage = () => {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    fetchPostById(postId)
      .then((data) => !cancelled && setPost(data))
      .catch((err) => {
        if (cancelled) return;
        setError(
          err.response?.status === 404
            ? "Post not found"
            : "Could not load post",
        );
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [postId]);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-3 py-5 sm:px-5">
      <Link to="/" className="text-sm text-primary hover:underline">
        ← Back to feed
      </Link>

      {loading && (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg" />
        </div>
      )}

      {!loading && error && (
        <p className="rounded-2xl border border-dashed border-base-300 bg-base-100 px-5 py-12 text-center text-sm text-base-content/60">
          {error}
        </p>
      )}

      {!loading && post && (
        <PostCard key={post._id} post={post} defaultOpenComments />
      )}
    </div>
  );
};

export default PostPage;
