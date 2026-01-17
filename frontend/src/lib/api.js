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
export async function getRecommendedUsers() {
  // 👉 Calls backend: GET /users
  const response = await axiosInstance.get("/users");
  return response.data;
  console.log("Current User From ProtectRoute:", req.user);
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
  return response.data;
}

export async function getFriendRequests() {
  const response = await axiosInstance.get("/users/friend-requests");
  return response.data;
}

export async function acceptFriendRequest(requestId) {
  const response = await axiosInstance.put(
    `/users/friend-request/accept/${requestId}`
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

export const toggleLike = async (postId) => {
  try {
    const response = await axiosInstance.put(`/post/${postId}/like`);
    return response.data;
  } catch (error) {
    console.error("Error toggling like:", error);
    throw error;
  }
};

// export const createPost = async (formData) => {
//   const res = await axiosInstance.post("/create", formData, {
//     headers: { "Content-Type": "multipart/form-data" },
//   });
//   return res.data;
// };
