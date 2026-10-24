import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { axiosInstance } from "../lib/axios";
import SendFriendRequest from "../components/friend.jsx/SendFriendRequest";
import useAuthUser from "../hooks/useAuthUser";
import { getUserFriends } from "../lib/api";

const Profilepage = () => {
  const { id } = useParams();
  const { authUser: own } = useAuthUser();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);

  // All hooks must run before any conditional return.
  const {
    data: friends = [],
    isLoading: loadingFriends,
    isError: friendsError,
  } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const fetchProfile = async () => {
      try {
        const [userRes, postsRes] = await Promise.all([
          axiosInstance.get(`/users/${id}`),
          axiosInstance.get(`/post/user/${id}`),
        ]);

        if (!cancelled) {
          setUser(userRes.data);
          setPosts(Array.isArray(postsRes.data) ? postsRes.data : []);
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Error fetching profile:",
            error.response?.data || error.message,
          );
        }
      }
    };

    setUser(null);
    setPosts([]);
    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Supports friends represented as user objects or IDs.
  const isFriend =
    Array.isArray(friends) &&
    friends.some((friend) => {
      const friendId =
        typeof friend === "string"
          ? friend
          : friend?._id || friend?.user?._id || friend?.friend?._id;

      return String(friendId) === String(user?._id);
    });

  const isOwnProfile =
    Boolean(own?._id && user?._id) && String(own._id) === String(user._id);

  const friendsCount = user?.friends?.length || 0;

  // Conditional return comes after all hooks.
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-200/30 px-4 text-base-content">
        <p className="text-lg font-medium">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-base-200/30 px-3 py-6 text-base-content sm:px-5 sm:py-10">
      {/* Profile card */}
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-xl transition-shadow duration-300 hover:shadow-2xl">
        <div className="flex flex-col items-center px-6 py-8">
          <img
            src={user.profilepic || "/default-avatar.png"}
            alt="Profile"
            className="size-28 rounded-full border-4 border-base-100 object-cover shadow-lg ring-2 ring-primary/30"
          />

          <h1 className="mt-4 text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
            {user.FullName || "Guest User"}
          </h1>

          <p className="mt-1 break-all text-center text-sm text-base-content/60">
            {user.email || "No email available"}
          </p>

          <p className="mt-4 max-w-sm text-center text-sm leading-6 text-base-content/70">
            {user.bio || "This user hasn't added a bio yet."}
          </p>

          <p className="mt-3 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-center text-sm font-semibold text-primary">
            {user.learningLanguage || "This user hasn't added their role yet."}
          </p>

          {/* Stats */}
          <div className="mt-6 grid w-full grid-cols-2 gap-3 border-t border-base-300 pt-5">
            <div className="flex flex-col items-center rounded-2xl bg-base-200/70 px-4 py-4 transition-colors hover:bg-primary/10">
              <span className="text-2xl font-extrabold text-primary">
                {posts.length}
              </span>
              <span className="mt-1 text-xs font-medium uppercase tracking-wider text-base-content/60">
                Posts
              </span>
            </div>

            <div className="flex flex-col items-center rounded-2xl bg-base-200/70 px-4 py-4 transition-colors hover:bg-primary/10">
              <span className="text-2xl font-extrabold text-primary">
                {friendsCount}
              </span>
              <span className="mt-1 text-xs font-medium uppercase tracking-wider text-base-content/60">
                Friends
              </span>
            </div>
          </div>

          {/* Message / Friend request */}
          {own?._id && !isOwnProfile && (
            <div className="mt-5 w-full">
              {loadingFriends ? (
                <button className="btn w-full rounded-xl" disabled>
                  Checking friendship...
                </button>
              ) : friendsError ? (
                <p className="text-center text-sm text-error">
                  Could not check friendship. Please refresh.
                </p>
              ) : isFriend ? (
                <Link
                  to={`/chat/${user._id}`}
                  className="btn btn-outline w-full rounded-xl border-success text-success transition-all duration-200 hover:scale-[1.02] hover:bg-success hover:text-white"
                >
                  Message
                </Link>
              ) : (
                <SendFriendRequest userId={user._id} />
              )}
            </div>
          )}

          {/* Edit profile */}
          {own?._id && isOwnProfile && (
            <div className="mt-5 w-full">
              <button
                onClick={() => navigate("/onboarding")}
                className="btn btn-primary w-full rounded-xl shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Posts grid */}
      <div className="mt-8 w-full max-w-4xl">
        {posts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-base-300 bg-base-100 px-5 py-12 text-center text-base-content/60">
            No posts yet
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
            {posts.map((post) => {
              let mediaSrc = null;

              if (post.media?.data && post.media?.contentType) {
                mediaSrc = `data:${post.media.contentType};base64,${post.media.data}`;
              } else if (typeof post.media === "string") {
                mediaSrc = post.media;
              }

              return (
                <div
                  key={post._id}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-base-300 bg-base-200 shadow-sm"
                >
                  {mediaSrc ? (
                    <img
                      src={mediaSrc}
                      alt="Post"
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center overflow-hidden bg-base-200 p-3 text-center text-sm text-base-content/70">
                      {post.text || "No media available"}
                    </div>
                  )}

                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 font-semibold text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {post.likes?.length || 0} Likes
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profilepage;
