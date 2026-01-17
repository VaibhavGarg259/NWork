import { React, useEffect, useState } from "react";
import { Route, Routes, Navigate } from "react-router";
// import { Route, Routes, Navigate } from "react-router-dom";

import Homepage from "./pages/Homepage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import LoginPage from "./pages/loginPage.jsx";
import Notificationspage from "./pages/NotificationsPages.jsx";
import FriendPage from "./pages/FriendPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import ChatPage from "./pages/chatPage.jsx";
import CallPage from "./pages/CallPage.jsx";
import CreatePostPage from "./pages/CreatePostPage.jsx";
import Profilepage from "./pages/Profilepage.jsx";

import { Toaster } from "react-hot-toast";
import Layout from "./components/Layout";
import PageLoader from "./components/PageLoader.jsx";
import useAuthUser from "./hooks/useAuthUser.js";
import { useThemeStore } from "./store/useThemeStore.js";

const App = () => {
  // tanstack query crash course

  const { isLoading, authUser } = useAuthUser();
  const { theme } = useThemeStore();

  // const [data, setData] = useState();

  const isAuthenticated = Boolean(authUser);
  const isonboarded = authUser?.isOnboarded;

  if (isLoading) return <PageLoader />;

  return (
    <div className=" h-screen" data-theme={theme}>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated && isonboarded ? (
              <Layout showSidebar={true}>
                <Homepage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />
        <Route
          path="/create-post"
          element={
            <Layout showSidebar={true}>
              <CreatePostPage />
            </Layout>
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
            isAuthenticated && isonboarded ? (
              <Layout showSidebar={true}>
                <Notificationspage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />
        <Route
          path="/Friends"
          element={
            isAuthenticated && isonboarded ? (
              <Layout showSidebar={true}>
                <FriendPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />
        <Route
          path="/call/:id"
          element={
            isAuthenticated && isonboarded ? (
              <CallPage />
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />
        <Route
          path="/chat/:id"
          element={
            isAuthenticated && isonboarded ? (
              <Layout showSidebar={false}>
                <ChatPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />
        <Route
          path="/onboarding"
          element={
            isAuthenticated ? (
              !isonboarded ? (
                <OnboardingPage />
              ) : (
                <Navigate to="/" />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/profile/:id"
          element={
            isAuthenticated && isonboarded ? (
              <Layout showSidebar={true}>
                <Profilepage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />
      </Routes>

      <Toaster />
    </div>
  );
};

export default App;
