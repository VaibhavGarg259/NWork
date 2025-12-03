import { generteStreamToken } from "../lib/stream.js";

export async function getStreamToken(req, res) {
  try {
    const token = generteStreamToken(req.user.id);

    res.status(200).json({ token });
  } catch (error) {
    console.log("Error in getStreamToken controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
