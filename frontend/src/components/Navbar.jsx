import useAuthUser from "../hooks/useAuthUser";
import useLogout from "../hooks/useLogout";
import { Link, useLocation } from "react-router";
import {
  BellIcon,
  EarthIcon,
  LogOutIcon,
  PlusCircle,
  User,
} from "lucide-react";
import ThemeSelector from "./ThemeSelector.jsx";

const Navbar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const isChatPage = location.pathname?.startsWith("/chat");

  //   const queryClient = useQueryClient();

  //   const { mutate: logoutMutation } = useMutation({
  //     mutationFn: logout,
  //     onSuccess: () => queryClient.invalidateQueries({ queryKey: ["authUser"] }),
  //   });

  const { logoutMutation } = useLogout();

  return (
    <nav className="bg-base-200 border-b border-base-300 sticky top-0 z-30 h-16 flex items-center">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-end w-full">
          {/* Logo - only in the chat page  */}
          {isChatPage && (
            <div className="pl-5">
              <Link to="/" className="flex items-center gap-2.5">
                <EarthIcon className="size-9 text-emerald-600" />
                <span className="text-3xl font-bold font-mono bg-clip-text text-emerald-700 bg-gradient-to-r from-primary to-secondary tracking-wider">
                  NWork
                </span>
              </Link>
            </div>
          )}
          <div className="flex items-center   ml-auto">
            <Link to={"/notifications"}>
              <button className="btn btn-ghost btn-circle">
                <BellIcon className="h-6 w-6 text-base-content opacity-70" />
              </button>
            </Link>
            {/* firend icon  */}
            <div>
              <Link to={"/friends"}>
                <button className="btn btn-ghost btn-circle">
                  <User className="h-6 w-6 text-base-content opacity-70" />
                </button>
              </Link>
            </div>
          </div>
          {/* createPostPage  */}
          <div>
            <Link to={"/create-post"}>
              <button className="btn btn-ghost btn-circle">
                <PlusCircle className="h-6 w-6 text-base-content opacity-70" />
              </button>
            </Link>
          </div>

          {/* Todo  */}
          <ThemeSelector />
          <Link to={`/profile/${authUser?._id}`}>
            <>
              <div className="avatar">
                <div className="w-9 rounded-full">
                  <img
                    src={authUser?.profilepic}
                    alt="User Avatar"
                    rel="noreferrer"
                  />
                </div>
              </div>
            </>
          </Link>
          {/* Logout button  */}
          <button className="btn btn-ghost btn-circle" onClick={logoutMutation}>
            <LogOutIcon className="h-6 w-6 text-base-content opacity-70" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
