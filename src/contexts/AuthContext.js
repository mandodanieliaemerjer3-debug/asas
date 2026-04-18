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
  const [cpfValue, setCpfValue] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authState) => {
      if (authState) {
        const userRef = doc(db, "users", authState.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUser({ uid: authState.uid, ...userSnap.data() });
        } else {
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
      console.error("Erro Google:", error);
    }
  };

  const finalizarCadastro = async (cpfLimpo) => {
    if (!tempUser) return;
    
    try {
      const novoUsuario = {
        uid: tempUser.uid,
        email: tempUser.email || "",
        displayName: tempUser.displayName || "Usuário Mogu",
        photoURL: tempUser.photoURL || "",
        cpf: cpfLimpo,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", tempUser.uid), novoUsuario);
      setUser(novoUsuario);
      setShowCPFModal(false);
    } catch (error) {
      console.error("Erro ao salvar CPF:", error);
      alert("Erro ao salvar dados. Tente novamente.");
    }
  };

  // Função para aplicar máscara de CPF (000.000.000-00)
  const handleCpfChange = (e) => {
    let val = e.target.value.replace(/\D/g, ""); // Remove tudo que não é número
    if (val.length > 11) val = val.slice(0, 11); // Limita a 11 números

    // Aplica a máscara visual
    const m = val.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
               .replace(/(\d{3})(\d{3})(\d{3})/, "$1.$2.$3")
               .replace(/(\d{3})(\d{3})/, "$1.$2");
    
    setCpfValue(m);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginGoogle, logout: () => signOut(auth) }}>
      {children}

      {showCPFModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z- flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl scale-in-center">
            <div className="w-20 h-2 bg-yellow-400 rounded-full mx-auto mb-6"></div>
            
            <h2 className="font-black uppercase italic text-xl text-gray-800 text-center">
              Segurança Mogu Mogu
            </h2>
            
            <p className="my-4 text-[10px] font-bold text-gray-500 uppercase leading-tight text-center">
              Precisamos do seu CPF para validar pagamentos no Mercado Pago. 
              Seus dados estão protegidos e usamos apenas seu apelido no App.
            </p>

            <input 
              type="text" 
              value={cpfValue}
              onChange={handleCpfChange}
              placeholder="000.000.000-00"
              className="w-full bg-gray-100 p-4 rounded-2xl font-black text-center text-xl outline-none border-2 border-transparent focus:border-yellow-400 transition-all"
            />

            <button 
              onClick={() => {
                const apenasNumeros = cpfValue.replace(/\D/g, '');
                if(apenasNumeros.length === 11) {
                  finalizarCadastro(apenasNumeros);
                } else {
                  alert(`CPF incompleto. Faltam ${11 - apenasNumeros.length} números.`);
                }
              }}
              className="w-full mt-5 bg-black text-white p-5 rounded-[20px] font-black uppercase italic active:scale-95 transition-transform"
            >
              Confirmar e Entrar
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};