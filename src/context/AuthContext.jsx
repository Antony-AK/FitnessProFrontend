import axios from "axios";
import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

const API_URL = "http://localhost:5000";
// or your fitness backend

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔁 Auto-login on refresh
  useEffect(() => {
    const token = localStorage.getItem("titan_token");
    if (!token) {
      setLoading(false);
      return;
    }

    axios
      .get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setUser(res.data))
      .catch(() => {
        localStorage.removeItem("titan_token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // 🔐 LOGIN
  const login = async (email, password) => {
    const res = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });

    localStorage.setItem("titan_token", res.data.token);
    setUser(res.data.user);
  };

  // 📝 SIGNUP
  const signup = async (name, email, password) => {
    const res = await axios.post(`${API_URL}/auth/signup`, {
      name,
      email,
      password
    });

    localStorage.setItem("titan_token", res.data.token);
    setUser(res.data.user);
  };

  // 🧠 SAVE ONBOARDING
  const saveProfile = async (profile) => {
    const token = localStorage.getItem("titan_token");

    await axios.put(`${API_URL}/auth/onboarding`, profile, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const res = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    setUser(res.data);
  };

  const updateProfile = async (data) => {
    const token = localStorage.getItem("titan_token");

    const res = await axios.put(
      `${API_URL}/auth/profile`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setUser(res.data); // refresh everywhere
    return true;       // ✅ tell UI it worked
  };



  const logout = () => {
    localStorage.removeItem("titan_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, saveProfile, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
