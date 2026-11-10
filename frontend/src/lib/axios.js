import axios from "axios";

export const axiosInstance = axios.create({
  // baseURL: "http://localhost:5001/api",
  baseURL: "https://nwork-api.onrender.com/api",
  withCredentials: true, //send cookies with the request
});
