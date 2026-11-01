import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import {
  BellIcon,
  ClockIcon,
  MessageSquareIcon,
  UserCheckIcon,
} from "lucide-react";

import { acceptFriendRequest, getFriendRequests } from "../lib/api";
import NoNotificationsFound from "../components/NoNotificationsFound.jsx";

const DEFAULT_AVATAR = "/default-avatar.png";

const timeAgo = (dateValue) => {
  if (!dateValue) return "Recently";
  const diff = Date.now() - new Date(dateValue).getTime();
  if (Number.isNaN(diff)) return "Recently";

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateValue).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

const Avatar = ({ src, alt, className = "size-12" }) => (
  <div className="avatar shrink-0">
    <div
      className={`${className} rounded-full bg-base-300 ring-1 ring-base-300`}
    >
      <img
        src={src || DEFAULT_AVATAR}
        alt={alt || "User"}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = DEFAULT_AVATAR;
        }}
      />
    </div>
  </div>
);

const NotificationsPages = () => {
  const queryClient = useQueryClient();

  const { data: friendRequests, isLoading } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
  });

  const {
    mutate: acceptRequestMutation,
    isPending,
    variables: acceptingId,
  } = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  const incomingRequests = friendRequests?.incomingReqs || [];
  const acceptedRequests = friendRequests?.acceptedReqs || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-4xl space-y-8">
        <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
          Notifications
        </h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <>
            {/* Incoming friend requests */}
            {incomingRequests.length > 0 && (
              <section className="space-y-4">
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  <UserCheckIcon className="h-5 w-5 text-primary" />
                  Friend Requests
                  <span className="badge badge-primary ml-2">
                    {incomingRequests.length}
                  </span>
                </h2>

                <div className="space-y-3">
                  {incomingRequests.map((request) => {
                    const sender = request.sender;
                    if (!sender) return null;

                    const isAccepting =
                      isPending && acceptingId === request._id;

                    return (
                      <div
                        key={request._id}
                        className="card bg-base-200 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="card-body p-4">
                          <div className="flex items-center justify-between gap-3">
                            <Link
                              to={`/profile/${sender._id}`}
                              className="flex min-w-0 flex-1 items-center gap-3"
                            >
                              <img
                                src={sender.profilepic || DEFAULT_AVATAR}
                                alt={sender.FullName || "User"}
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src =
                                    "https://ui-avatars.com/api/?name=" +
                                    encodeURIComponent(friend.FullName || "U");
                                }}
                                className="size-14 shrink-0 rounded-full border-2 border-primary/30 object-cover transition-transform duration-300 group-hover:scale-105"
                              />

                              <div className="min-w-0">
                                <h3 className="truncate font-semibold hover:underline">
                                  {sender.FullName}
                                </h3>
                                <div className="mt-1 flex flex-wrap gap-1.5">
                                  {sender.nativeLanguage && (
                                    <span className="badge badge-secondary badge-sm">
                                      Native: {sender.nativeLanguage}
                                    </span>
                                  )}
                                  {sender.learningLanguage && (
                                    <span className="badge badge-outline badge-sm">
                                      Learning: {sender.learningLanguage}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 flex items-center text-xs opacity-60">
                                  <ClockIcon className="mr-1 h-3 w-3" />
                                  {timeAgo(request.createdAt)}
                                </p>
                              </div>
                            </Link>

                            <button
                              type="button"
                              className="btn btn-primary btn-sm shrink-0"
                              onClick={() => acceptRequestMutation(request._id)}
                              disabled={isPending}
                            >
                              {isAccepting ? (
                                <span className="loading loading-spinner loading-xs"></span>
                              ) : (
                                "Accept"
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Accepted requests */}
            {acceptedRequests.length > 0 && (
              <section className="space-y-4">
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  <BellIcon className="h-5 w-5 text-success" />
                  New Connections
                </h2>

                <div className="space-y-3">
                  {acceptedRequests.map((notification) => {
                    const friend = notification.recipient;
                    if (!friend) return null;

                    return (
                      <div
                        key={notification._id}
                        className="card bg-base-200 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="card-body p-4">
                          <div className="flex items-center gap-3">
                            <Link
                              to={`/profile/${friend._id}`}
                              className="group shrink-0"
                            >
                              <img
                                src={friend.profilepic || DEFAULT_AVATAR}
                                alt={friend.FullName || "User"}
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src =
                                    "https://ui-avatars.com/api/?name=" +
                                    encodeURIComponent(friend.FullName || "U");
                                }}
                                className="size-12 shrink-0 rounded-full border-2 border-primary/30 object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            </Link>

                            <div className="min-w-0 flex-1">
                              <Link
                                to={`/profile/${friend._id}`}
                                className="font-semibold hover:underline"
                              >
                                {friend.FullName}
                              </Link>
                              <p className="my-0.5 text-sm">
                                accepted your friend request!
                              </p>
                              <p className="flex items-center text-xs opacity-70">
                                <ClockIcon className="mr-1 h-3 w-3" />
                                {timeAgo(
                                  notification.updatedAt ||
                                    notification.createdAt,
                                )}
                              </p>
                            </div>

                            <Link
                              to={`/chat/${friend._id}`}
                              className="btn btn-success btn-sm shrink-0 gap-1"
                            >
                              <MessageSquareIcon className="h-4 w-4" />
                              <span className="hidden sm:inline">Message</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {incomingRequests.length === 0 && acceptedRequests.length === 0 && (
              <NoNotificationsFound />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationsPages;
