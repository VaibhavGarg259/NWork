import React, { useEffect, useState } from "react";
// import { useParams } from "react-router";
import { useParams } from "react-router-dom";
import { axiosInstance } from "../lib/axios";

const Profilepage = () => {
  const { id } = useParams(); //URL se id aarhi hai
  console.log("URL ID =", id);
  console.log("Fetched ID =", id);
  // console.log(user._id);

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const friendsCount = user?.friends?.length || 0;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axiosInstance.get(`/users/${id}`);
        setUser(res.data);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    const fetchPosts = async () => {
      try {
        const res = await axiosInstance.get(`/post/user/${id}`);
        setPosts(res.data);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };
    fetchUser();
    fetchPosts();
  }, [id]);

  if (!user) {
    return (
      <div className="flex itex-center justify-center h-screen">
        <p className="text-lg">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-4">
      {/* Profile card  */}
      <div className="shadow-lg rounded-2xl p-8 max-w-md w-full">
        <div className="flex flex-col items-center">
          {/* Avatar  */}
          <img
            src={user.profilepic || "https://via.placeholder.com/150"}
            alt="profile"
            className="w-28 h-28 rounded-full shadow-md border-2 border-gray-300 object-cover"
          />

          {/* Username  */}
          <h1 className="mt-4 text-2xl font-bold">
            {user?.FullName || "Guest User"}
          </h1>

          {/* Email  */}
          <p>{user.email || "No email avilable"}</p>

          {/* Bio  */}
          <p className="mt-3 text-center text-gray-600">
            {user.bio || "This user hasn't added a bio yet."}
          </p>

          {/* job role  */}
          <p className="mt-3 text-center text-blue-900">
            {user.learningLanguage || "This user hasn't added who is he/she."}
          </p>

          {/* stats  */}
          <div className="flex justify-evenly w-full mt-6 border-t pt-4">
            <div className="flex flex-col items-center">
              <span className="text-lg font-semibold">{posts.length || 0}</span>
              <span className="text-sm">Posts</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-semibold">{friendsCount}</span>
              <span className="text-sm">Friends</span>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Grid(Instagram style) */}
      <div className="mt-10 max-w-4xl w-full">
        {posts.length === 0 ? (
          <p className="text-center text-gray-500 ">No posts yet</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {posts.map((post) => {
              let mediaSrc = null;
              if (post.media?.data && post.media?.contentType) {
                mediaSrc = `data:${post.media.contentType};
                base64,${post.media.data}`;
              } else if (typeof post.media == "string") {
                mediaSrc = post.media;
              }

              return (
                <div key={post._id} className="relative group">
                  {mediaSrc ? (
                    <img
                      src={mediaSrc}
                      alt="post"
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-40 bg-gray-200 text-gray-500">
                      {post.text}
                    </div>
                  )}
                  {/* overlay on hover (like Instagram) */}
                  <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-semibold transition">
                    {post.likes?.length || 0}
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
