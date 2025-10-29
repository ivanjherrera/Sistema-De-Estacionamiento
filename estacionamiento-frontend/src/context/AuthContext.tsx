import { createContext } from "react";

export interface User {
  id: number;
  username: string;
  role: "ADMIN" | "USER";
  token: string;
}

export interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

// Se exporta el contexto vacío inicialmente
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
