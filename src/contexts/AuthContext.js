"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  GoogleAuthProvider 
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authState) => {
      if (authState) {
        const userRef = doc(db, "users", authState.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const dadosExistentes = userSnap.data();
          setUser({ uid: authState.uid, ...dadosExistentes });
          
          // REGRA DE REDIRECIONAMENTO:
          // Se não tiver CPF ou se o bairroId no endereço estiver vazio
          // E se ele já não estiver na página de cadastro (para não dar loop)
          const incompleto = !dadosExistentes.cpf || !dadosExistentes.endereco?.bairroId;
          
          if (incompleto && pathname !== "/cadastro") {
            router.push("/cadastro");
          }
        } else {
          // Usuário novo total
          setUser({ 
            uid: authState.uid, 
            displayName: authState.displayName, 
            email: authState.email, 
            photoURL: authState.photoURL 
          });
          if (pathname !== "/cadastro") {
            router.push("/cadastro");
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router, pathname]);

  const loginGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Erro Google:", error);
    }
  };

  const logout = () => {
    signOut(auth);
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, loginGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};