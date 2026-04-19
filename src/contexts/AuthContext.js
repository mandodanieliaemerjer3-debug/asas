"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  GoogleAuthProvider 
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from "firebase/firestore";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCPFModal, setShowCPFModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  const [cpfValue, setCpfValue] = useState("");
  const [listaBairros, setListaBairros] = useState([]);

  // 1. Monitoramento do Estado do Usuário
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authState) => {
      if (authState) {
        const userRef = doc(db, "users", authState.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const dados = userSnap.data();
          setUser({ uid: authState.uid, ...dados });
          
          // Verifica se o endereço está completo (Rua e ID do Bairro)
          if (!dados.endereco?.rua || !dados.endereco?.bairroId) {
            setShowAddressModal(true);
          }
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

  // 2. Busca os bairros na coleção "bairros" (Plural conforme sua imagem)
  useEffect(() => {
    if (showAddressModal) {
      const fetchBairros = async () => {
        try {
          const querySnapshot = await getDocs(collection(db, "bairros"));
          const bairrosData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            nome: doc.data().nome 
          }));
          setListaBairros(bairrosData);
        } catch (error) {
          console.error("Erro ao buscar bairros:", error);
        }
      };
      fetchBairros();
    }
  }, [showAddressModal]);

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
    } catch (error) {
      alert("Erro ao salvar CPF.");
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

      {/* MODAL CPF */}
      {showCPFModal && (
        <div className="fixed inset-0 bg-black/90 z- flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 text-center">
            <h2 className="font-black uppercase italic text-xl text-gray-800">Segurança Mogu</h2>
            <input 
              type="text" value={cpfValue} onChange={handleCpfChange} placeholder="000.000.000-00"
              className="w-full bg-gray-100 p-4 rounded-2xl font-black text-center text-xl outline-none mt-4 border-2 border-transparent focus:border-yellow-400"
            />
            <button 
              onClick={() => {
                const limpo = cpfValue.replace(/\D/g, '');
                if(limpo.length === 11) finalizarCadastroCPF(limpo);
                else alert("CPF incompleto!");
              }}
              className="w-full mt-4 bg-black text-white p-5 rounded-[20px] font-black uppercase italic active:scale-95 transition-all"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}

      {/* MODAL ENDEREÇO - GAVETA CENTRALIZADA FIXA */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z- flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[35px] p-6 shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="text-center mb-4">
              <h2 className="font-black uppercase italic text-2xl text-gray-800 leading-tight">Onde entregamos?</h2>
              <p className="text-gray-400 font-bold uppercase text-[10px]">Guapiara - SP</p>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4 custom-scrollbar">
              <div className="space-y-1">
                <label className="text-[10px] font-black ml-4 text-gray-400 uppercase">Rua e Número</label>
                <div className="flex gap-2">
                  <input id="rua" type="text" placeholder="Rua" className="flex-1 bg-gray-100 p-4 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-red-500"/>
                  <input id="numero" type="text" placeholder="Nº" className="w-20 bg-gray-100 p-4 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-red-500"/>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black ml-4 text-gray-400 uppercase">Selecione o Bairro</label>
                <div className="relative">
                  <select id="bairroId" className="w-full bg-gray-100 p-4 rounded-2xl font-bold outline-none appearance-none border-2 border-transparent focus:border-red-500">
                    <option value="">Escolha seu bairro...</option>
                    {listaBairros.map((b) => (
                      <option key={b.id} value={b.id}>{b.nome}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black ml-4 text-gray-400 uppercase">Ponto de Referência</label>
                <input id="ref" type="text" placeholder="Ex: Perto da escola" className="w-full bg-gray-100 p-4 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-red-500"/>
              </div>
            </div>

            {/* BOTÃO FIXO NO RODAPÉ DO MODAL */}
            <button 
              onClick={async () => {
                const rua = document.getElementById("rua").value;
                const num = document.getElementById("numero").value;
                const bairroId = document.getElementById("bairroId").value;
                const ref = document.getElementById("ref").value;
                const bairroSel = listaBairros.find(b => b.id === bairroId);

                if(!rua || !num || !bairroId) return alert("Preencha rua, número e bairro!");

                const endCompleto = { 
                  rua, numero: num, bairroId, 
                  bairroNome: bairroSel.nome, 
                  referencia: ref, 
                  cidade: "Guapiara" 
                };
                
                await updateDoc(doc(db, "users", user.uid), { endereco: endCompleto });
                setUser({...user, endereco: endCompleto});
                setShowAddressModal(false);
              }}
              className="w-full bg-red-600 text-white p-5 rounded-[25px] font-black uppercase italic shadow-lg active:scale-95 transition-all shrink-0"
            >
              Confirmar e Entrar
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};