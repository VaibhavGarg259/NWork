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

router.get("/", getRecommendedUsers);

// router.get("/friends", getMyFriends);
router.get("/friends", getMyFriends);

router.post("/friend-request/:id", sendFriendRequest);
// router.put("/friend-request/accept/:id", acceptFriendRequest);
router.put("/friend-request/accept/:id", acceptFriendRequest);

// router.put("/friend-request/reject", acceptFriendRequest);

router.get("/friend-requests", getFriendRequests);
router.get("/outgoing-friend-requests", getoutgoingFriendReqs);

router.get("/search", protectRoute, getsearchUser);
router.get("/:userId", getUserById);
export default router;
