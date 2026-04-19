"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  GoogleAuthProvider 
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCPFModal, setShowCPFModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  const [cpfValue, setCpfValue] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authState) => {
      if (authState) {
        const userRef = doc(db, "users", authState.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const dadosExistentes = userSnap.data();
          setUser({ uid: authState.uid, ...dadosExistentes });
          
          // LÓGICA DE ENDEREÇO: Se não tiver rua ou bairro, abre o popup
          if (!dadosExistentes.endereco || !dadosExistentes.endereco.rua || !dadosExistentes.endereco.bairro) {
            setShowAddressModal(true);
          }
        } else {
          // Usuário novo: primeiro pede o CPF
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

  const finalizarCadastroCPF = async (cpfLimpo) => {
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
      // Após o CPF, o useEffect vai rodar e abrir o AddressModal automaticamente
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar CPF.");
    }
  };

  const salvarEndereco = async (dadosEnd) => {
    try {
      await updateDoc(doc(db, "users", user.uid), {
        endereco: { ...dadosEnd, cidade: "Guapiara", estado: "SP" }
      });
      setUser({ ...user, endereco: { ...dadosEnd, cidade: "Guapiara", estado: "SP" } });
      setShowAddressModal(false);
    } catch (error) {
      alert("Erro ao salvar endereço.");
    }
  };

  const handleCpfChange = (e) => {
    let val = e.target.value.replace(/\D/g, "").slice(0, 11);
    const m = val.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
               .replace(/(\d{3})(\d{3})(\d{3})/, "$1.$2.$3")
               .replace(/(\d{3})(\d{3})/, "$1.$2");
    setCpfValue(m);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginGoogle: () => signInWithPopup(auth, new GoogleAuthProvider()), logout: () => signOut(auth), setShowAddressModal }}>
      {children}

      {/* MODAL DE CPF */}
      {showCPFModal && (
        <div className="fixed inset-0 bg-black/90 z- flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 text-center">
            <h2 className="font-black uppercase italic text-xl">Segurança Mogu</h2>
            <p className="text-[10px] font-bold text-gray-500 my-4">PRECISAMOS DO SEU CPF PARA O MERCADO PAGO.</p>
            <input 
              type="text" value={cpfValue} onChange={handleCpfChange} placeholder="000.000.000-00"
              className="w-full bg-gray-100 p-4 rounded-2xl font-black text-center text-xl outline-none"
            />
            <button 
              onClick={() => {
                const limpo = cpfValue.replace(/\D/g, '');
                if(limpo.length === 11) finalizarCadastroCPF(limpo);
                else alert("CPF incompleto!");
              }}
              className="w-full mt-4 bg-black text-white p-5 rounded-[20px] font-black uppercase italic"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE ENDEREÇO - APARECE SE ESTIVER FALTANDO DADOS */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z- flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl">
            <h2 className="font-black uppercase italic text-2xl text-gray-800">Onde entregamos?</h2>
            <p className="text-gray-400 font-bold uppercase text-[10px] mb-6">Mogu Mogu Delivery - Guapiara</p>
            <div className="space-y-3">
              <input id="rua" type="text" placeholder="Rua / Logradouro" className="w-full bg-gray-100 p-4 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-red-500"/>
              <div className="flex gap-2">
                <input id="numero" type="text" placeholder="Nº" className="w-24 bg-gray-100 p-4 rounded-2xl font-bold outline-none"/>
                <input id="bairro" type="text" placeholder="Bairro" className="flex-1 bg-gray-100 p-4 rounded-2xl font-bold outline-none"/>
              </div>
              <input id="ref" type="text" placeholder="Ponto de Referência" className="w-full bg-gray-100 p-4 rounded-2xl font-bold outline-none"/>
            </div>
            <button 
              onClick={() => {
                const rua = document.getElementById("rua").value;
                const num = document.getElementById("numero").value;
                const bairro = document.getElementById("bairro").value;
                const ref = document.getElementById("ref").value;
                if(!rua || !num || !bairro) return alert("Preencha os campos obrigatórios!");
                salvarEndereco({ rua, numero: num, bairro, referencia: ref });
              }}
              className="w-full mt-6 bg-red-600 text-white p-5 rounded-[25px] font-black uppercase italic active:scale-95"
            >
              Começar a Pedir
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};