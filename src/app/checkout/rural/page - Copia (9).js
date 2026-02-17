"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../lib/firebase";
import { 
  collection, addDoc, getDocs, doc, 
  updateDoc, getDoc, query, where 
} from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";

export default function CheckoutPage() {
  // ==========================================
  // 🟢 TÓPICO 1: ESTADOS E SINCRONIZAÇÃO INICIAL
  // ==========================================
  const { user } = useAuth();
  const router = useRouter();

  const [cart, setCart] = useState([]);
  const [bairrosDisponiveis, setBairrosDisponiveis] = useState([]);
  const [bairroSelecionado, setBairroSelecionado] = useState(null);
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("Pix");
  const [taxaCalculada, setTaxaCalculada] = useState(null);
  const [calculando, setCalculando] = useState(false);
  const [erroLogistica, setErroLogistica] = useState(null);
  const [loading, setLoading] = useState(true);

  const subtotal = cart.reduce((acc, i) => acc + (Number(i.price) || 0), 0);

  useEffect(() => {
    const carregarDados = async () => {
      const savedCart = localStorage.getItem("carrinho");
      if (savedCart) setCart(JSON.parse(savedCart));
      else router.push("/");

      try {
        // Busca bairros com seus níveis (Asfalto, Desbravador, Off-Road)
        const bSnap = await getDocs(collection(db, "neighborhoods"));
        const lista = bSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setBairrosDisponiveis(lista);

        if (user) {
          const userSnap = await getDoc(doc(db, "users", user.uid));
          if (userSnap.exists() && userSnap.data().endereco) {
            const end = userSnap.data().endereco;
            setRua(end.rua || ""); 
            setNumero(end.numero || "");
            const bSalvo = lista.find(b => b.id === end.bairroId);
            if (bSalvo) setBairroSelecionado(bSalvo);
          }
        }
      } catch (e) { console.error("Erro ao carregar:", e); }
      finally { setLoading(false); }
    };
    carregarDados();
  }, [user, router]);

  // ==========================================
  // 🚀 TÓPICO 2: MOTOR DE LOGÍSTICA (RATEIO RURAL)
  // ==========================================
  const handleAnalisarLogistica = async () => {
    if (!bairroSelecionado) return;
    setCalculando(true);
    setErroLogistica(null);

    try {
      // Regra 1: Se for área urbana (sem linhaId), taxa fixa do bairro
      if (!bairroSelecionado.linhaId) {
        setTaxaCalculada(Number(bairroSelecionado.fee) || 7);
      } else {
        // Regra 2: Busca pedidos "Aguardando Entregador" na mesma linha para rateio
        const qPedidos = query(
          collection(db, "orders"),
          where("endereco.linhaId", "==", String(bairroSelecionado.linhaId)),
          where("status", "==", "Aguardando Entregador")
        );
        
        const snapPedidos = await getDocs(qPedidos);
        const volumeTotal = snapPedidos.size + 1; // Outros pedidos + o atual

        // Regra 3: Custo de Linha (40) dividido pelo grupo + taxa fixa do bairro (3)
        const vL = 40; 
        const tB = 3;
        setTaxaCalculada((vL / volumeTotal) + tB);
      }
    } catch (error) {
      setErroLogistica("Erro ao calcular logística rural.");
    } finally {
      setCalculando(false);
    }
  };

  // ==========================================
  // 📦 TÓPICO 3: PERSISTÊNCIA E CRIAÇÃO DO PEDIDO
  // ==========================================
  const realizarPedidoFinal = async () => {
    if (!taxaCalculada || !rua || !numero) return;

    try {
      setLoading(true);
      const pedidoDoc = {
        clienteId: user?.uid || "anonimo",
        clienteNome: user?.displayName || "Cliente Local",
        itens: cart,
        valores: { subtotal, taxaEntrega: taxaCalculada, total: subtotal + taxaCalculada },
        formaPagamento,
        rankEntrega: bairroSelecionado.level, // Crucial para o radar do entregador
        endereco: {
          bairro: bairroSelecionado.name,
          bairroId: bairroSelecionado.id,
          linhaId: bairroSelecionado.linhaId || null,
          rua, numero
        },
        status: "Aguardando Entregador",
        criadoEm: new Date().toISOString()
      };

      // Salva na coleção 'orders'
      await addDoc(collection(db, "orders"), pedidoDoc);

      // Salva o endereço no perfil do usuário de forma silenciosa
      if (user) {
        await updateDoc(doc(db, "users", user.uid), {
          endereco: { bairroId: bairroSelecionado.id, rua, numero }
        });
      }

      localStorage.removeItem("carrinho");
      alert("✅ Pedido enviado para a Central!");
      router.push("/"); 
    } catch (e) {
      alert("Erro ao confirmar: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 🎨 TÓPICO 4: INTERFACE (UI)
  // ==========================================
  if (loading) return <div className="p-20 text-center font-black animate-pulse uppercase">Conectando...</div>;

  return (
    <main className="min-h-screen bg-gray-50 pb-20 max-w-md mx-auto text-gray-900 font-sans">
      <header className="bg-white p-6 rounded-b-[45px] shadow-sm mb-6 border-b border-gray-100 text-center">
        <h1 className="text-2xl font-black uppercase italic tracking-tighter">Finalizar Compra</h1>
      </header>

      <div className="px-4 space-y-4">
        {/* CAMPOS DE ENDEREÇO */}
        <div className="bg-white p-6 rounded-[35px] shadow-sm space-y-4 border border-gray-100">
          <select 
            className="w-full bg-gray-50 p-4 rounded-2xl font-bold text-sm outline-none border border-gray-100" 
            value={bairroSelecionado?.id || ""} 
            onChange={(e) => { 
              setBairroSelecionado(bairrosDisponiveis.find(b => b.id === e.target.value)); 
              setTaxaCalculada(null); 
            }}
          >
            <option value="">Selecione o Bairro...</option>
            {bairrosDisponiveis.map(b => (
              <option key={b.id} value={b.id}>{b.name} ({b.level})</option>
            ))}
          </select>

          <div className="flex gap-2">
            <input placeholder="Rua / Acesso" className="flex-1 bg-gray-50 p-4 rounded-2xl font-bold text-sm outline-none" value={rua} onChange={e => setRua(e.target.value)} />
            <input placeholder="Nº" className="w-20 bg-gray-50 p-4 rounded-2xl font-bold text-sm text-center outline-none" value={numero} onChange={e => setNumero(e.target.value)} />
          </div>
        </div>

        {/* MOTOR DE CÁLCULO VISUAL */}
        <div className="bg-white p-6 rounded-[35px] shadow-sm border border-gray-100 text-center">
           {taxaCalculada !== null ? (
             <div className="flex justify-between items-center px-2">
                <span className="text-[10px] font-black uppercase text-green-600 italic">Frete Inteligente OK</span>
                <span className="font-black text-xl text-blue-600">R$ {taxaCalculada.toFixed(2)}</span>
             </div>
           ) : (
             <button onClick={handleAnalisarLogistica} disabled={!bairroSelecionado || calculando} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black uppercase italic text-[11px] shadow-lg active:scale-95 transition">
               {calculando ? "Analisando Linhas..." : "🔍 Calcular Frete Rural"}
             </button>
           )}
        </div>

        {/* RESUMO FINANCEIRO */}
        <div className="bg-gray-900 text-white p-8 rounded-[45px] shadow-2xl">
           <div className="flex justify-between items-center text-3xl font-black italic uppercase tracking-tighter mb-6">
              <span>Total</span>
              <span>R$ {(subtotal + (taxaCalculada || 0)).toFixed(2)}</span>
           </div>
           
           <button onClick={realizarPedidoFinal} disabled={taxaCalculada === null || !rua} className="w-full bg-red-600 text-white py-5 rounded-3xl font-black uppercase italic text-sm shadow-xl active:scale-95 transition disabled:opacity-20">
              Confirmar Pedido ➔
           </button>
        </div>
      </div>
    </main>
  );
}