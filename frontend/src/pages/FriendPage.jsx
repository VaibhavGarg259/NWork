import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Search, Users } from "lucide-react";
// components
import FriendCard, { getLanguageFlag } from "../components/FriendCard.jsx";
import NoFriendsFound from "../components/NoFriendsFound.jsx";
import UserSearchBar from "../components/UserSearchBar.jsx";
import SendFriendRequest from "../components/friend.jsx/SendFriendRequest.jsx";
// lib
import { capitialize } from "../lib/utils.js";
import { getUserFriends, getRecommendedUsers } from "../lib/api.js";

const FriendPage = () => {
  // filter
  const [filters, setFilters] = useState({
    location: "",
    learningLanguage: "",
  });

  const [appliedFilters, setAppliedFilters] = useState({
    location: "",
    learningLanguage: "",
  });

  // Fetch accepted friends
  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  // Fetch recommended users
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users", appliedFilters],
    queryFn: () => getRecommendedUsers(appliedFilters),
  });

  // Get IDs of existing friends
  const friendIds = new Set(
    friends.map((friend) => {
      const friendId =
        typeof friend === "string"
          ? friend
          : friend?._id || friend?.user?._id || friend?.friend?._id;

      return String(friendId);
    }),
  );

  // Remove already accepted friends from recommendations
  const recommendedUsers = users.filter(
    (user) => !friendIds.has(String(user._id)),
  );

  const handleChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const applyFilters = () => {
    setAppliedFilters({
      location: filters.location.trim(),
      learningLanguage: filters.learningLanguage.trim(),
    });
  };

  const resetFilters = () => {
    const emptyFilters = {
      location: "",
      learningLanguage: "",
    };

    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Search bar */}
      <div className="sticky top-0 z-10 bg-base-100 shadow-md">
        <UserSearchBar />
      </div>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="container mx-auto space-y-10">
          {/* Friends section */}
          <section>
            <div className="mb-6 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-bold">Your Friends</h2>

              <Link to="/notifications" className="btn btn-outline btn-sm">
                <Users size={16} />
                Friend Requests
              </Link>
            </div>

            {loadingFriends ? (
              <p>Loading friends...</p>
            ) : friends.length === 0 ? (
              <NoFriendsFound />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {friends.map((friend) => {
                  const friendId =
                    typeof friend === "string"
                      ? friend
                      : friend?._id || friend?.user?._id || friend?.friend?._id;

                  // FriendCard expects a friend object
                  const friendData =
                    typeof friend === "string" ? { _id: friend } : friend;

                  return (
                    <FriendCard
                      key={friendId}
                      friends={friendData}
                      to={`/profile/${friendId}`}
                    />
                  );
                })}
              </div>
            )}
          </section>

          {/* Recommended users */}
          <section>
            <h2 className="text-2xl font-bold">Meet New Learners</h2>

            <p className="mb-5 opacity-70">
              Discover people with similar interests and connect!
            </p>

            {/* Filters */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row">
              <input
                name="location"
                value={filters.location}
                onChange={handleChange}
                placeholder="Filter by location"
                className="input input-bordered w-full"
              />

              <input
                name="learningLanguage"
                value={filters.learningLanguage}
                onChange={handleChange}
                placeholder="Learning language"
                className="input input-bordered w-full"
              />

              <button onClick={applyFilters} className="btn btn-primary">
                <Search size={16} />
                Apply
              </button>

              <button onClick={resetFilters} className="btn btn-outline">
                Reset
              </button>
            </div>

            {loadingUsers || loadingFriends ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : recommendedUsers.length === 0 ? (
              <p className="rounded-lg bg-base-200 p-6 text-center">
                No new learners found. Try different filters.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {recommendedUsers.map((user) => {
                  const name = user.FullName || "User";

                  return (
                    <div key={user._id} className="card bg-base-200">
                      <div className="card-body p-5">
                        <Link
                          to={`/profile/${user._id}`}
                          className="group flex items-center gap-3"
                        >
                          <div className="avatar shrink-0">
                            <div className="size-12 rounded-full border-2 border-primary/30">
                              <img
                                src={user.profilepic || "/default-avatar.png"}
                                alt={name}
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src =
                                    "https://ui-avatars.com/api/?name=" +
                                    encodeURIComponent(name);
                                }}
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            </div>
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate font-semibold group-hover:underline">
                              {name}
                            </h3>

                            {user.location && (
                              <p className="flex items-center gap-1 text-sm opacity-70">
                                <MapPin size={14} />
                                <span className="truncate">
                                  {user.location}
                                </span>
                              </p>
                            )}
                          </div>
                        </Link>

                        {/* Language badges */}
                        <div className="flex flex-wrap gap-2">
                          {user.nativeLanguage && (
                            <span className="badge badge-secondary">
                              {getLanguageFlag(user.nativeLanguage)}
                              Native: {capitialize(user.nativeLanguage)}
                            </span>
                          )}

                          {user.learningLanguage && (
                            <span className="badge badge-outline">
                              {getLanguageFlag(user.learningLanguage)}
                              Learning: {capitialize(user.learningLanguage)}
                            </span>
                          )}
                        </div>

                        {/* Bio */}
                        {user.bio && (
                          <p className="line-clamp-2 text-sm opacity-70">
                            {user.bio}
                          </p>
                        )}

                        <SendFriendRequest userId={user._id} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default FriendPage;
