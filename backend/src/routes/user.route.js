import express from "express";
import {
  acceptFriendRequest,
  getFriendRequests,
  getMyFriends,
  getoutgoingFriendReqs,
  getRecommendedUsers,
  getsearchUser,
  getUserById,
  sendFriendRequest,
} from "../controllers/user.controller.js";

import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// apply auth middleware to all routes
router.use(protectRoute);
// get users
router.get("/", getRecommendedUsers);
// get friends
router.get("/friends", getMyFriends);
// send request
router.post("/friend-request/:id", sendFriendRequest);
//  accept Friend Request
router.put("/friend-request/accept/:id", acceptFriendRequest);
// get requests
router.get("/friend-requests", getFriendRequests);
// outgoing
router.get("/outgoing-friend-requests", getoutgoingFriendReqs);
// search user
router.get("/search", protectRoute, getsearchUser);
// user get id
router.get("/:userId", getUserById);
export default router;
