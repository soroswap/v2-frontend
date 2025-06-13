"use client";

import { createContext, ReactNode, useContext, useState } from "react";

interface UserContextProps {
  address: string | null;
  setAddress: (address: string | null) => void;
}

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [address, setAddress] = useState<string | null>(null);

  return (
    <UserContext.Provider value={{ setAddress, address }}>
      {children}
    </UserContext.Provider>
  );
};

export const UserContext = createContext<UserContextProps>({
  address: null,
  setAddress: () => {},
});

export const useUserContext = () => useContext(UserContext);
