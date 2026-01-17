import { upsertStreamUser } from "../lib/stream.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

export async function signup(req, res) {
  const { FullName, email, password } = req.body;

  try {
    if (!email || !password || !FullName) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "password must be at least 6 characters" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists,please use a diffenre one" }); //42:23
    }

    const idx = Math.floor(Math.random() * 100) + 1;
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

    const newUser = await User.create({
      email,
      FullName,
      password,
      profilepic: randomAvatar,
    });

    // Todo: CREATE THE USER IN STREAM AS WELL
    try {
      await upsertStreamUser({
        id: newUser._id.toString(),
        name: newUser.FullName,
        image: newUser.profilepic || "",
      });
      console.log(`Stream user created for ${newUser.FullName}`);
    } catch (error) {
      console.log("Error creating Stream user:", error);
    }

    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "7d",
      }
    );
    //localhost:5001/api/auth/login

    // http:
    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true, //prevent xss attacks
      sameSite: "strict", // prevent csrf attacks
      secure: process.env.NODE_ENV === "production",
    });

    res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    console.log("Error in signup controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    //find email
    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });

    // check password
    const isPasswordCorrect = await user.matchPassword(password);

    if (!isPasswordCorrect)
      return res.status(401).json({ message: "Invalid email or password" });

    //
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });
    //localhost:5001/api/auth/login

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true, //prevent xss attacks
      sameSite: "strict", // prevent csrf attacks
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export function logout(req, res) {
  res.clearCookie("jwt");
  res.status(200).json({ success: true, message: "Logout Successful" });
}

export async function onboard(req, res) {
  try {
    const userId = req.user._id;
    const { FullName, bio, nativeLanguage, learningLanguage, location } =
      req.body;

    if (
      !FullName ||
      !bio ||
      !nativeLanguage ||
      !learningLanguage ||
      !location
    ) {
      return res.status(400).json({
        message: "All fiekds are required",
        missingFields: [
          !FullName && "FullName",
          !bio && "bio",
          !nativeLanguage && "nativeLanguage",
          !learningLanguage && "learningLanguage",
          !location && "location",
        ].filter(Boolean),
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...req.body,
        isOnboarded: true,
      },
      { new: true }
    );

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

    //todo update the user info in stream
    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.FullName,
        image: updatedUser.profilepic || "",
      });
      console.log(
        `Stream user updated after onboarding for ${updatedUser.FullName}`
      );
    } catch (streamError) {
      console.log(
        "Error updating Stream user during Onboardeng:",
        streamError.message
      );
    }

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Onboarding error", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
} //1.23
