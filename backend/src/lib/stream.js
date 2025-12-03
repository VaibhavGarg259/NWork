import { StreamChat } from "stream-chat";
import "dotenv/config";

const apiKey = process.env.STEAM_API_KEY;
const apiSecret = process.env.STEAM_API_SECRET;

if (!apiKey || !apiSecret) {
  console.error("strem API key or secret is missing");
}

const streamClient = StreamChat.getInstance(apiKey, apiSecret);

export const upsertStreamUser = async (useData) => {
  try {
    await streamClient.upsertUser(useData);
    return useData;
  } catch (error) {
    console.error("Error upserting stream user", error);
  }
};

// todo: do it latest
export const generteStreamToken = (userId) => {
  try {
    //ensure userId is a string
    const userIdStr = userId.toString();
    return streamClient.createToken(userIdStr);
  } catch (error) {}
};
//1:12
