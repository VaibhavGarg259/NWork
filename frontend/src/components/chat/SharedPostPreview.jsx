import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Heart, MessageCircle, ImageOff, ArrowUpRight } from "lucide-react";
import { fetchPostById } from "../../lib/api";

const SharedPostPreview = ({ postId }) => {
  const {
    data: post,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["post", postId],
    queryFn: () => fetchPostById(postId),
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="w-64 max-w-full overflow-hidden rounded-2xl border border-base-300 bg-base-100 text-base-content sm:w-72">
        <div className="flex animate-pulse items-center gap-2 p-3">
          <div className="size-8 rounded-full bg-base-300" />
          <div className="h-3 w-24 rounded bg-base-300" />
        </div>
        <div className="aspect-video w-full animate-pulse bg-base-200" />
        <div className="space-y-2 p-3">
          <div className="h-3 w-full animate-pulse rounded bg-base-300" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-base-300" />
        </div>
      </div>
    );
  }

  // Error / deleted post
  if (isError || !post) {
    return (
      <div className="flex w-64 max-w-full items-center gap-3 rounded-2xl border border-dashed border-base-300 bg-base-100 p-3 text-base-content sm:w-72">
        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-base-200">
          <ImageOff size={18} className="text-base-content/50" />
        </div>
        <p className="text-xs text-base-content/60">
          This post is no longer available
        </p>
      </div>
    );
  }

  const mediaSrc = typeof post.media === "string" ? post.media : null;
  const authorName = post.user?.FullName || "Unknown user";

  return (
    <Link
      to={`/post/${postId}`}
      className="group block w-64 max-w-full overflow-hidden rounded-2xl border border-base-300 bg-base-100 text-base-content shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md sm:w-72"
    >
      {/* Author */}
      <div className="flex items-center gap-2 px-3 pb-2 pt-3">
        <img
          src={post.user?.profilepic || "https://ui-avatars.com/api/?name=U"}
          alt={authorName}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src =
              "https://ui-avatars.com/api/?name=" +
              encodeURIComponent(authorName);
          }}
          className="size-8 shrink-0 rounded-full border border-primary/30 object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">
            {authorName}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-base-content/50">
            Shared post
          </p>
        </div>
      </div>

      {/* Media */}
      {mediaSrc && (
        <div className="aspect-video w-full overflow-hidden bg-base-200">
          <img
            src={mediaSrc}
            alt="post media"
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}

      {/* Text */}
      {post.text && (
        <p className="line-clamp-3 break-words px-3 pt-2 text-sm leading-5 text-base-content/90">
          {post.text}
        </p>
      )}

      {/* Footer */}
      <div className="mt-2 flex items-center justify-between border-t border-base-300/70 px-3 py-2 text-xs text-base-content/60">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Heart size={14} />
            {post.likes?.length || 0}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle size={14} />
            {post.comments?.length || 0}
          </span>
        </div>
        <span className="flex items-center gap-0.5 font-medium text-primary">
          View post
          <ArrowUpRight
            size={14}
            className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </span>
      </div>
    </Link>
  );
};

export default SharedPostPreview;
