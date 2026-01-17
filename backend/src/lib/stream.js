// import { StreamChat } from "stream-chat";
// import { StreamClient } from "@stream-io/node-sdk";
// // import { StreamChat } from "@stream-io/node-sdk";
// import "dotenv/config";

// const apiKey = process.env.STREAM_API_KEY;
// const apiSecret = process.env.STREAM_API_SECRET;

// if (!apiKey || !apiSecret) {
//   console.error("stream API key or secret is missing");
// }

// const streamClient = StreamChat.getInstance(apiKey, apiSecret);

// export const upsertStreamUser = async (useData) => {
//   try {
//     await streamClient.upsertUser(useData);
//     return useData;
//   } catch (error) {
//     console.error("Error upserting stream user", error);
//   }
// };

// // todo: do it latest
// export const generateStreamToken = (userId) => {
//   try {
//     //ensure userId is a string
//     const userIdStr = userId.toString();
//     return streamClient.createToken(userIdStr);
//   } catch (error) {}
// };
//1:12

import { StreamClient } from "@stream-io/node-sdk";
import "dotenv/config";

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

if (!apiKey || !apiSecret) {
  throw new Error("Stream API key or secret is missing");
}

const streamClient = new StreamClient(apiKey, apiSecret);

export const upsertStreamUser = async (userData) => {
  try {
    await streamClient.upsertUsers([userData]);
    return userData;
  } catch (error) {
    console.error("Error upserting stream user:", error);
    throw error;
  }
};

export const generateStreamToken = (userId) => {
  try {
    return streamClient.createToken(String(userId));
  } catch (error) {
    console.error("Error generating stream token:", error);
    throw error;
  }
};
