import { useMutation, useQueryClient } from "@tanstack/react-query";
import { commentPost } from "../lib/api";

const useComment = () => {
  const queryClient = useQueryClient();

  const {
    mutate: commentMutation,
    isPending,
    error,
  } = useMutation({
    mutationFn: ({ postId, text }) => commentPost(postId, text),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },

    onError: (error) => {
      console.error(
        "Error adding comment:",
        error.response?.data || error.message,
      );
    },
  });

  return {
    commentMutation,
    isPending,
    error,
  };
};

export default useComment;
