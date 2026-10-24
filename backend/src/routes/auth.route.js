import express from "express";
import {
  login,
  logout,
  onboard,
  signup,
} from "../controllers/auth.controller.js";
// import upload from "../middleware/upload.js";
import profileUpload from "../middleware/profileUpload.js";

import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

// router.post("/onboarding", protectRoute, onboard);

// router.post("/onboarding", protectRoute, upload.single("profilepic"), onboard);
// router.post("/onboarding", protectRoute, upload.single("profilepic"), onboard);
router.post(
  "/onboarding",
  protectRoute,
  profileUpload.single("profilepic"),
  onboard,
);

//forget-password

router.get("/me", protectRoute, (req, res) => {
  res.status(200).json({ Success: true, user: req.user });
});

export default router;
