"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../lib/firebase";
import { 
  collection, addDoc, getDocs, doc, 
  updateDoc, getDoc 
} from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";

export default function CheckoutPage() {
  const { user } = useAuth();
  const router = useRouter();

  // ESTADOS PRINCIPAIS
  const [cart, setCart] = useState([]);
  const [bairrosDisponiveis, setBairrosDisponiveis] = useState([]);
  const [bairroSelecionado, setBairroSelecionado] = useState(null);
  const [nomeCliente, setNomeCliente] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [pagamento, setPagamento] = useState("Pix");
  const [loading, setLoading] = useState(true);

  // 1. BUSCA OS BAIRROS JÁ CONFIGURADOS NO FIREBASE
  useEffect(() => {
    const savedCart = localStorage.getItem("carrinho");
    if (savedCart) setCart(JSON.parse(savedCart));
    else router.push("/");

    if (user?.displayName) setNomeCliente(user.displayName);

    const fetchData = async () => {
      try {
        const bSnap = await getDocs(collection(db, "neighborhoods"));
        const bList = bSnap.docs.map(d => ({ 
          id: d.id, 
          nome: d.data().name, 
          taxa: d.data().fee,
          level: d.data().level || "Asfalto Zero",
          linha: d.data().linha || 0
        })).sort((a,b) => a.nome.localeCompare(b.nome));
        
        setBairrosDisponiveis(bList);
        if (bList.length > 0) setBairroSelecionado(bList[0]);
      } catch (e) {
        console.error("Erro ao carregar bairros:", e);
      }
      setLoading(false);
    };
    fetchData();
  }, [user, router]);

  // 2. CÁLCULOS DE VALORES
  const subtotal = cart.reduce((acc, i) => acc + Number(i.price), 0);
  const taxaEntrega = bairroSelecionado ? Number(bairroSelecionado.taxa) : 0;
  const totalGeral = subtotal + taxaEntrega;

  // 3. ENVIO DO PEDIDO COM LÓGICA DE STATUS RURAL
  const finalizarCompra = async () => {
    if (!nomeCliente || !rua || !numero) return alert("Preencha o endereço completo!");

    try {
      setLoading(true);

      // REGRA DE OURO: Se for Off-Road, fica em "Reserva" (Aguardando Entregador)
      // Caso contrário, vai direto para "Em Produção" (Cozinha)
      const statusInicial = bairroSelecionado?.level === "Off-Road Root" 
        ? "Aguardando Entregador" 
        : "Em Produção";

      await addDoc(collection(db, "orders"), {
        cliente: { nome: nomeCliente, uid: user?.uid || "anonimo" },
        endereco: { 
          bairro: bairroSelecionado?.nome, 
          rua, 
          numero,
          nivelTerreno: bairroSelecionado?.level,
          linhaId: bairroSelecionado?.linha 
        },
        itens: cart,
        valores: { subtotal, taxaEntrega, total: totalGeral },
        status: statusInicial, // Define se a cozinha recebe agora ou depois
        data: new Date(),
        motoboyAtual: null
      });

      alert(statusInicial === "Aguardando Entregador" 
        ? "🚀 Reserva Rural enviada! Aguardando um entregador aceitar para iniciar a produção."
        : "🚀 Pedido enviado para a cozinha!");

      localStorage.removeItem("carrinho");
      router.push("/");
    } catch (e) {
      alert("Erro ao enviar: " + e.message);
      setLoading(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse">PROCESSANDO...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-32 max-w-md mx-auto font-sans border-x border-gray-100">
      <header className="mb-6 flex items-center gap-2">
        <button onClick={() => router.back()} className="text-gray-400 text-xl font-black">←</button>
        <h1 className="text-xl font-black italic uppercase tracking-tighter">Finalizar Pedido</h1>
      </header>

      <div className="space-y-4">
        {/* SELETOR DE BAIRRO (MOSTRA NÍVEL DO BANCO) */}
        <div className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-100">
          <p className="text-[10px] font-black text-gray-400 uppercase mb-2 italic">Local de Entrega</p>
          <select 
            className="w-full bg-gray-50 p-4 rounded-2xl outline-none font-black text-sm uppercase italic"
            onChange={(e) => setBairroSelecionado(bairrosDisponiveis.find(b => b.nome === e.target.value))}
            value={bairroSelecionado?.nome || ""}
          >
            {bairrosDisponiveis.map(b => (
              <option key={b.id} value={b.nome}>
                📍 {b.nome} ({b.level})
              </option>
            ))}
          </select>
        </div>

        {/* DADOS DO CLIENTE */}
        <div className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-100 space-y-3">
          <input 
            placeholder="Seu Nome" 
            className="w-full bg-gray-50 p-4 rounded-2xl outline-none font-bold text-sm" 
            value={nomeCliente} 
            onChange={e => setNomeCliente(e.target.value)} 
          />
          <div className="flex gap-2">
            <input placeholder="Rua" className="flex-1 bg-gray-50 p-4 rounded-2xl outline-none font-bold text-sm" value={rua} onChange={e => setRua(e.target.value)} />
            <input placeholder="Nº" className="w-20 bg-gray-50 p-4 rounded-2xl outline-none font-bold text-sm text-center" value={numero} onChange={e => setNumero(e.target.value)} />
          </div>
        </div>

        {/* RESUMO DE VALORES */}
        <div className="bg-white p-6 rounded-[35px] shadow-sm border border-gray-100">
          <div className="flex justify-between text-[10px] font-black uppercase mb-4">
             <span className="text-gray-400">Pagamento:</span>
             <span className="text-blue-600">{pagamento}</span>
          </div>
          <div className="pt-4 border-t border-dashed border-gray-200">
             <div className="flex justify-between items-center text-gray-900 font-black text-2xl italic uppercase tracking-tighter">
                <span>Total</span>
                <span>R$ {totalGeral.toFixed(2)}</span>
             </div>
             <p className="text-[8px] font-bold text-gray-400 mt-1 uppercase italic">Taxa de Entrega: R$ {taxaEntrega.toFixed(2)}</p>
          </div>
        </div>

        <button 
          onClick={finalizarCompra} 
          className="w-full bg-red-600 text-white py-6 rounded-[30px] font-black text-xl shadow-xl active:scale-95 uppercase italic tracking-widest"
        >
          Confirmar Compra 🚀
        </button>
      </div>
    </div>
  );
}