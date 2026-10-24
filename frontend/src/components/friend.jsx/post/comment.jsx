import { useMutation } from "@tanstack/react-query";
import { commentPost } from "../lib/api";

const useComment = () => {
  const { mutate: commentMutation, isPending } = useMutation({
    mutationFn: ({ postId, text }) => commentPost(postId, text),
  });

  return { commentMutation, isPending };
};

export default useComment;
