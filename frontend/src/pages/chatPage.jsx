import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
// import { ArrowLeft, Send } from "lucide-react";
import { ArrowLeft, Send, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import useAuthUser from "../hooks/useAuthUser";
import { axiosInstance } from "../lib/axios";
import { socket } from "../lib/socket";
import ChatLoader from "../components/chat/ChatLoader";
import SharedPostPreview from "../components/chat/SharedPostPreview";
import VideoCall from "../components/chat/VideoCall";

// Date separator
const getDateLabel = (dateValue) => {
  if (!dateValue) return "";

  const messageDate = new Date(dateValue);
  if (Number.isNaN(messageDate.getTime())) return "";

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const isSameDay = (first, second) =>
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate();

  if (isSameDay(messageDate, today)) return "Today";
  if (isSameDay(messageDate, yesterday)) return "Yesterday";

  return messageDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year:
      messageDate.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
};

// Normalize history response.
// Adjust this if your backend uses another response structure.
const getHistoryMessages = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.messages)) return data.messages;
  if (Array.isArray(data?.data)) return data.data;

  throw new Error("Unexpected chat history response format");
};

// Merge messages by ID
const mergeMessages = (existing, incoming) => {
  const merged = new Map();

  [...existing, ...incoming].forEach((message) => {
    const key = message?._id ?? message?.id;

    if (key != null) {
      merged.set(String(key), message);
    }
  });

  return [...merged.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
};

const ChatPage = () => {
  const [targetUser, setTargetUser] = useState(null);
  const [isOnline, setIsOnline] = useState(false);

  const { id: targetUserId } = useParams();
  const { authUser, isLoading: authLoading } = useAuthUser();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState(null);

  const messagesContainerRef = useRef(null);
  const authUserId = authUser?._id;

  // Fetch target user
  useEffect(() => {
    if (!targetUserId) return;

    let cancelled = false;

    const fetchTargetUser = async () => {
      try {
        const { data } = await axiosInstance.get(`/users/${targetUserId}`);

        if (!cancelled) {
          setTargetUser(data);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load chat user:", error);
        }
      }
    };

    setTargetUser(null);
    setIsOnline(false);
    fetchTargetUser();

    return () => {
      cancelled = true;
    };
  }, [targetUserId]);

  // Create/load conversation and fetch history
  useEffect(() => {
    if (authLoading) return;
    if (!authUserId || !targetUserId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const initChat = async () => {
      setLoading(true);
      setConversationId(null);
      setMessages([]);

      try {
        const { data: conversation } = await axiosInstance.post(
          "/chat/conversations",
          { receiverId: targetUserId },
        );

        if (cancelled) return;

        const id = conversation._id;

        if (!id) {
          throw new Error("Conversation ID missing");
        }

        setConversationId(id);

        const response = await axiosInstance.get(
          `/chat/conversations/${id}/messages`,
        );

        console.log("CHAT RESPONSE:", response.data);

        const history = getHistoryMessages(response.data);

        if (cancelled) return;

        setMessages((previous) => mergeMessages(previous, history));
      } catch (error) {
        if (!cancelled) {
          console.error("Chat initialization failed:", error);
          toast.error(
            error.response?.data?.message ||
              error.message ||
              "Could not load chat",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    initChat();

    return () => {
      cancelled = true;
    };
  }, [authUserId, authLoading, targetUserId]);

  // Online / offline presence
  // useEffect(() => {
  //   if (!targetUserId) return;

  //   setIsOnline(false);

  //   const handlePresence = ({ userId, isOnline: online }) => {
  //     if (String(userId) === String(targetUserId)) {
  //       setIsOnline(Boolean(online));
  //     }
  //   };

  //   const watch = () => {
  //     socket.emit("presence:watch", targetUserId, (response) => {
  //       setIsOnline(Boolean(response?.isOnline));
  //     });
  //   };

  //   socket.on("presence:update", handlePresence);
  //   socket.on("connect", watch);

  //   if (socket.connected) {
  //     watch();
  //   } else {
  //     socket.connect();
  //   }

  //   return () => {
  //     socket.off("presence:update", handlePresence);
  //     socket.off("connect", watch);
  //     socket.emit("presence:unwatch", targetUserId);
  //   };
  // }, [targetUserId]);
  // Online / offline presence
  useEffect(() => {
    if (!targetUserId || !conversationId) return;

    const handlePresence = ({ userId, isOnline: online }) => {
      if (String(userId) === String(targetUserId)) {
        setIsOnline(Boolean(online));
      }
    };

    const watch = () => {
      socket.emit("presence:watch", targetUserId, (response) => {
        setIsOnline(Boolean(response?.isOnline));
      });
    };

    socket.on("presence:update", handlePresence);
    socket.on("connect", watch);

    if (socket.connected) {
      watch();
    } else {
      socket.connect();
    }

    return () => {
      socket.off("presence:update", handlePresence);
      socket.off("connect", watch);
      socket.emit("presence:unwatch", targetUserId);
      setIsOnline(false);
    };
  }, [targetUserId, conversationId]);

  // Socket connection and real-time messages
  useEffect(() => {
    if (!conversationId) return;

    const handleNewMessage = (message) => {
      const messageConversationId =
        typeof message.conversation === "object"
          ? message.conversation?._id
          : message.conversation;

      if (String(messageConversationId) !== String(conversationId)) {
        return;
      }

      setMessages((previous) => mergeMessages(previous, [message]));
    };

    const handleMessageDeleted = ({ messageId, conversationId: convId }) => {
      if (String(convId) !== String(conversationId)) return;
      markMessageDeleted(messageId);
    };

    const joinRoom = () => {
      socket.emit("joinConversation", conversationId);
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("connect", joinRoom); // reconnect par room dobara join

    if (socket.connected) {
      joinRoom();
    } else {
      socket.connect();
    }

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("connect", joinRoom);

      if (socket.connected) {
        socket.emit("leaveConversation", conversationId);
      }
    };
  }, [conversationId]);

  // Auto-scroll
  useEffect(() => {
    const container = messagesContainerRef.current;

    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // Send normal text message
  const handleSend = async (event) => {
    event.preventDefault();

    const messageText = text.trim();

    if (!messageText || !conversationId || sending) return;

    setSending(true);

    try {
      const { data: savedMessage } = await axiosInstance.post(
        `/chat/conversations/${conversationId}/messages`,
        { text: messageText },
      );

      setMessages((previous) => mergeMessages(previous, [savedMessage]));

      setText("");
    } catch (error) {
      console.error("Message send failed:", error);
      toast.error(error.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const markMessageDeleted = (messageId) => {
    setMessages((previous) =>
      previous.map((m) =>
        String(m._id ?? m.id) === String(messageId)
          ? { ...m, isDeleted: true, text: "", attachments: [] }
          : m,
      ),
    );
  };

  const handleDelete = async (messageId) => {
    if (!conversationId || !messageId) return;
    if (!window.confirm("Delete this message for everyone?")) return;

    try {
      await axiosInstance.delete(
        `/chat/conversations/${conversationId}/messages/${messageId}`,
      );
      markMessageDeleted(messageId);
    } catch (error) {
      console.error("Message delete failed:", error);
      toast.error(error.response?.data?.message || "Failed to delete message");
    }
  };

  const handleBack = () => {
    window.history.back();
  };
  if (authLoading || loading) {
    return <ChatLoader />;
  }

  if (!authUser) {
    return (
      <div className="grid h-full min-h-0 place-items-center rounded-2xl bg-base-200 px-4 text-center text-base-content">
        <p className="text-sm font-medium">Please log in to use chat.</p>
      </div>
    );
  }

  return (
    // <div className="mx-auto flex h-screen min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 text-base-content shadow-xl">
    <div className="mx-auto flex h-screen min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 text-base-content shadow-xl">
      {/* Header */}
      <header className="z-20 flex shrink-0 items-center justify-between border-b border-base-300 bg-base-100 px-3 py-3 sm:px-5 sm:py-4 select-none">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="grid size-10 shrink-0 place-items-center rounded-xl text-base-content/70 transition-colors hover:bg-base-200 hover:text-base-content active:scale-95"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>

          <Link
            to={`/profile/${targetUserId}`}
            className="flex min-w-0 items-center gap-3"
          >
            <div className="avatar shrink-0">
              <div className="w-10 rounded-full ring-2 ring-base-300">
                <img
                  src={targetUser?.profilepic || "/default-avatar.png"}
                  alt={targetUser?.FullName || "User"}
                />
              </div>
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-base font-bold tracking-wide sm:text-lg">
                {targetUser?.FullName || "Loading user..."}
              </h2>

              <p className="mt-0.5 flex items-center gap-1.5 text-xs">
                <span
                  className={`size-2 rounded-full ${
                    isOnline ? "bg-success" : "bg-base-content/40"
                  }`}
                />

                <span
                  className={isOnline ? "text-success" : "text-base-content/60"}
                >
                  {isOnline ? "Online" : "Offline"}
                </span>
              </p>
            </div>
          </Link>
        </div>

        {/* Video call UI */}
        {/* <VideoCall
          conversationId={conversationId}
          targetUserId={targetUserId}
        /> */}
        <VideoCall
          conversationId={conversationId}
          targetUserId={targetUserId}
          targetUser={targetUser}
        />
      </header>

      {/* Messages */}
      <main
        ref={messagesContainerRef}
        className="hide-scrollbar flex-1 min-h-0 space-y-4 overflow-x-hidden overflow-y-auto overscroll-contain bg-base-200/30 p-3 sm:p-5 md:p-6"
      >
        {messages.map((message, index) => {
          const sender =
            message.sender && typeof message.sender === "object"
              ? message.sender
              : null;

          const senderId = sender?._id ?? message.sender;
          const isMine = String(senderId) === String(authUser._id);

          // const senderUser = sender ?? (isMine ? authUser : targetUser);
          const fallbackUser = isMine ? authUser : targetUser;
          const senderUser = { ...fallbackUser, ...sender };

          const senderName =
            senderUser?.FullName ||
            senderUser?.fullName ||
            senderUser?.fullname ||
            "User";

          const senderPic =
            senderUser?.profilepic ||
            senderUser?.profilePic ||
            "/default-avatar.png";

          const currentDate = message.createdAt
            ? new Date(message.createdAt)
            : null;

          const previousDate =
            index > 0 && messages[index - 1].createdAt
              ? new Date(messages[index - 1].createdAt)
              : null;

          const showDate =
            currentDate &&
            !Number.isNaN(currentDate.getTime()) &&
            (index === 0 ||
              !previousDate ||
              Number.isNaN(previousDate.getTime()) ||
              currentDate.toDateString() !== previousDate.toDateString());

          const avatar = (
            <div className="avatar shrink-0">
              <div className="w-8 rounded-full ring-1 ring-base-300">
                <img src={senderPic} alt={senderName} />
              </div>
            </div>
          );

          return (
            <div key={message._id ?? message.id}>
              {showDate && (
                <div className="flex justify-center py-2">
                  <span className="rounded-full border border-base-300 bg-base-100 px-3 py-1 text-xs font-medium text-base-content/65 shadow-sm">
                    {getDateLabel(message.createdAt)}
                  </span>
                </div>
              )}

              <div
                className={`group flex w-full items-end gap-2 ${
                  isMine ? "justify-end" : "justify-start"
                }`}
              >
                {isMine && !message.isDeleted && (
                  <button
                    type="button"
                    onClick={() => handleDelete(message._id ?? message.id)}
                    className="mb-2 grid size-8 shrink-0 place-items-center rounded-lg text-base-content/50 transition hover:bg-error/10 hover:text-error sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label="Delete message"
                    title="Delete message"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                {!isMine && avatar}

                <div
                  className={`flex max-w-[85%] flex-col sm:max-w-[75%] ${
                    isMine ? "items-end" : "items-start"
                  }`}
                >
                  <span className="mb-1 px-1 text-xs font-semibold text-base-content/70">
                    {isMine ? "You" : senderName}
                  </span>

                  <div
                    className={`break-words rounded-2xl px-4 py-3 shadow-sm ${
                      isMine
                        ? "rounded-br-md bg-primary text-primary-content"
                        : "rounded-bl-md border border-base-300 bg-base-100 text-base-content"
                    }`}
                  >
                    {/* <div className="space-y-2">
                      {message.text && (
                        <p className="whitespace-pre-wrap text-sm leading-6">
                          {message.text}
                        </p>
                      )}

                      {message.attachments?.map(
                        (attachment, attachmentIndex) =>
                          attachment.type === "post" ? (
                            <SharedPostPreview
                              key={`${message._id ?? message.id}-post-${attachmentIndex}`}
                              postId={attachment.postId}
                            />
                          ) : null,
                      )}
                    </div> */}

                    <div className="space-y-2">
                      {message.isDeleted ? (
                        <p className="text-sm italic opacity-60">
                          This message was deleted
                        </p>
                      ) : (
                        <>
                          {message.text && (
                            <p className="whitespace-pre-wrap text-sm leading-6">
                              {message.text}
                            </p>
                          )}

                          {message.attachments?.map(
                            (attachment, attachmentIndex) =>
                              attachment.type === "post" ? (
                                <SharedPostPreview
                                  key={`${message._id ?? message.id}-post-${attachmentIndex}`}
                                  postId={attachment.postId}
                                />
                              ) : null,
                          )}
                        </>
                      )}
                    </div>

                    <p className="mt-1.5 text-right text-[10px] text-current opacity-60">
                      {message.createdAt
                        ? new Date(message.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </p>
                  </div>
                </div>

                {isMine && avatar}
              </div>
            </div>
          );
        })}
      </main>

      {/* Message input */}
      <form
        onSubmit={handleSend}
        className="relative z-10 flex w-full shrink-0 items-center gap-2 border-t border-base-300 bg-base-100 p-3 sm:gap-3 sm:p-4"
      >
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Type a message..."
          maxLength={5000}
          className="min-h-12 min-w-0 flex-1 rounded-2xl border border-base-300 bg-base-200 px-4 py-3 text-sm text-base-content outline-none placeholder:text-base-content/40 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
        />

        <button
          type="submit"
          disabled={sending || !text.trim() || !conversationId}
          className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-content shadow-md transition-all duration-200 hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Send message"
        >
          <Send size={19} />
        </button>
      </form>
    </div>
  );
};

export default ChatPage;
