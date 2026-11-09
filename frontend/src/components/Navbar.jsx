import useAuthUser from "../hooks/useAuthUser";
import useLogout from "../hooks/useLogout";
import { Link } from "react-router";
import { BellIcon, LogOutIcon, PlusCircle, User } from "lucide-react";
import ThemeSelector from "./ThemeSelector.jsx";

const Navbar = () => {
  const { authUser } = useAuthUser();
  const { logoutMutation } = useLogout();

  const iconBtn = "btn btn-ghost btn-circle btn-sm sm:btn-md";
  const icon = "size-5 text-base-content opacity-70 sm:size-6";

  return (
    <nav className="sticky top-0 z-30 flex h-16 select-none items-center border-b border-base-300 bg-base-200">
      <div className="container mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex w-full items-center justify-between gap-1">
          {/* Logo */}
          <Link
            to="/"
            className="group flex min-w-0 items-center gap-2 sm:gap-3"
          >
            <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary to-secondary shadow-md transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105 sm:size-11">
              <img
                src="/logo.png"
                alt="logo"
                className="size-full object-cover"
              />
            </div>

            {/* Naam sirf badi screen par, mobile par jagah bachane ke liye hidden */}
            <span className="hidden bg-gradient-to-r from-primary via-purple-500 to-secondary bg-clip-text font-mono text-2xl font-extrabold tracking-wide text-transparent sm:inline sm:text-3xl">
              NWork
            </span>
          </Link>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            {/* notifications  */}
            <Link
              to="/notifications"
              className={iconBtn}
              aria-label="Notifications"
            >
              <BellIcon className={icon} />
            </Link>

            {/* friend  */}
            <Link to="/friends" className={iconBtn} aria-label="Friends">
              <User className={icon} />
            </Link>

            {/* post  */}
            <Link
              to="/create-post"
              className={iconBtn}
              aria-label="Create post"
            >
              <PlusCircle className={icon} />
            </Link>

            {/* theme  */}
            <ThemeSelector />

            {/* profile  */}
            <Link
              to={`/profile/${authUser?._id}`}
              className="avatar mx-0.5 shrink-0"
              aria-label="Profile"
            >
              <div className="w-8 rounded-full sm:w-9">
                <img src={authUser?.profilepic} alt="User Avatar" />
              </div>
            </Link>

            {/* logout  */}
            <button
              type="button"
              className={iconBtn}
              onClick={logoutMutation}
              aria-label="Logout"
            >
              <LogOutIcon className={icon} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
