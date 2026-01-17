import mongoose from "mongoose";

const friendRequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);

export default FriendRequest;
