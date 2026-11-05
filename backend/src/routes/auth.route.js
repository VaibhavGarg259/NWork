import express from "express";
import {
  login,
  logout,
  onboard,
  signup,
} from "../controllers/auth.controller.js";

import profileUpload from "../middleware/profileUpload.js";

import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.post(
  "/onboarding",
  protectRoute,
  (req, res, next) => {
    profileUpload.single("profilepic")(req, res, (err) => {
      if (err) return res.status(400).json({ message: err.message });
      next();
    });
  },
  onboard,
);

//forget-password

router.get("/me", protectRoute, (req, res) => {
  res.status(200).json({ Success: true, user: req.user });
});

export default router;
