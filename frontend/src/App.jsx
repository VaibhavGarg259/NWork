import React, { useEffect, useState } from "react";
import { Route, Routes, Navigate } from "react-router";

import Homepage from "./pages/Homepage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import LoginPage from "./pages/loginPage.jsx";
import Notificationspage from "./pages/NotificationsPages.jsx";
import FriendPage from "./pages/FriendPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import ChatPage from "./pages/chatPage.jsx";
import CallPage from "./pages/CallPage.jsx";

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
  const isonboarded = authUser?.isonboarded;

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
          path="/call"
          element={isAuthenticated ? <CallPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/chat"
          element={isAuthenticated ? <ChatPage /> : <Navigate to="/login" />}
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
      </Routes>

      <Toaster />
    </div>
  );
};

export default App;
