import { axiosInstance } from "../lib/axios";

export const signup = async (signupData) => {
  const response = await axiosInstance.post("/auth/signup", signupData);
  return response.data;
};

export const login = async (loginData) => {
  const response = await axiosInstance.post("/auth/login", loginData);
  return response.data;
};

export const logout = async () => {
  const response = await axiosInstance.post("/auth/logout");
  return response.data;
};

export const getAuthUser = async () => {
  try {
    const res = await axiosInstance.get("/auth/me");
    return res.data;
  } catch (error) {
    console.log("Error in getAuthUser:", error);
    return null;
  }
};

export const completeOnboarding = async (userData) => {
  const response = await axiosInstance.post("/auth/onboarding", userData);
  return response.data;
};

// 1️⃣ Get Logged-in User’s Friends
export async function getUserFriends() {
  // 👉 Calls backend: GET /users/friends
  const response = await axiosInstance.get("/users/friends");
  return response.data;
}

// 2️⃣ Get All Recommended Users (Users List)
// export async function getRecommendedUsers() {
//   // 👉 Calls backend: GET /users
//   const response = await axiosInstance.get("/users");
//   return response.data;
//   console.log("Current User From ProtectRoute:", req.user);
// }

export async function getRecommendedUsers(filters = {}) {
  const response = await axiosInstance.get("/users", {
    params: filters,
  });

  return response.data;
}

// 3️⃣ Get Outgoing Friend Requests
export async function getOutgoingFriendReqs() {
  // 👉 Calls backend: GET /users/outgoing-friend-requests
  const response = await axiosInstance.get("/users/outgoing-friend-requests");
  return response.data;
}

// 4️⃣ Send Friend Request
export async function sendFriendRequest(userId) {
  // 👉 Calls backend: POST /users/friend-request/:userId
  const response = await axiosInstance.post(`/users/friend-request/${userId}`);
  console.log("send require res:", response.data);
  return response.data;
}

export async function getFriendRequests() {
  const response = await axiosInstance.get("/users/friend-requests");
  return response.data;
}

export async function acceptFriendRequest(requestId) {
  const response = await axiosInstance.put(
    `/users/friend-request/accept/${requestId}`,
  );
  return response.data;
}

export async function getStreamToken() {
  const response = await axiosInstance.get("/chat/token");
  return response.data;
}

export const fetchPosts = async () => {
  const response = await axiosInstance.get("/post", {
    withCredentials: true, //send cookies
  });
  return response.data;
};

export const fetchPostById = async (postId) => {
  const response = await axiosInstance.get(`/post/${postId}`);
  return response.data;
};

export const sharePostToFriend = async ({ friendId, postId, url }) => {
  const response = await axiosInstance.post("/post/share", {
    friendId,
    postId,
    url,
  });
  console.log("Share API result:", response.data);
  return response.data;
};

export const toggleLike = async (postId) => {
  try {
    const response = await axiosInstance.put(`/post/${postId}/like`);
    return response.data;
  } catch (error) {
    console.error("Error toggling like:", error);
    throw error;
  }
};

export const commentPost = async (postId, text) => {
  try {
    const response = await axiosInstance.put(`/post/${postId}/comment`, {
      text,
    });

    return response.data;
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
};

// export const editCommentApi = async (postId, commentId, text) => {
//   const res = await fetch(`/api/posts/${postId}/comment/${commentId}`, {
//     method: "PATCH",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     credentials: "include",
//     body: JSON.stringify({ text }),
//   });

//   const data = await res.json();

//   if (!res.ok) {
//     throw new Error(data.message || "Could not edit comment");
//   }

//   return data;
// };

// export const deleteCommentApi = async (postId, commentId) => {
//   const res = await fetch(`/api/posts/${postId}/comment/${commentId}`, {
//     method: "DELETE",
//     credentials: "include",
//   });

//   const data = await res.json();

//   if (!res.ok) {
//     throw new Error(data.message || "Could not delete comment");
//   }

//   return data;
// };

export const editCommentApi = async (postId, commentId, text) => {
  try {
    const response = await axiosInstance.patch(
      `/post/${postId}/comment/${commentId}`,
      { text },
    );
    return response.data;
  } catch (error) {
    console.error("Error editing comment:", error);
    throw error;
  }
};

export const deleteCommentApi = async (postId, commentId) => {
  try {
    const response = await axiosInstance.delete(
      `/post/${postId}/comment/${commentId}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
};
