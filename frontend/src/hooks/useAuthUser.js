import { getAuthUser } from "../lib/api";
import { useQuery } from "@tanstack/react-query";

const useAuthUser = () => {
  const authUser = useQuery({
    queryKey: ["authUser"],
    queryFn: getAuthUser,
    retry: false, //one // auth check
  });

  return { isloading: authUser.isloading, authUser: authUser.data?.user };
};
export default useAuthUser;
