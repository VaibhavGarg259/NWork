import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getRecommendedUsers,
  getOutgoingFriendReqs,
  sendFriendRequest,
  getUserFriends,
} from "../lib/api.js";
import { useEffect, useState } from "react";
// import { Link } from "react-router";
import { Link } from "react-router-dom";
import {
  CheckCircleIcon,
  MapPinIcon,
  SearchIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";
import FriendCard from "../components/FriendCard.jsx";
import NoFriendsFound from "../components/NoFriendsFound.jsx";
import { getLanguageFlag } from "../components/FriendCard.jsx";
import {  capitialize } from "../lib/utils.js";

import UserSearchBar from "../components/userSearchBar.jsx";
// import axios from "axios";

const FriendPage = () => {
  const queryClient = useQueryClient();
  const [outgoingRequestsIds, setOutgoingRequestsIds] = useState(new Set());

  // const { data: users = [], isLoading } = useQuery({
  //   queryKey: ["users", filters],
  //   queryFn: async () => {
  //     const res = await axios.get("http://localhost:5001/api/users", {
  //       params: filters, // << important
  //       withCredentials: true,
  //     });
  //     return res.data;
  //   },
  // });

  // Filters (city + learningLanguage)
  const [filters, setFilters] = useState({
    location: "",
    learningLanguage: "",
  });

  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const { data: recommendedUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users", filters], //refetch on filter change
    queryFn: () => getRecommendedUsers(filters),
  });

  const { data: outgoingFriendReqs } = useQuery({
    queryKey: ["outgoingFriendReqs"],
    queryFn: getOutgoingFriendReqs,
  });

  const { mutate: sendRequestMutation, isPending } = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] }),
  });

  useEffect(() => {
    const outgoingIds = new Set();
    if (outgoingFriendReqs && outgoingFriendReqs.length > 0) {
      outgoingFriendReqs.forEach((req) => {
        // console.log(req);
        outgoingIds.add(req.recipient._id);
      });
      setOutgoingRequestsIds(outgoingIds);
    }
  }, [outgoingFriendReqs]);

  //Handle filter input change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // const fetchFilteredUsers = async ({ queryKey }) => {
  //   const [_key, filters] = queryKey;
  //   const { city, learningLanguage } = filters;
  //   const res = await axios.get(
  //     `http://localhost:5001/api/users/search?city=${city}&learningLanguage=${learningLanguage}`,
  //     { withCredentials: true }
  //   );
  //   return res.data;
  // };

  // // const { data: users, refetch } = useQuery(
  // //   ["users", filters],
  // //   fetchFilteredUsers,
  // //   { enabled: false } // we will manually fetch on Apply Filters
  // // );
  // const { data: users, refetch } = useQuery({
  //   queryKey: ["users", filters],
  //   queryFn: fetchFilteredUsers,
  //   enabled: false, // will only run when refetch() called
  // });

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      {/* Search bar at top  */}
      <div className="sticky top-0 z-10 bg-base-100 shadow-md">
        <UserSearchBar />
      </div>
      <div className="p-4 sm:p-6 lg:p-8 ">
        <div className="container mx-auto space-y-10">
          {/* friends Section  */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Your Friends
            </h2>
            <Link to="/notifications" className="btn btn-outline btn-sm">
              <UsersIcon className="mr-2 size-4" />
              Friend Requests
            </Link>
          </div>

          {loadingFriends ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : friends.length === 0 ? (
            <NoFriendsFound />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {friends.map((friends) => (
                // <link key={friends._id} to={`/profile/${friends._id}`}>
                <FriendCard
                  to={`/profile/${friends._id}`}
                  key={friends._id}
                  friends={friends}
                />
                // </link>
              ))}
            </div>
          )}

          <section>
            {/* //new friend */}
            <div className="mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    Meet New Learners
                  </h2>
                  <p className="opacity-70">
                    Discover People with similar skills, interests, and start
                    connecting!
                  </p>
                </div>
              </div>
            </div>
            {/* Filter Inputs  */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <input
                type="text"
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                placeholder="Filter by location (e.g., Delhi)"
                className="input input-bordered w-full sm:w-1/3"
              />
              <input
                type="text"
                name="learningLanguage"
                value={filters.learningLanguage}
                onChange={handleFilterChange}
                placeholder="Filter by learning Language"
                className="input input-bordered w-full sm:w-1/3"
              />

              <button
                className="btn btn-primary flex items-center gap-2"
                // onClick={() =>
                //   queryClient.invalidateQueries({
                //     queryKey: ["users", filters],
                //   })
                // }
                onClick={() =>
                  queryClient.refetchQueries({ queryKey: ["users", filters] })
                }
              >
                <SearchIcon className="size-4" />
                Apply Filters
              </button>

              {/* <button
                className="btn btn-primary items-center gap-2"
                onClick={() => refetch()} // fetch filtered users
              >
                <SearchIcon className="size-4" />
                Apply Filters
              </button> */}
            </div>
            {loadingUsers ? (
              <div className="flex justify-center py-12">
                <span className=" loading loading-spinner loading-lg" />
                {/* console.log(recommendedUsers); */}
              </div>
            ) : recommendedUsers.length === 0 ? (
              <div className="card bg-base-200 p-6 text-center">
                <h3 className="font-semibold text-lg mb-2 ">
                  No recommendations available
                </h3>
                <p className="text-base-content opacity-70">
                  Try adjusting your filters or check back later!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedUsers.map((user) => {
                  const hasRequestbeenSent = outgoingRequestsIds.has(user._id);

                  return (
                    // <link key={user._id} to={`profile/${user._id}`}>
                    <div
                      key={user._id}
                      to={`profile/${user._id}`}
                      className="card bg-base-200 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="card-body p-5 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="avatar size-16 rounded-full">
                            <img src={user.profilepic} alt={user.FullName} />
                          </div>

                          <div>
                            <h3 className="font-semibold text-lg">
                              {user.FullName}
                            </h3>
                            {user.location && (
                              <div className="flex items-center text-xs opacity-70 mt-1">
                                <MapPinIcon className="size-3 mr-1" />
                                {user.location}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Languages with flags  */}
                        <div className="flex flex-wrap gap-1.5">
                          <span className="badge badge-secondary ">
                            {getLanguageFlag(user.nativeLanguage)}
                            Native:{capitialize(user.nativeLanguage)}
                          </span>
                          <span className="badge badge-outline">
                            {getLanguageFlag(user.learningLanguage)}
                            Learning: {capitialize(user.learningLanguage)}
                          </span>
                        </div>
                        {user.bio && (
                          <p className="text-sm opacity-70">{user.bio}</p>
                        )}

                        {/* Action button */}
                        <button
                          className={`btn w-full mt-2 ${
                            hasRequestbeenSent ? "btn-disabled" : "btn-primary"
                          }`}
                          onClick={() => sendRequestMutation(user._id)}
                          disabled={hasRequestbeenSent || isPending}
                        >
                          {hasRequestbeenSent ? (
                            <>
                              <CheckCircleIcon className="size-4 mr-2" />
                              Request Sent
                            </>
                          ) : (
                            <>
                              <UserPlusIcon className="size-4 mr-2" />
                              Send Friend Request
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    // {/* </link> */}
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default FriendPage;
