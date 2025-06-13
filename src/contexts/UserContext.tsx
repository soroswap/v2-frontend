"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface UserContextProps {
  address: string | null;
  setAddress: (address: string | null) => void;
}

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [address, setAddress] = useState<string | null>(null);
  const [userContextData, setUserContextData] = useState<UserContextProps>({
    address,
    setAddress,
  });

  useEffect(() => {
    setUserContextData({
      address,
      setAddress,
    });
  }, [address]);

  return (
    <UserContext.Provider value={userContextData}>
      {children}
    </UserContext.Provider>
  );
};

export const UserContext = createContext<UserContextProps>({
  address: null,
  setAddress: () => {},
});

export const useUserContext = () => useContext(UserContext);
