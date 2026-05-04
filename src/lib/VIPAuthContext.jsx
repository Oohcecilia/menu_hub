import React, { createContext, useContext, useState, useEffect } from 'react';

const VIPAuthContext = createContext();

// 🔒 Static test user
const TEST_USER = {
  id: 'vip-001',
  full_name: 'Test User',
  user_email: 'test@example.com',
  pin: '1234',
  membership_tier: 'bronze',
  points: 100,
  joined_date: '2026-01-01',
};

export function VIPAuthProvider({ children }) {
  const [vipUser, setVipUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('vip_user');
    if (stored) {
      try {
        setVipUser(JSON.parse(stored));
      } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    await new Promise((r) => setTimeout(r, 300));

    if (email !== TEST_USER.user_email) {
      throw new Error('No VIP account found for this email.');
    }

    if (password !== TEST_USER.pin) {
      throw new Error('Incorrect password.');
    }

    setVipUser(TEST_USER);
    localStorage.setItem('vip_user', JSON.stringify(TEST_USER));
    return TEST_USER;
  };

  const register = async ({ full_name, email, password, phone }) => {
    const newUser = {
      ...TEST_USER,
      id: 'vip-' + Date.now(),
      full_name,
      user_email: email,
      pin: password,
      phone,
    };

    setVipUser(newUser);
    localStorage.setItem('vip_user', JSON.stringify(newUser));
    return newUser;
  };

  const logout = () => {
    setVipUser(null);
    localStorage.removeItem('vip_user');
  };

  const refreshMember = async () => {
    return vipUser;
  };

  return (
    <VIPAuthContext.Provider
      value={{
        vipUser,
        loading,
        login,
        register,
        logout,
        refreshMember,
      }}
    >
      {children}
    </VIPAuthContext.Provider>
  );
}

export function useVIPAuth() {
  return useContext(VIPAuthContext);
}