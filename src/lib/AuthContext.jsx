import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children, initialUser, initialPublicSettings }) => {
  const [user, setUser] = useState(initialUser);
  const [appPublicSettings] = useState(initialPublicSettings);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      appPublicSettings,
      login: setUser,
      logout: () => setUser(null),
      navigateToLogin: () => (window.location.href = "/vip/register"),
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);