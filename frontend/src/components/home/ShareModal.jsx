import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Link2, Send, X } from "lucide-react";
import { getUserFriends, sharePostToFriend } from "../../lib/api";

const ShareModal = ({ post, onClose }) => {
  const [sentTo, setSentTo] = useState([]);
  const [sendingId, setSendingId] = useState(null);
  const [copied, setCopied] = useState(false);

  const url = `${window.location.origin}/post/${post._id}`;

  const { data: friends = [], isLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const handleSend = async (friendId) => {
    try {
      setSendingId(friendId);
      await sharePostToFriend({ friendId, postId: post._id, url });
      setSentTo((prev) => [...prev, friendId]);
    } catch (err) {
      alert(err.response?.data?.message || "Could not share post");
    } finally {
      setSendingId(null);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Could not copy link");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-base-100 p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold">Share with friends</h3>
          <button type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="max-h-72 space-y-2 overflow-y-auto">
          {isLoading && (
            <div className="flex justify-center py-6">
              <span className="loading loading-spinner" />
            </div>
          )}

          {!isLoading && friends.length === 0 && (
            <p className="py-6 text-center text-sm text-base-content/60">
              No friends yet
            </p>
          )}

          {friends.map((friend) => {
            const sent = sentTo.includes(friend._id);
            return (
              <div
                key={friend._id}
                className="flex items-center gap-3 rounded-xl p-2 hover:bg-base-200/60"
              >
                <img
                  src={friend.profilepic}
                  alt={friend.FullName}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src =
                      "https://ui-avatars.com/api/?name=" +
                      encodeURIComponent(friend.FullName || "U");
                  }}
                  className="size-10 rounded-full object-cover"
                />
                <p className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {friend.FullName}
                </p>
                <button
                  type="button"
                  disabled={sent || sendingId === friend._id}
                  onClick={() => handleSend(friend._id)}
                  className="btn btn-primary btn-sm"
                >
                  {sent ? <Check size={16} /> : <Send size={16} />}
                  {sent ? "Sent" : sendingId === friend._id ? "..." : "Send"}
                </button>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="btn btn-ghost btn-sm mt-3 w-full"
        >
          {copied ? <Check size={16} /> : <Link2 size={16} />}
          {copied ? "Link copied" : "Copy link"}
        </button>
      </div>
    </div>
  );
};

export default ShareModal;
