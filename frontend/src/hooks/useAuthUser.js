import { getAuthUser } from "../lib/api";
import { useQuery } from "@tanstack/react-query";

const useAuthUser = () => {
  const authUser = useQuery({
    queryKey: ["authUser"],
    queryFn: getAuthUser,
    retry: false, //one // auth check
    staleTime: 0, // <-- IMPORTANT: always fetch latest user
    cacheTime: 0, //<-- IMPORTANT: always fetch latest user
  });

  return { isLoading: authUser.isLoading, authUser: authUser.data?.user };
};
export default useAuthUser;
