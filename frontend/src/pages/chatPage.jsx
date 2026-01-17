import { useEffect, useState } from "react";
import { useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { getStreamToken } from "../lib/api";
import { useQuery } from "@tanstack/react-query";

import {
  Chat,
  Channel,
  ChannelHeader,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import { StreamChat } from "stream-chat";
import ChatLoader from "../components/ChatLoader";
import toast from "react-hot-toast";
import CallButton from "../components/CallButton";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const chatPage = () => {
  const { id: targetUserId } = useParams();

  // console.log(id);

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  const { authUser } = useAuthUser();

  const { data } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser, // this will run only when authUser is available
  });

  useEffect(() => {
    if (!data?.token || !authUser) return;

    const initChat = async () => {
      try {
        console.log("Initializing stream chat client...");

        const client = StreamChat.getInstance(STREAM_API_KEY);

        await client.connectUser(
          {
            id: authUser._id,
            name: authUser.FullName,
            image: authUser.profilepic,
          },
          data.token
        );

        const channelId = [authUser._id, targetUserId].sort().join("-");

        const chatChannel = client.channel("messaging", channelId, {
          members: [authUser._id, targetUserId],
        });

        await chatChannel.watch();

        setChatClient(client);
        setChannel(chatChannel);
      } catch (error) {
        console.error("Error initializing chat:", error);
        toast.error("Could not connect to chat. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    initChat();

    return () => {
      if (chatClient) chatClient.disconnectUser();
    };
  }, [data, authUser, targetUserId]);

  const handleVideoCall = () => {
    if (channel) {
      const callUrl = `${window.location.origin}/call/${channel.id}`;

      channel.sendMessage({
        text: `I've started a video call. Join me here: ${callUrl}`,
      });

      toast.success("video call link sent successfully!");
    }
  };

  if (loading || !chatClient || !channel) return <ChatLoader />;

  return (
    <div className="h-[93vh]">
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <div className="w-full relative">
            <CallButton handleVideoCall={handleVideoCall} />
            <Window>
              <ChannelHeader />
              <MessageList />
              <MessageInput focus />
            </Window>
          </div>

          <Thread />
        </Channel>
      </Chat>
    </div>
  );
};

export default chatPage;
