import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const Layout = ({ children, showSidebar = false }) => {
  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen">
        {showSidebar && <Sidebar />}

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile par show, PC par hide */}
          <div className="block lg:hidden">
            <Navbar />
          </div>

          <main className="flex-1 overflow-y-auto scrollbar-none">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
