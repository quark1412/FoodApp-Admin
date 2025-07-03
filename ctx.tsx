import {
  useContext,
  createContext,
  type PropsWithChildren,
  useState,
  useEffect,
} from "react";
import { useStorageState } from "./useStorageState";

const AuthContext = createContext<{
  signIn: () => void;
  signOut: () => void;
  session?: string | null;
  isLoading: boolean;
}>({
  signIn: () => null,
  signOut: () => null,
  session: null,
  isLoading: false,
});

export function useSession() {
  const value = useContext(AuthContext);
  if (process.env.NODE_ENV !== "production") {
    if (!value) {
      throw new Error("useSession must be wrapped in a <SessionProvider />");
    }
  }

  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [[isLoading, session], setSession] = useStorageState("session");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isLoading) {
      setLoading(false);
    }
  }, [isLoading]);

  return (
    <AuthContext.Provider
      value={{
        signIn: () => {
          // Perform sign-in logic here
          setSession("session");
        },
        signOut: () => {
          setSession(null);
        },
        session,
        isLoading: loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
