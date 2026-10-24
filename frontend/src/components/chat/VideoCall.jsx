import { useEffect, useRef, useState } from "react";
import { Phone, PhoneCall, PhoneOff, Video } from "lucide-react";
import toast from "react-hot-toast";
import { socket } from "../../lib/socket";

const formatTime = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

const VideoCall = ({ conversationId, targetUserId, targetUser }) => {
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [callLoading, setCallLoading] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timeoutRef = useRef(null);
  const incomingRef = useRef(null);

  const clearRingTimeout = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  };

  const callUserName =
    targetUser?.FullName ||
    targetUser?.fullName ||
    targetUser?.fullname ||
    "User";
  const callUserPic =
    targetUser?.profilepic || targetUser?.profilePic || "/default-avatar.png";

  useEffect(() => {
    incomingRef.current = incomingCall;
  }, [incomingCall]);

  // Call timer
  useEffect(() => {
    if (activeCall?.status !== "accepted") {
      setSeconds(0);
      return;
    }
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [activeCall?.status]);

  useEffect(() => {
    const handleIncoming = (data) => {
      if (String(data.conversationId) !== String(conversationId)) return;
      setIncomingCall(data);
    };
    const handleRinging = ({ callId, type }) => {
      clearRingTimeout();
      setCallLoading(false);
      setActiveCall({ callId, type, status: "ringing" });
    };
    const handleAccepted = (data = {}) => {
      clearRingTimeout();
      const inc = incomingRef.current;
      setCallLoading(false);
      setIncomingCall(null);
      setActiveCall({
        callId: data.callId ?? inc?.callId,
        type: data.type ?? inc?.type ?? "video",
        status: "accepted",
      });
    };
    const reset = (message, isError) => () => {
      clearRingTimeout();
      setCallLoading(false);
      setActiveCall(null);
      setIncomingCall(null);
      if (message) (isError ? toast.error : toast)(message);
    };
    const handleError = (data) => reset(data?.message || "Call failed", true)();
    const onRejected = reset("Call rejected", true);
    const onEnded = reset("Call ended", false);

    socket.on("call:incoming", handleIncoming);
    socket.on("call:ringing", handleRinging);
    socket.on("call:accepted", handleAccepted);
    socket.on("call:rejected", onRejected);
    socket.on("call:ended", onEnded);
    socket.on("call:error", handleError);

    return () => {
      clearRingTimeout();
      socket.off("call:incoming", handleIncoming);
      socket.off("call:ringing", handleRinging);
      socket.off("call:accepted", handleAccepted);
      socket.off("call:rejected", onRejected);
      socket.off("call:ended", onEnded);
      socket.off("call:error", handleError);
    };
  }, [conversationId]);

  const startCall = (type) => {
    if (!conversationId || !targetUserId) {
      toast.error("Conversation is not ready");
      return;
    }
    if (!socket.connected) {
      toast.error("Socket disconnected. Reconnecting...");
      socket.connect();
      return;
    }
    if (activeCall || incomingCall || callLoading) return;

    setCallLoading(true);
    socket.emit("call:start", { conversationId, toUserId: targetUserId, type });

    timeoutRef.current = setTimeout(() => {
      setCallLoading(false);
      toast.error("No response from server");
    }, 30000);
  };

  const acceptCall = () => {
    if (incomingCall?.callId)
      socket.emit("call:accept", { callId: incomingCall.callId });
  };

  const rejectCall = () => {
    if (!incomingCall?.callId) return;
    socket.emit("call:reject", { callId: incomingCall.callId });
    setIncomingCall(null);
  };

  const endCall = () => {
    if (!activeCall?.callId) return;
    socket.emit("call:end", { callId: activeCall.callId });
    setActiveCall(null);
    setCallLoading(false);
  };

  const busy = callLoading || !!activeCall || !!incomingCall;
  const btn =
    "grid size-10 shrink-0 place-items-center rounded-xl text-primary transition-colors hover:bg-primary/10 disabled:opacity-50";

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => startCall("audio")}
          disabled={busy}
          className={btn}
          aria-label="Audio call"
          title="Audio call"
        >
          <Phone size={20} />
        </button>
        <button
          type="button"
          onClick={() => startCall("video")}
          disabled={busy}
          className={btn}
          aria-label="Video call"
          title="Video call"
        >
          <Video size={21} />
        </button>
      </div>

      {callLoading && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-base-300 px-4 py-3 shadow-lg">
          Calling...
        </div>
      )}

      {incomingCall && (
        // <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4">
        //   <div className="w-full max-w-sm rounded-2xl bg-base-100 p-6 text-base-content shadow-2xl">
        //     <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
        //       <PhoneCall size={28} />
        //     </div>
        //     <h2 className="text-center text-lg font-bold">
        //       Incoming {incomingCall.type === "audio" ? "audio" : "video"} call
        //     </h2>
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-base-100 p-6 text-base-content shadow-2xl">
            <div className="avatar mx-auto mb-4 flex justify-center">
              <div className="w-20 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-base-100">
                <img src={callUserPic} alt={callUserName} />
              </div>
            </div>

            <h2 className="text-center text-xl font-bold">{callUserName}</h2>
            <p className="mt-1 text-center text-sm opacity-70">
              Incoming {incomingCall.type === "audio" ? "audio" : "video"} call
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={acceptCall}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-success px-4 py-3 font-semibold text-white"
              >
                <PhoneCall size={18} /> Accept
              </button>
              <button
                type="button"
                onClick={rejectCall}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-error px-4 py-3 font-semibold text-white"
              >
                <PhoneOff size={18} /> Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {activeCall && (
        <div className="fixed inset-0 z-[110] flex flex-col items-center justify-between bg-base-300/95 p-8 text-base-content backdrop-blur">
          <div />

          {/* <div className="flex flex-col items-center gap-4">
            <div className="grid size-28 place-items-center rounded-full bg-primary/10 text-primary">
              {activeCall.type === "audio" ? (
                <Phone size={48} />
              ) : (
                <Video size={48} />
              )}
            </div>
            <h2 className="text-xl font-bold">
              {activeCall.type === "audio" ? "Audio call" : "Video call"}
            </h2>
            <p className="text-sm opacity-70">
              {activeCall.status === "ringing"
                ? "Ringing..."
                : formatTime(seconds)}
            </p>
          </div> */}
          <div className="flex flex-col items-center gap-4">
            <div className="avatar">
              <div className="w-28 rounded-full ring-4 ring-primary/40">
                <img src={callUserPic} alt={callUserName} />
              </div>
            </div>

            <h2 className="text-2xl font-bold">{callUserName}</h2>

            <p className="flex items-center gap-2 text-sm opacity-70">
              {activeCall.type === "audio" ? (
                <Phone size={16} />
              ) : (
                <Video size={16} />
              )}
              {activeCall.status === "ringing"
                ? "Ringing..."
                : formatTime(seconds)}
            </p>
          </div>

          <button
            type="button"
            onClick={endCall}
            className="grid size-16 place-items-center rounded-full bg-error text-white shadow-lg active:scale-95"
            aria-label="End call"
          >
            <PhoneOff size={28} />
          </button>
        </div>
      )}
    </>
  );
};

export default VideoCall;
