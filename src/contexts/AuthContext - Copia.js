// src/contexts/AuthContext.js
import { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithPhoneNumber, 
  signOut 
} from "firebase/auth";
import { auth, googleProvider, setupRecaptcha } from "../lib/firebase";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Função para Logar com Google (Grátis e Rápido para Clientes)
  const loginGoogle = async () => {
    try {
      return await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Erro no Google Login:", error);
      throw error;
    }
  };

  // 2. Função para Logar com Celular (Seguro para Motoboys)
  // Nota: O 'appVerifier' é o Recaptcha invisível que configuramos antes
  const loginPhone = async (phoneNumber, appVerifier) => {
    try {
      return await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    } catch (error) {
      console.error("Erro no Login Celular:", error);
      throw error;
    }
  };

  // 3. Função de Sair (Logout)
  const logout = async () => {
    setUser(null);
    await signOut(auth);
  };

  // 4. O EFEITO VIGIA (Monitora se o usuário fechou o navegador e voltou logado)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // Parar de carregar quando achar o usuário
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loginGoogle, 
      loginPhone, 
      logout,
      loading 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};