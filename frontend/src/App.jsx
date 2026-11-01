import { useEffect } from "react";
import { Route, Routes, Navigate } from "react-router";
import { Toaster } from "react-hot-toast";
// pages
import Homepage from "./pages/Homepage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import LoginPage from "./pages/loginPage.jsx";
import Notificationspage from "./pages/NotificationsPages.jsx";
import FriendPage from "./pages/FriendPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import ChatPage from "./pages/chatPage.jsx";
import CreatePostPage from "./pages/CreatePostPage.jsx";
import Profilepage from "./pages/Profilepage.jsx";
import PostPage from "./pages/PostPage.jsx";
// components
import Layout from "./components/Layout";
import PageLoader from "./components/PageLoader.jsx";

import useAuthUser from "./hooks/useAuthUser.js";
import { useThemeStore } from "./store/useThemeStore.js";
import { socket } from "./lib/socket";
const App = () => {
  // tanstack query crash course

  const { isLoading, authUser } = useAuthUser();
  const { theme } = useThemeStore();

  // const [data, setData] = useState();

  const isAuthenticated = Boolean(authUser);
  const isonboarded = authUser?.isOnboarded;

  // Hooks hamesha early return se pehle
  useEffect(() => {
    if (authUser) {
      socket.connect();
    } else {
      socket.disconnect();
    }
  }, [authUser]);

  if (isLoading) return <PageLoader />;

  const Protected = ({ children }) =>
    isAuthenticated && isonboarded ? (
      <Layout showSidebar={true}>{children}</Layout>
    ) : (
      <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
    );

  return (
    <div className="scrollbar-none md:scrollbar-auto" data-theme={theme}>
      <Routes>
        <Route
          path="/"
          element={
            <Protected>
              {" "}
              <Homepage />{" "}
            </Protected>
          }
        />
        <Route
          path="/create-post"
          element={
            <Protected>
              <CreatePostPage />
            </Protected>
          }
        />
        <Route
          path="/signup"
          element={
            !isAuthenticated ? (
              <SignUpPage />
            ) : (
              <Navigate to={isonboarded ? "/" : "/onboarding"} />
            )
          }
        />
        <Route
          path="/login"
          element={
            !isAuthenticated ? (
              <LoginPage />
            ) : (
              <Navigate to={isonboarded ? "/" : "/onboarding"} />
            )
          }
        />
        <Route
          path="/notifications"
          element={
            <Protected>
              <Notificationspage />
            </Protected>
          }
        />
        <Route
          path="/Friends"
          element={
            <Protected>
              <FriendPage />
            </Protected>
          }
        />

        <Route
          path="/chat/:id"
          element={
            <Protected>
              <ChatPage />
            </Protected>
          }
        />

        <Route
          path="/onboarding"
          element={
            isAuthenticated ? (
              <OnboardingPage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/profile/:id"
          element={
            <Protected>
              {" "}
              <Profilepage />
            </Protected>
          }
        />
        <Route
          path="/post/:postId"
          element={
            <Protected>
              <PostPage />
            </Protected>
          }
        />
      </Routes>

      <Toaster />
    </div>
  );
};

export default App;
