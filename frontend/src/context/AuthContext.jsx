import React, { createContext, useState, useEffect, useContext } from "react";
import {
  loadTokens,
  refreshAccessToken,
  getCurrentUser,
  logoutUser as logoutAPI,
} from "../api/api";

// Create the context
const AuthContext = createContext();

// Custom hook to use the AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      // 1. Load tokens from localStorage
      const tokens = loadTokens();
      if (!tokens) {
        setLoading(false);
        return;
      }

      try {
        // 2. Get current user data
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch user", error);

        // 3. Try refreshing the token
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          try {
            const userData = await getCurrentUser();
            setUser(userData);
          } catch (err) {
            console.error("Still failed after refresh", err);
            logoutUser(); // Final fallback
          }
        } else {
          logoutUser();
        }
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const logoutUser = () => {
    logoutAPI(); // Clears localStorage and headers
    setUser(null);
  };

  const value = {
    user,
    setUser,
    logoutUser,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};