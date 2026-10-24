import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus, CheckCircle, LoaderCircle } from "lucide-react";

import {
  getOutgoingFriendReqs,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
} from "../../lib/api.js";

const SendFriendRequest = ({ userId, alreadySent = false }) => {
  const queryClient = useQueryClient();

  // Outgoing requests
  const { data: outgoingFriendReqs = [] } = useQuery({
    queryKey: ["outgoingFriendReqs"],
    queryFn: getOutgoingFriendReqs,
  });

  // Incoming requests
  const { data: friendRequests } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
  });

  const incomingRequests = friendRequests?.incomingReqs || [];

  const incomingRequest = incomingRequests.find(
    (req) => req.sender?._id === userId,
  );

  const requestAlreadySent = outgoingFriendReqs.some(
    (req) => req.recipient?._id === userId,
  );

  const requestSent = alreadySent || requestAlreadySent;

  // Refresh relevant data after an action
  const refreshRequests = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] }),
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] }),
      queryClient.invalidateQueries({ queryKey: ["friends"] }),
      queryClient.invalidateQueries({ queryKey: ["users"] }),
    ]);
  };

  // Send request
  const { mutate: sendRequestMutation, isPending: isSending } = useMutation({
    mutationFn: () => sendFriendRequest(userId),
    onSuccess: refreshRequests,
  });

  // Accept incoming request
  const { mutate: acceptRequestMutation, isPending: isAccepting } = useMutation(
    {
      mutationFn: acceptFriendRequest,
      onSuccess: refreshRequests,
    },
  );

  const isPending = isSending || isAccepting;

  const isRequestSent = requestSent;

  return (
    <button
      type="button"
      className="btn btn-primary mt-2 w-full"
      disabled={!userId || isPending || isRequestSent}
      onClick={() => {
        if (incomingRequest) {
          acceptRequestMutation(incomingRequest._id);
        } else {
          sendRequestMutation();
        }
      }}
    >
      {isPending ? (
        <>
          <LoaderCircle className="mr-2 size-4 animate-spin" />
          {isAccepting ? "Accepting..." : "Sending..."}
        </>
      ) : incomingRequest ? (
        <>
          <CheckCircle className="mr-2 size-4" />
          Accept Request
        </>
      ) : isRequestSent ? (
        <>
          <CheckCircle className="mr-2 size-4" />
          Request Sent
        </>
      ) : (
        <>
          <UserPlus className="mr-2 size-4" />
          Send Friend Request
        </>
      )}
    </button>
  );
};

export default SendFriendRequest;
