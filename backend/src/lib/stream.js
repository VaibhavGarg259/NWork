// import { StreamClient } from "@stream-io/node-sdk";
// import { StreamChat } from "stream-chat";
// import "dotenv/config";

// const apiKey = process.env.STREAM_API_KEY;
// const apiSecret = process.env.STREAM_API_SECRET;

// if (!apiKey || !apiSecret) {
//   throw new Error("Stream API key or secret is missing");
// }

// // Existing SDK: user management and token generation
// const streamClient = new StreamClient(apiKey, apiSecret);

// // Chat SDK: channel and message operations
// export const chatClient = StreamChat.getInstance(apiKey, apiSecret);

// export const upsertStreamUser = async (userData) => {
//   try {
//     await streamClient.upsertUsers([userData]);
//     return userData;
//   } catch (error) {
//     console.error("Error upserting stream user:", error);
//     throw error;
//   }
// };

// export const generateStreamToken = (userId) => {
//   try {
//     return streamClient.createToken(String(userId));
//   } catch (error) {
//     console.error("Error generating stream token:", error);
//     throw error;
//   }
// };
