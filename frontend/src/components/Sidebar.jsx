import useAuthUser from "../hooks/useAuthUser";
import { Link, useLocation } from "react-router";
import { BellIcon, EarthIcon, HomeIcon, UsersIcon } from "lucide-react";

const Sidebar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const currentPath = location.pathname;

  // console.log(currentPath);

  return (
    <aside className="w-64 bg-base-200 border-r border-base-300 hidden lg:flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-bose-300 ">
        <Link to="/" className=" flex items-center gap-2.5">
          <EarthIcon className="size-9 text-emerald-700" />
          <span className="text-4xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
            NWork
          </span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <Link
          to="/"
          className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
            currentPath === "/" ? "bg-base-300" : ""
          }`}
        >
          <HomeIcon className="size-5 text-base-content opacity-70" />
          <span>Home</span>
        </Link>

        <Link
          to="/Friends"
          className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
            currentPath === "/Friends" ? "btn-active" : ""
          }`}
        >
          <UsersIcon className="size-5 text-base-content opacity-70" />
          <span>Friends</span>
        </Link>

        <Link
          to="/notifications"
          className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
            currentPath === "/notifications" ? "btn-active" : ""
          }`}
        >
          <BellIcon className="size-5 text-base-content opacity-70" />
          <span>Notifications</span>
        </Link>
      </nav>

      {/* user Profile section  */}
      <div className="p-4 border-t border-base-300 mt-auto">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-10 rounded-full">
              <img src={authUser?.profilepic} alt="User Avat" />
            </div>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{authUser?.FullName}</p>
            <p className="text-xs text-success flex items-center gap-1">
              <span className="size-2 rounded-full bg-success inline-block " />
              online
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
