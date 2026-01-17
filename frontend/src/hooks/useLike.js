// useLike.js;

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleLike } from "../lib/api";

const useToggleLike = () => {
  const queryclient = useQueryClient();

  const { mutate, isPending, error } = useMutation({
    mutationFn: toggleLike,
    onSuccess: () => {
      //Posts ko refresh karo take latest like count turant aajaye

      queryclient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
  return { toggleLikeMutation: mutate, isPending, error };
};

export default useToggleLike;
