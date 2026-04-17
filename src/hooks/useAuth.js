import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";

export function useAuth() {
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }

  return authContext;
}
