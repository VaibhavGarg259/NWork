import { Link, useLocation } from "react-router-dom";
import {
  BellIcon,
  EarthIcon,
  HomeIcon,
  LogOutIcon,
  PlusCircle,
  UsersIcon,
} from "lucide-react";

import useAuthUser from "../hooks/useAuthUser";
import useLogout from "../hooks/useLogout";
import ThemeSelector from "./ThemeSelector";

const Sidebar = () => {
  const { authUser } = useAuthUser();
  const { logoutMutation } = useLogout();
  const { pathname } = useLocation();

  const navLinks = [
    { to: "/", label: "Home", icon: HomeIcon },
    { to: "/Friends", label: "Friends", icon: UsersIcon },
    { to: "/notifications", label: "Notifications", icon: BellIcon },
    { to: "/create-post", label: "Create Post", icon: PlusCircle },
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 select-none flex-col border-r border-base-300 bg-base-200 lg:flex">
      {/* Logo */}
      <div className="border-b border-base-300 p-5">
        <Link to="/" className="group flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-md transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105">
            {/* <EarthIcon className="size-7 text-white" /> */}
            <img src="/logo.png" alt="logo image" />
          </div>

          <div className="flex flex-col">
            <span className="bg-gradient-to-r from-primary via-purple-500 to-secondary bg-clip-text font-mono text-3xl font-extrabold tracking-wide text-transparent">
              NWork
            </span>

            {/* <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-base-content/50">
              Connect. Collaborate.
            </span> */}
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navLinks.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;

          return (
            <Link
              key={to}
              to={to}
              className={`btn btn-ghost w-full justify-start gap-3 px-3 normal-case ${
                active ? "btn-active bg-base-300" : ""
              }`}
            >
              <Icon className="size-5 opacity-70" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="mt-auto border-t border-base-300 p-4">
        <div className="flex items-center gap-2">
          <Link to={`/profile/${authUser?._id}`} className="avatar shrink-0">
            <div className="w-10 rounded-full">
              <img
                src={authUser?.profilepic || "/default-avatar.png"}
                alt={authUser?.FullName || "User"}
              />
            </div>
          </Link>

          <Link to={`/profile/${authUser?._id}`} className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {authUser?.FullName || "User"}
            </p>

            <p className="flex items-center gap-1 text-xs text-success">
              <span className="inline-block size-2 rounded-full bg-success" />
              Online
            </p>
          </Link>

          <ThemeSelector placement="top" />

          <button
            type="button"
            className="btn btn-ghost btn-circle btn-sm"
            onClick={() => logoutMutation()}
            aria-label="Logout"
            title="Logout"
          >
            <LogOutIcon className="size-5 opacity-70" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
