import { useEffect, useRef, useState, useCallback } from "react";
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import toast from "react-hot-toast";
import { socket } from "../../lib/socket";

const formatTime = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

// WebRTC configuration
const ICE_SERVERS = [
  {
    urls: "stun:stun.l.google.com:19302",
  },
  ...(import.meta.env.VITE_TURN_URL
    ? [
        {
          urls: import.meta.env.VITE_TURN_URL,
          username: import.meta.env.VITE_TURN_USERNAME,
          credential: import.meta.env.VITE_TURN_CREDENTIAL,
        },
      ]
    : []),
];

const VideoCall = ({ conversationId, targetUserId, targetUser }) => {
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [callLoading, setCallLoading] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [speakerOn, setSpeakerOn] = useState(false);

  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);

  const incomingRef = useRef(null);
  const activeCallRef = useRef(null);
  const callIdRef = useRef(null);
  const roleRef = useRef(null);

  const setupPromiseRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  const timeoutRef = useRef(null);
  const audioRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const callUserName =
    targetUser?.FullName ||
    targetUser?.fullName ||
    targetUser?.fullname ||
    "User";

  const callUserPic =
    targetUser?.profilepic || targetUser?.profilePic || "/default-avatar.png";

  // Keep active call state and ref synchronized
  const updateActiveCall = useCallback((value) => {
    activeCallRef.current = value;
    setActiveCall(value);
  }, []);

  const clearRingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Close peer connection and stop local media
  const cleanupMedia = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.ontrack = null;
      peerRef.current.onicecandidate = null;
      peerRef.current.onconnectionstatechange = null;
      peerRef.current.close();
      peerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      localStreamRef.current = null;
    }

    remoteStreamRef.current = null;
    setupPromiseRef.current = null;
    pendingCandidatesRef.current = [];

    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setCameraOff(false);

    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  }, []);

  const resetCall = useCallback(
    (message, isError = false) => {
      clearRingTimeout();
      cleanupMedia();

      callIdRef.current = null;
      roleRef.current = null;
      incomingRef.current = null;

      setIncomingCall(null);
      setCallLoading(false);
      updateActiveCall(null);

      if (message) {
        isError ? toast.error(message) : toast(message);
      }
    },
    [clearRingTimeout, cleanupMedia, updateActiveCall],
  );

  // Create WebRTC connection and get microphone/camera
  const setupPeerConnection = useCallback(async (callId, type) => {
    if (peerRef.current) return peerRef.current;

    if (setupPromiseRef.current) {
      return setupPromiseRef.current;
    }

    setupPromiseRef.current = (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video:
            type === "video"
              ? {
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                  facingMode: "user",
                }
              : false,
        });

        localStreamRef.current = stream;
        setLocalStream(stream);

        const peer = new RTCPeerConnection({
          iceServers: ICE_SERVERS,
        });

        peerRef.current = peer;

        // Add microphone and camera tracks
        stream.getTracks().forEach((track) => {
          peer.addTrack(track, stream);
        });

        // Receive remote audio/video
        peer.ontrack = (event) => {
          let remote = remoteStreamRef.current;

          if (!remote) {
            remote = event.streams?.[0] || new MediaStream();
            remoteStreamRef.current = remote;
          }

          if (
            !event.streams?.[0] &&
            !remote.getTracks().some((t) => t.id === event.track.id)
          ) {
            remote.addTrack(event.track);
          }

          setRemoteStream(remote);
        };

        // Exchange ICE candidates
        peer.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("call:ice-candidate", {
              callId,
              data: event.candidate,
            });
          }
        };

        peer.onconnectionstatechange = () => {
          const state = peer.connectionState;

          console.log("WebRTC connection state:", state);

          if (state === "failed") {
            toast.error(
              "Connection failed. TURN server configuration may be required.",
            );
          }
        };

        return peer;
      } catch (error) {
        console.error("Media / WebRTC setup error:", error);

        throw error;
      }
    })();

    try {
      return await setupPromiseRef.current;
    } finally {
      setupPromiseRef.current = null;
    }
  }, []);

  // Process queued ICE candidates
  const flushCandidates = useCallback(async (peer) => {
    const candidates = [...pendingCandidatesRef.current];
    pendingCandidatesRef.current = [];

    for (const candidate of candidates) {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("Queued ICE candidate error:", error);
      }
    }
  }, []);

  // Caller creates and sends offer
  const createOffer = useCallback(
    async (callId, type) => {
      try {
        const peer = await setupPeerConnection(callId, type);

        const offer = await peer.createOffer();

        await peer.setLocalDescription(offer);

        socket.emit("call:offer", {
          callId,
          data: peer.localDescription,
        });

        console.log("WebRTC offer sent");
      } catch (error) {
        console.error("Create offer error:", error);
        resetCall("Could not start media connection", true);
        socket.emit("call:end", { callId });
      }
    },
    [setupPeerConnection, resetCall],
  );

  // Receiver handles offer and sends answer
  const handleOffer = useCallback(
    async ({ callId, data } = {}) => {
      if (!data || callId !== callIdRef.current) return;

      try {
        const type = activeCallRef.current?.type || "video";

        const peer = await setupPeerConnection(callId, type);

        await peer.setRemoteDescription(new RTCSessionDescription(data));

        await flushCandidates(peer);

        const answer = await peer.createAnswer();

        await peer.setLocalDescription(answer);

        socket.emit("call:answer", {
          callId,
          data: peer.localDescription,
        });

        console.log("WebRTC answer sent");
      } catch (error) {
        console.error("Handle offer error:", error);
        resetCall("Could not connect the call", true);
        socket.emit("call:end", { callId });
      }
    },
    [setupPeerConnection, flushCandidates, resetCall],
  );

  // Caller receives answer
  const handleAnswer = useCallback(
    async ({ callId, data } = {}) => {
      if (!data || callId !== callIdRef.current) return;

      try {
        const peer = peerRef.current;

        if (!peer || peer.signalingState !== "have-local-offer") {
          return;
        }

        await peer.setRemoteDescription(new RTCSessionDescription(data));

        await flushCandidates(peer);

        console.log("WebRTC answer received");
      } catch (error) {
        console.error("Handle answer error:", error);
      }
    },
    [flushCandidates],
  );

  // Receive remote ICE candidates
  const handleIceCandidate = useCallback(async ({ callId, data } = {}) => {
    if (!data || callId !== callIdRef.current) return;

    try {
      const peer = peerRef.current;

      if (!peer || !peer.remoteDescription) {
        pendingCandidatesRef.current.push(data);
        return;
      }

      await peer.addIceCandidate(new RTCIceCandidate(data));
    } catch (error) {
      console.error("ICE candidate error:", error);
    }
  }, []);

  // Attach streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch((error) => {
        console.warn("Remote video autoplay:", error);
      });
    }

    if (audioRef.current && remoteStream) {
      audioRef.current.srcObject = remoteStream;
      audioRef.current.play().catch((error) => {
        console.warn("Remote audio autoplay blocked:", error);
        toast.error("Tap the screen to enable audio");
      });
    }
  }, [remoteStream]);

  // Call duration timer
  useEffect(() => {
    if (activeCall?.status !== "accepted") {
      setSeconds(0);
      return;
    }

    const id = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(id);
  }, [activeCall?.status]);

  // Socket events
  useEffect(() => {
    const handleIncoming = (data) => {
      if (String(data.conversationId) !== String(conversationId)) return;

      incomingRef.current = data;
      setIncomingCall(data);
    };

    const handleRinging = ({ callId, type }) => {
      clearRingTimeout();

      callIdRef.current = callId;
      setCallLoading(false);

      updateActiveCall({
        callId,
        type,
        status: "ringing",
      });

      // Wait for receiver to accept
      timeoutRef.current = setTimeout(() => {
        resetCall("No answer. Call timed out.");
        socket.emit("call:end", { callId });
      }, 45000);
    };

    const handleAccepted = (data = {}) => {
      const inc = incomingRef.current;

      const callId = data.callId || inc?.callId || callIdRef.current;

      if (!callId) return;

      clearRingTimeout();

      callIdRef.current = callId;
      setCallLoading(false);
      setIncomingCall(null);
      incomingRef.current = null;

      const type = activeCallRef.current?.type || inc?.type || "video";

      updateActiveCall({
        callId,
        type,
        status: "accepted",
      });

      if (roleRef.current === "caller") {
        createOffer(callId, type);
      } else if (roleRef.current === "receiver") {
        // Receiver waits for caller's offer
        setupPeerConnection(callId, type).catch((error) => {
          console.error("Receiver media setup error:", error);
          resetCall("Microphone/camera access failed", true);
          socket.emit("call:end", { callId });
        });
      }
    };

    const handleRejected = ({ callId } = {}) => {
      if (callId && callId !== callIdRef.current) return;

      resetCall("Call rejected");
    };

    const handleEnded = ({ callId } = {}) => {
      if (callId && callId !== callIdRef.current) return;

      resetCall("Call ended");
    };

    const handleError = (data) => {
      resetCall(data?.message || "Call failed", true);
    };

    socket.on("call:incoming", handleIncoming);
    socket.on("call:ringing", handleRinging);
    socket.on("call:accepted", handleAccepted);
    socket.on("call:rejected", handleRejected);
    socket.on("call:ended", handleEnded);
    socket.on("call:error", handleError);

    socket.on("call:offer", handleOffer);
    socket.on("call:answer", handleAnswer);
    socket.on("call:ice-candidate", handleIceCandidate);

    return () => {
      clearRingTimeout();

      socket.off("call:incoming", handleIncoming);
      socket.off("call:ringing", handleRinging);
      socket.off("call:accepted", handleAccepted);
      socket.off("call:rejected", handleRejected);
      socket.off("call:ended", handleEnded);
      socket.off("call:error", handleError);

      socket.off("call:offer", handleOffer);
      socket.off("call:answer", handleAnswer);
      socket.off("call:ice-candidate", handleIceCandidate);

      cleanupMedia();
    };
  }, [
    conversationId,
    clearRingTimeout,
    updateActiveCall,
    resetCall,
    createOffer,
    setupPeerConnection,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    cleanupMedia,
  ]);

  // Start call
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

    if (activeCallRef.current || incomingRef.current || callLoading) {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Camera/microphone requires HTTPS or localhost");
      return;
    }

    roleRef.current = "caller";
    callIdRef.current = null;

    setCallLoading(true);

    socket.emit("call:start", {
      conversationId,
      toUserId: targetUserId,
      type,
    });

    timeoutRef.current = setTimeout(() => {
      resetCall("Server did not respond", true);
    }, 15000);
  };

  // Accept call
  const acceptCall = () => {
    if (!incomingRef.current?.callId) return;

    const callId = incomingRef.current.callId;

    roleRef.current = "receiver";
    callIdRef.current = callId;

    updateActiveCall({
      callId,
      type: incomingRef.current.type || "video",
      status: "ringing",
    });

    socket.emit("call:accept", { callId });
  };

  // Reject call
  const rejectCall = () => {
    const callId = incomingRef.current?.callId;

    if (!callId) return;

    socket.emit("call:reject", { callId });

    resetCall();
  };

  // End call
  const endCall = () => {
    const callId = callIdRef.current;

    if (callId) {
      socket.emit("call:end", { callId });
    }

    resetCall();
  };

  // Microphone mute/unmute
  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const tracks = stream.getAudioTracks();

    tracks.forEach((track) => {
      track.enabled = isMuted;
    });

    setIsMuted((value) => !value);
  };

  // Speaker ON/OFF
  const toggleSpeaker = async () => {
    const audio = audioRef.current;

    if (!audio) return;

    try {
      if (typeof audio.setSinkId !== "function") {
        toast.error("Speaker selection is not supported");
        return;
      }

      if (!speakerOn) {
        const devices = await navigator.mediaDevices.enumerateDevices();

        const speaker = devices.find(
          (device) =>
            device.kind === "audiooutput" &&
            /speaker|loudspeaker/i.test(device.label),
        );

        if (!speaker) {
          toast.error("Speaker device not found");
          return;
        }

        await audio.setSinkId(speaker.deviceId);
        setSpeakerOn(true);
        toast.success("Speaker ON");
      } else {
        await audio.setSinkId("default");
        setSpeakerOn(false);
        toast("Speaker OFF");
      }
    } catch (error) {
      console.error("Speaker error:", error);
      toast.error("Could not change speaker");
    }
  };

  // Camera on/off
  const toggleCamera = () => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const tracks = stream.getVideoTracks();

    tracks.forEach((track) => {
      track.enabled = cameraOff;
    });

    setCameraOff((value) => !value);
  };

  const busy = callLoading || !!activeCall || !!incomingCall;

  const btn =
    "grid size-10 shrink-0 place-items-center rounded-xl text-primary transition-colors hover:bg-primary/10 disabled:opacity-50";

  return (
    <>
      {/* Hidden remote audio player */}
      <audio ref={audioRef} autoPlay playsInline className="hidden" />

      {/* Call buttons */}
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

      {/* Calling loader */}
      {callLoading && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-base-300 px-4 py-3 shadow-lg">
          Calling...
        </div>
      )}

      {/* Incoming call */}
      {incomingCall && !activeCall && (
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
                <PhoneCall size={18} />
                Accept
              </button>

              <button
                type="button"
                onClick={rejectCall}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-error px-4 py-3 font-semibold text-white"
              >
                <PhoneOff size={18} />
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active call screen */}
      {activeCall && (
        <div className="fixed inset-0 z-[110] flex flex-col items-center justify-between overflow-hidden bg-base-300 p-5 text-base-content backdrop-blur">
          {/* Remote video */}
          {activeCall.type === "video" && (
            <div className="absolute inset-0 bg-black">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />

              {!remoteStream && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white">
                  <img
                    src={callUserPic}
                    alt={callUserName}
                    className="h-28 w-28 rounded-full object-cover"
                  />
                  <p>{callUserName}</p>
                  <p className="text-sm opacity-70">Connecting video...</p>
                </div>
              )}
            </div>
          )}

          {/* Local video preview */}
          {activeCall.type === "video" && (
            <div className="absolute right-5 top-5 z-10 h-36 w-28 overflow-hidden rounded-xl border-2 border-white/50 bg-black shadow-lg">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />

              {cameraOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
                  <VideoOff size={25} />
                </div>
              )}
            </div>
          )}

          {/* Audio call / caller information */}
          <div className="relative z-10 mt-auto flex flex-col items-center gap-4 text-center">
            {activeCall.type === "audio" && (
              <div className="avatar">
                <div className="w-28 rounded-full ring-4 ring-primary/40">
                  <img src={callUserPic} alt={callUserName} />
                </div>
              </div>
            )}

            <h2 className="text-2xl font-bold text-white">{callUserName}</h2>

            <p className="text-sm text-white">
              {activeCall.status === "ringing"
                ? "Ringing..."
                : remoteStream
                  ? formatTime(seconds)
                  : "Connecting..."}
            </p>
          </div>

          {/* Call controls */}
          <div className="relative z-10 mb-5 mt-8 flex items-center gap-5 rounded-2xl bg-black/50 px-6 py-4">
            <button
              type="button"
              onClick={toggleMute}
              disabled={!localStream}
              className={`grid size-12 place-items-center rounded-full text-white ${
                isMuted ? "bg-error" : "bg-white/20"
              }`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff size={21} /> : <Mic size={21} />}
            </button>

            {/* Speaker Button */}
            <button
              type="button"
              onClick={toggleSpeaker}
              className={`grid size-12 place-items-center rounded-full text-white ${
                speakerOn ? "bg-success" : "bg-white/20"
              }`}
              aria-label={speakerOn ? "Speaker Off" : "Speaker On"}
              title={speakerOn ? "Speaker Off" : "Speaker On"}
            >
              {speakerOn ? <Volume2 size={21} /> : <VolumeX size={21} />}
            </button>

            {activeCall.type === "video" && (
              <button
                type="button"
                onClick={toggleCamera}
                disabled={!localStream}
                className={`grid size-12 place-items-center rounded-full text-white ${
                  cameraOff ? "bg-error" : "bg-white/20"
                }`}
                title={cameraOff ? "Camera on" : "Camera off"}
              >
                {cameraOff ? <VideoOff size={21} /> : <Video size={21} />}
              </button>
            )}

            <button
              type="button"
              onClick={endCall}
              className="grid size-14 place-items-center rounded-full bg-error text-white shadow-lg active:scale-95"
              aria-label="End call"
              title="End call"
            >
              <PhoneOff size={25} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default VideoCall;
