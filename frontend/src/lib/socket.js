import { io } from "socket.io-client";

// export const socket = io("https://nwork-api.onrender.com", {
//   autoConnect: false,
//   withCredentials: true,
// });

export const socket = io("http://localhost:5001", {
  autoConnect: false,
  withCredentials: true,
});
