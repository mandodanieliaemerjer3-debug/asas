"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithPhoneNumber, 
  signOut,
  GoogleAuthProvider 
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCPFModal, setShowCPFModal] = useState(false);
  const [tempUser, setTempUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authState) => {
      if (authState) {
        const userRef = doc(db, "users", authState.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUser({ uid: authState.uid, ...userSnap.data() });
        } else {
          // Usuário novo detectado
          setTempUser(authState);
          setShowCPFModal(true);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Erro ao logar com Google", error);
    }
  };

  const logout = () => signOut(auth);

  const finalizarCadastro = async (cpf) => {
    if (!tempUser) return;

    const userData = {
      uid: tempUser.uid,
      nome: tempUser.displayName || "Usuário Mogu",
      email: tempUser.email,
      foto: tempUser.photoURL,
      cpf: cpf,
      moedas: 0,
      level: 1,
      xp: 0,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "users", tempUser.uid), userData);
      setUser(userData);
      setShowCPFModal(false);
      setTempUser(null);
    } catch (error) {
      console.error("Erro ao salvar cadastro:", error);
      alert("Erro ao salvar seus dados. Tente novamente.");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginGoogle, logout }}>
      {children}

      {/* MODAL DE CPF - SEGURANÇA MOGU MOGU */}
      {showCPFModal && (
        <div className="fixed inset-0 z- flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-white rounded-[35px] p-8 max-w-sm w-full shadow-2xl text-center border-4 border-yellow-400">
            <div className="text-5xl mb-4">🛡️</div>
            <h2 className="font-black uppercase italic text-xl text-gray-800">Segurança Mogu Mogu</h2>
            
            <p className="my-4 text-[10px] font-bold text-gray-500 uppercase leading-tight">
              Precisamos do seu CPF para validar pagamentos no Mercado Pago. 
              Seus dados estão protegidos e usamos apenas seu apelido no App.
            </p>

            <input 
              id="cpfInput"
              type="text" 
              maxLength="14" // Alterado para 14 para aceitar pontos e traços
              placeholder="000.000.000-00"
              className="w-full bg-gray-100 p-4 rounded-2xl font-black text-center outline-none border-2 border-transparent focus:border-yellow-400"
            />

            <button 
              onClick={() => {
                // Captura o valor e remove tudo que não for número
                const val = document.getElementById("cpfInput").value.replace(/\D/g, '');
                
                // Agora validamos se restaram exatamente 11 números
                if(val.length === 11) {
                  finalizarCadastro(val);
                } else {
                  alert("CPF inválido (use 11 números)");
                }
              }}
              className="w-full mt-5 bg-black text-white p-5 rounded-[20px] font-black uppercase italic active:scale-95"
            >
              Confirmar e Entrar
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};