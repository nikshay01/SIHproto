import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001/api";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("elocate_token") || null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState("signin"); // "signin" | "signup"
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Initialize and verify user from stored token
  useEffect(() => {
    async function verifySession() {
      const savedToken = localStorage.getItem("elocate_token");
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${savedToken}` }
        });

        if (res.data?.ok && res.data?.user) {
          setUser(res.data.user);
          setToken(savedToken);
        } else {
          // Stale token
          localStorage.removeItem("elocate_token");
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        console.warn("Session restore failed, falling back to guest:", err.message);
        localStorage.removeItem("elocate_token");
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    }

    verifySession();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
      if (res.data?.ok) {
        const { token: newToken, user: userData } = res.data;
        localStorage.setItem("elocate_token", newToken);
        setToken(newToken);
        setUser(userData);
        setAuthModalOpen(false);
        return { success: true, user: userData };
      }
      return { success: false, error: res.data?.error || "Login failed" };
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || "Failed to sign in";
      return { success: false, error: errMsg };
    }
  };

  const register = async (formData) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/register`, formData);
      if (res.data?.ok) {
        const { token: newToken, user: userData } = res.data;
        localStorage.setItem("elocate_token", newToken);
        setToken(newToken);
        setUser(userData);
        setAuthModalOpen(false);
        return { success: true, user: userData, message: res.data.message };
      }
      return { success: false, error: res.data?.error || "Registration failed" };
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || "Failed to register";
      return { success: false, error: errMsg };
    }
  };

  const updateProfile = async (profileData) => {
    if (!token) return { success: false, error: "Not authenticated" };
    try {
      const res = await axios.put(`${API_BASE}/auth/profile`, profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.ok) {
        setUser(res.data.user);
        return { success: true, user: res.data.user };
      }
      return { success: false, error: res.data?.error || "Update failed" };
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || "Failed to update profile";
      return { success: false, error: errMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem("elocate_token");
    setUser(null);
    setToken(null);
    setProfileModalOpen(false);
  };

  const openAuthModal = (tab = "signin") => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const openProfileModal = () => {
    setProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setProfileModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user),
        loading,
        authModalOpen,
        authModalTab,
        setAuthModalTab,
        profileModalOpen,
        login,
        register,
        updateProfile,
        logout,
        openAuthModal,
        closeAuthModal,
        openProfileModal,
        closeProfileModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
export default AuthContext;
