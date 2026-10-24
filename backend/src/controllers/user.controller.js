import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";

export async function getRecommendedUsers(req, res) {
  try {
    const { location, learningLanguage } = req.query;

    const filter = {
      _id: { $ne: req.user._id },
    };

    if (location) {
      filter.location = {
        $regex: location,
        $options: "i",
      };
    }

    if (learningLanguage) {
      filter.learningLanguage = {
        $regex: learningLanguage,
        $options: "i",
      };
    }

    const users = await User.find(filter);

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function getMyFriends(req, res) {
  try {
    const user = await User.findById(req.user._id)
      .select("friends")
      .populate(
        "friends",
        "FullName profilepic nativeLanguage learningLanguage location bio",
      );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user.friends || []);
  } catch (error) {
    console.error("Error in getMyFriends controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function sendFriendRequest(req, res) {
  try {
    const myId = req.user._id;
    const { id: recipientId } = req.params;

    // prevent sending req to yourself
    if (myId.toString() === recipientId) {
      return res
        .status(400)
        .json({ message: "You can't send friend request to yourself" });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    //check if user is already friends
    if (recipient.friends.includes(myId)) {
      return res
        .status(400)
        .json({ message: "You are already friends with this user" });
    }

    //check if a req already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: myId, recipient: recipientId },
        { sender: recipientId, recipient: myId },
      ],
    });

    if (existingRequest) {
      return res.status(400).json({
        message: "A friend request already exists between you and this user",
      });
    }

    const friendRequest = await FriendRequest.create({
      sender: myId,
      recipient: recipientId,
      status: "Pending",
    });

    res.status(201).json(friendRequest);
  } catch (error) {
    console.error("Error in sendFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
} //1:47:54

export async function acceptFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }
    if (friendRequest.recipient.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to accept this request" });
    }

    friendRequest.status = "Accepted";
    await friendRequest.save();

    //add each user to the other's friends array
    //$addToSet: adds elements to an array only if they do not already exist.
    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.recipient },
    });

    await User.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: { friends: friendRequest.sender },
    });

    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    console.log("Error in acceptFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getFriendRequests(req, res) {
  try {
    const incomingReqs = await FriendRequest.find({
      recipient: req.user._id,
      status: "Pending",
    }).populate(
      "sender",
      "FullName profilepic nativeLanguage learningLanguage",
    );

    const acceptedReqs = await FriendRequest.find({
      sender: req.user._id,
      status: "Accepted",
    }).populate("recipient", "FullName profilepic");

    res.status(200).json({
      incomingReqs,
      acceptedReqs,
    });
  } catch (error) {
    console.log("Error in getPendingFriendRequests controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getoutgoingFriendReqs(req, res) {
  try {
    const outgoingRequests = await FriendRequest.find({
      sender: req.user._id,
      status: "Pending",
    }).populate(
      "recipient",
      "FullName profilepic nativeLanguage learningLanguage",
    );

    res.status(200).json(outgoingRequests);
  } catch (error) {
    console.log("Error in getoutgoingFriendReqs controller", error.message);
    res.status(500).json({ message: "Internal server Error" });
  }
}

export const getUserById = async (req, res) => {
  try {
    // console.log("Incoming userId:", req.params.userId);
    const { userId } = req.params;
    const user = await User.findById(userId).select("-password"); //exclude password

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    console.error("Error in getUserById:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getsearchUser = async (req, res) => {
  try {
    const { q, location, learningLanguage } = req.query;

    const query = {
      _id: { $ne: req.user._id }, // exclude self
    };

    if (q) query.FullName = { $regex: q, $options: "i" };
    if (location) query.city = { $regex: location, $options: "i" };
    if (learningLanguage)
      query.learningLanguage = { $regex: learningLanguage, $options: "i" };

    const users = await User.find(query).select("-password").limit(50);

    res.status(200).json(users);
  } catch (error) {
    console.error("Error in getsearchUser:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
