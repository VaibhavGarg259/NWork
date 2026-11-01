import { io } from "socket.io-client";

export const socket = io("https://nwork-api.onrender.com", {
  autoConnect: false,
  withCredentials: true,
});
