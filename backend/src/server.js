import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import { createServer } from "node:http";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";
import postRoutes from "./routes/post.route.js";

import { connectDB } from "./lib/db.js";
import { initSocket } from "./lib/socket.js";
import http from "http";

// const httpServer = http.createServer(app);

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT;

app.use(
  cors({
    origin: "https://nworkvg.vercel.app",
    credentials: true, //allow frontend to send cookies
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/post", postRoutes);
// app.use("/uploads", express.static("uploads"));

initSocket(httpServer);

// app.listen(PORT, () => {
//   console.log(`Server is runing on port ${PORT}`);
//   connectDB();
// });
const startServer = async () => {
  try {
    await connectDB();

    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

startServer();
