import { useState } from "react";
import { Link } from "react-router";
import {
  Heart,
  MessageCircle,
  Pencil,
  Trash2,
  X,
  Check,
  Share2,
} from "lucide-react";
import useToggleLike from "../../hooks/useLike";
import useComment from "../../hooks/useComment";
import useAuthUser from "../../hooks/useAuthUser";
import { editCommentApi, deleteCommentApi, fetchPostById } from "../../lib/api";
import ShareModal from "./ShareModal";

const getMediaSrc = (media) => {
  if (!media) return null;
  if (typeof media === "string") return media;
  if (media.data && media.contentType)
    return `data:${media.contentType};base64,${media.data}`;
  return null;
};

const PostCard = ({ post: initialPost, defaultOpenComments = false }) => {
  const [post, setPost] = useState(initialPost);
  const [openComments, setOpenComments] = useState(defaultOpenComments);
  const [commentText, setCommentText] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState("");
  const [savingCommentId, setSavingCommentId] = useState(null);
  // const [copied, setCopied] = useState(false);

  const { authUser } = useAuthUser();
  const userid = authUser?._id;
  const { toggleLikeMutation } = useToggleLike();
  const { commentMutation, isPending } = useComment();

  const mediaSrc = getMediaSrc(post.media);
  const sameId = (id) => String(id?._id ?? id) === String(userid);
  const hasLiked = post.likes?.some(sameId);

  const handleLike = () => {
    setPost((prev) => ({
      ...prev,
      likes: prev.likes?.some(sameId)
        ? prev.likes.filter((id) => !sameId(id))
        : [...(prev.likes || []), userid],
    }));
    toggleLikeMutation(post._id);
  };

  const handleComment = () => {
    const text = commentText.trim();
    if (!text) return;

    commentMutation(
      { postId: post._id, text },
      {
        onSuccess: async (data) => {
          if (Array.isArray(data?.comments)) {
            setPost((prev) => ({ ...prev, comments: data.comments }));
          } else {
            try {
              setPost(await fetchPostById(post._id));
            } catch (e) {
              console.error(e);
            }
          }
          setCommentText("");
        },
      },
    );
  };

  const updateComments = (serverComments, fallback) =>
    setPost((prev) => ({
      ...prev,
      comments: Array.isArray(serverComments)
        ? serverComments
        : fallback(prev.comments || []),
    }));

  const handleEditSubmit = async (e, commentId) => {
    e.preventDefault();
    const text = editText.trim();
    if (!text) return;
    try {
      setSavingCommentId(commentId);
      const data = await editCommentApi(post._id, commentId, text);
      updateComments(data?.comments, (cs) =>
        cs.map((c) => (c._id === commentId ? { ...c, text } : c)),
      );
      setEditingComment(null);
      setEditText("");
    } catch (err) {
      alert(
        err.response?.data?.message || err.message || "Could not edit comment",
      );
    } finally {
      setSavingCommentId(null);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      setSavingCommentId(commentId);
      const data = await deleteCommentApi(post._id, commentId);
      updateComments(data?.comments, (cs) =>
        cs.filter((c) => c._id !== commentId),
      );
    } catch (err) {
      alert(
        err.response?.data?.message ||
          err.message ||
          "Could not delete comment",
      );
    } finally {
      setSavingCommentId(null);
    }
  };

  const [showShare, setShowShare] = useState(false);
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-base-300/80 bg-base-100 text-base-content shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-xl">
      {/* User Info */}
      <Link to={`/profile/${post.user?._id}`}>
        <div className="flex items-center gap-3 p-4 transition-colors hover:bg-base-200/60 sm:px-5">
          <img
            src={post.user?.profilepic || "https://ui-avatars.com/api/?name=U"}
            alt="user avatar"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src =
                "https://ui-avatars.com/api/?name=" +
                encodeURIComponent(post.user?.FullName || "U");
            }}
            className="size-11 shrink-0 rounded-full border-2 border-primary/30 object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold sm:text-base">
              {post.user?.FullName || "Unknown User"}
            </p>
            <p className="truncate text-xs text-base-content/55">
              {post.user?.email}
            </p>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="mb-3 px-4 sm:px-5">
        <p className="whitespace-pre-wrap break-words text-sm leading-6 sm:text-base sm:leading-7">
          {post.text}
        </p>
        {mediaSrc && (
          <div className="mt-3 overflow-hidden rounded-xl bg-base-200/70">
            <img
              src={mediaSrc}
              alt="post media"
              loading="lazy"
              className="max-h-[520px] min-h-40 w-full object-contain"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-2 flex items-center gap-1 border-t border-base-300/80 px-3 py-2 sm:gap-3 sm:px-4">
        <button
          type="button"
          onClick={handleLike}
          className={`flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all active:scale-95 ${
            hasLiked
              ? "bg-pink-500/10 text-pink-500"
              : "text-base-content/60 hover:bg-pink-500/10 hover:text-pink-500"
          }`}
        >
          <Heart className={`size-5 ${hasLiked ? "fill-current" : ""}`} />
          <span className="text-sm font-semibold">
            {post.likes?.length || 0} Likes
          </span>
        </button>

        <button
          type="button"
          onClick={() => setOpenComments((v) => !v)}
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-base-content/60 transition-all hover:bg-primary/10 hover:text-primary"
        >
          <MessageCircle size={20} />
          <span className="text-sm font-semibold">
            {(post.comments || []).length} Comments
          </span>
        </button>

        {/* share button  */}
        {/* <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-base-content/60 transition-all hover:bg-primary/10 hover:text-primary active:scale-95"
        >
          {copied ? <Check size={20} /> : <Share2 size={20} />}
          <span className="text-sm font-semibold">
            {copied ? "Link copied" : "Share"}
          </span>
        </button> */}
        <button
          type="button"
          onClick={() => setShowShare(true)}
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-base-content/60 transition-all hover:bg-primary/10 hover:text-primary active:scale-95"
        >
          <Share2 size={20} />
          <span className="text-sm font-semibold">Share</span>
        </button>
      </div>

      {/* Comments */}
      {openComments && (
        <div className="border-t border-base-300/80 p-3 sm:px-4">
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleComment();
            }}
          >
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              maxLength={1000}
              className="min-w-0 flex-1 rounded-xl border border-base-300 bg-base-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={isPending || !commentText.trim()}
              className="rounded-xl bg-primary px-3 py-2.5 text-primary-content disabled:opacity-50"
            >
              {isPending ? "Sending..." : "Send"}
            </button>
          </form>

          <div className="mt-4 space-y-3">
            {(post.comments || []).map((comment, index) => {
              const isOwner = sameId(comment.user);
              const isEditing = editingComment === comment._id;
              const isBusy = savingCommentId === comment._id;

              return (
                <div
                  key={comment._id || `${post._id}-${index}`}
                  className="rounded-xl bg-base-200/70 p-3"
                >
                  {isEditing ? (
                    <form
                      className="flex gap-2"
                      onSubmit={(e) => handleEditSubmit(e, comment._id)}
                    >
                      <input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        maxLength={1000}
                        autoFocus
                        className="min-w-0 flex-1 rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm"
                      />
                      <button type="submit" title="Save" disabled={isBusy}>
                        <Check size={18} />
                      </button>
                      <button
                        type="button"
                        title="Cancel"
                        onClick={() => {
                          setEditingComment(null);
                          setEditText("");
                        }}
                      >
                        <X size={18} />
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {comment.user?.FullName && (
                          <p className="text-xs font-semibold text-base-content/70">
                            {comment.user.FullName}
                          </p>
                        )}
                        <p className="break-words text-sm">{comment.text}</p>
                      </div>

                      {isOwner && comment._id && (
                        <div className="flex gap-3">
                          <button
                            type="button"
                            title="Edit"
                            onClick={() => {
                              setEditingComment(comment._id);
                              setEditText(comment.text);
                            }}
                            className="text-base-content/60 hover:text-primary"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            disabled={isBusy}
                            onClick={() => handleDeleteComment(comment._id)}
                            className="text-base-content/60 hover:text-error disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {showShare && (
        <ShareModal post={post} onClose={() => setShowShare(false)} />
      )}
    </div>
  );
};

export default PostCard;
