"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../lib/firebase";
import { collection, getDocs, getDoc, doc, addDoc } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";

export default function CheckoutPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [cart, setCart] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dados de Entrega
  const [selectedBairro, setSelectedBairro] = useState(null);
  const [taxaFinal, setTaxaFinal] = useState(0);
  const [address, setAddress] = useState({ rua: "", numero: "" });

  // 1. Carregar Dados Iniciais
  useEffect(() => {
    const init = async () => {
      // Puxa carrinho local
      const savedCart = localStorage.getItem("carrinho");
      if (savedCart) setCart(JSON.parse(savedCart));

      // Busca lista de bairros para o select
      const querySnap = await getDocs(collection(db, "neighborhoods"));
      const bairrosList = querySnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setNeighborhoods(bairrosList);

      // BUSCA AUTOMÁTICA: Dados do usuário logado
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.endereco) {
            setAddress({
              rua: userData.endereco.rua || "",
              numero: userData.endereco.numero || ""
            });
            
            // Se o usuário já tem um bairro salvo, calcula a taxa na hora
            const bairroSalvo = bairrosList.find(b => b.name === userData.endereco.bairro);
            if (bairroSalvo) {
              executarCalculoLojistico(bairroSalvo);
            }
          }
        }
      }
      setLoading(false);
    };
    init();
  }, [user]);

  // 2. FUNÇÃO "CAMUFLADA" DE CÁLCULO
  const executarCalculoLojistico = async (bairro) => {
    setSelectedBairro(bairro);
    let valorBase = bairro.fee || 0;
    let adicionalOculto = 0;

    if (bairro.linhaId) {
      const refOculta = doc(db, "lines", String(bairro.linhaId));
      const snapOculto = await getDoc(refOculta);
      if (snapOculto.exists()) {
        adicionalOculto = snapOculto.data().price || 0;
      }
    }
    
    setTaxaFinal(valorBase + adicionalOculto);
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price, 0);
  const totalGeral = subtotal + taxaFinal;

  const confirmarPedido = async () => {
    if (!selectedBairro || !address.rua) return alert("Por favor, verifique o endereço.");
    
    setLoading(true);
    try {
      // CORREÇÃO AQUI: Garantir que linhaId nunca seja 'undefined'
      const linhaFinal = selectedBairro.linhaId ? String(selectedBairro.linhaId) : "0";

      const novoPedido = {
        clienteNome: user?.displayName || "Cliente Guapiara",
        clienteId: user?.uid || "anonimo",
        criadoEm: new Date().toISOString().split('T')[0],
        endereco: { 
          ...address, 
          bairro: selectedBairro.name,
          linhaId: linhaFinal // Valor higienizado para o Firebase
        },
        itens: cart,
        status: "Aguardando Pagamento",
        valores: { 
          subtotal, 
          taxaEntrega: taxaFinal, 
          total: totalGeral 
        }
      };

      const docRef = await addDoc(collection(db, "orders"), novoPedido);
      localStorage.removeItem("carrinho");
      router.push(`/pagamento/${docRef.id}`);
    } catch (e) {
      console.error("Erro ao salvar pedido:", e);
      alert("Houve um erro ao processar seu pedido. Tente novamente.");
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center font-black italic">CARREGANDO...</div>;

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto p-4 font-sans pb-32">
      <header className="mb-6 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-2xl">❮</button>
        <h1 className="font-black italic uppercase text-xl">Confirmar Entrega</h1>
      </header>

      {/* ENDEREÇO */}
      <section className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-100 space-y-4">
        <div>
          <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Bairro / Localidade</label>
          <select 
            value={selectedBairro?.id || ""}
            onChange={(e) => {
              const b = neighborhoods.find(nb => nb.id === e.target.value);
              if (b) executarCalculoLojistico(b);
            }}
            className="w-full p-3 bg-gray-50 rounded-2xl font-bold border-none"
          >
            <option value="">Selecione o local</option>
            {neighborhoods.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Rua / Logradouro</label>
            <input 
              type="text" value={address.rua}
              onChange={e => setAddress({...address, rua: e.target.value})}
              className="w-full p-3 bg-gray-50 rounded-2xl border-none text-sm font-bold"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Nº</label>
            <input 
              type="text" value={address.numero}
              onChange={e => setAddress({...address, numero: e.target.value})}
              className="w-full p-3 bg-gray-50 rounded-2xl border-none text-sm font-bold text-center"
            />
          </div>
        </div>
      </section>

      {/* RESUMO DE VALORES */}
      <section className="mt-6 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400 font-bold text-sm uppercase">Subtotal</span>
          <span className="font-bold text-gray-800">R$ {subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-400 font-bold text-sm uppercase">Taxa de Entrega</span>
          <span className="font-black text-red-600 italic">R$ {taxaFinal.toFixed(2)}</span>
        </div>
        <div className="border-t border-dashed pt-4 flex justify-between items-center">
          <span className="font-black uppercase italic text-lg">Total a Pagar</span>
          <span className="font-black text-3xl font-mono text-gray-900">R$ {totalGeral.toFixed(2)}</span>
        </div>
      </section>

      {/* BOTÃO FINAL */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md max-w-md mx-auto">
        <button 
          onClick={confirmarPedido}
          className="w-full bg-red-600 text-white py-5 rounded-[24px] font-black uppercase italic shadow-xl active:scale-95 transition"
        >
          Confirmar Pedido
        </button>
      </div>
    </div>
  );
}