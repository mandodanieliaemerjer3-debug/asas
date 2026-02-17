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
  const { user } = useAuth();
  const router = useRouter();

  // ESTADOS
  const [cart, setCart] = useState([]);
  const [bairrosDisponiveis, setBairrosDisponiveis] = useState([]);
  const [bairroSelecionado, setBairroSelecionado] = useState(null);
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("Pix");
  const [taxaCalculada, setTaxaCalculada] = useState(null);
  const [calculando, setCalculando] = useState(false);
  const [loading, setLoading] = useState(true);

  const subtotal = cart.reduce((acc, i) => acc + (Number(i.price) || 0), 0);

  // 🟢 1. CARREGAMENTO INICIAL
  useEffect(() => {
    const carregarDados = async () => {
      const savedCart = localStorage.getItem("carrinho");
      if (savedCart) setCart(JSON.parse(savedCart));
      else router.push("/");

      try {
        const bSnap = await getDocs(collection(db, "neighborhoods"));
        const lista = bSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setBairrosDisponiveis(lista);

        if (user) {
          const userSnap = await getDoc(doc(db, "users", user.uid));
          if (userSnap.exists() && userSnap.data().endereco) {
            const end = userSnap.data().endereco;
            setRua(end.rua || ""); setNumero(end.numero || "");
            const bSalvo = lista.find(b => b.id === end.bairroId);
            if (bSalvo) setBairroSelecionado(bSalvo);
          }
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    carregarDados();
  }, [user, router]);

  // 🚀 2. MOTOR DE LOGÍSTICA (COM DIVISÃO DE LINHA DO DIA)
  const handleCalcularFrete = async () => {
    if (!bairroSelecionado) return;
    setCalculando(true);

    try {
      // REGRA URBANA
      if (!bairroSelecionado.linhaId && !bairroSelecionado.linhald) {
        setTaxaCalculada(Number(bairroSelecionado.fee) || 7);
      } else {
        // REGRA RURAL: Busca pedidos ativos na mesma linha hoje
        const idLinha = String(bairroSelecionado.linhaId || bairroSelecionado.linhald);
        
        const qLinha = query(
          collection(db, "orders"),
          where("endereco.linhaId", "==", idLinha),
          where("status", "in", ["Aguardando Entregador", "Aguardando Restaurante"])
        );
        
        const snap = await getDocs(qLinha);
        const pedidosAtivos = snap.size + 1; // Vizinhos + este atual

        // Cálculo: (Custo de deslocamento fixo R$ 40 / total de pessoas) + Taxa do Bairro R$ 3
        const custoLinhaFracionado = 40 / pedidosAtivos;
        const freteFinal = custoLinhaFracionado + 3;
        
        setTaxaCalculada(freteFinal);
      }
    } catch (e) {
      alert("Erro ao calcular frete rural.");
    } finally {
      setCalculando(false);
    }
  };

  // 📦 3. FINALIZAÇÃO DO PEDIDO
  const realizarPedidoFinal = async () => {
    if (!taxaCalculada || !rua) return;

    try {
      setLoading(true);
      const novoPedido = {
        clienteId: user?.uid || "anonimo",
        clienteNome: user?.displayName || "Cliente Guapiara",
        itens: cart,
        valores: {
          subtotal,
          taxaEntrega: taxaCalculada,
          total: subtotal + taxaCalculada
        },
        formaPagamento,
        rankEntrega: bairroSelecionado.level, // Identifica se é OFF-ROAD ROOT
        endereco: {
          bairro: bairroSelecionado.name,
          bairroId: bairroSelecionado.id,
          linhaId: String(bairroSelecionado.linhaId || bairroSelecionado.linhald || ""),
          rua,
          numero
        },
        status: "Aguardando Entregador", // Status inicial
        repasseConfirmado: false, // 🔍 NOVO: Controle financeiro para o seu Dashboard
        criadoEm: new Date().toISOString()
      };

      await addDoc(collection(db, "orders"), novoPedido);

      if (user) {
        await updateDoc(doc(db, "users", user.uid), {
          endereco: { bairroId: bairroSelecionado.id, rua, numero }
        });
      }

      localStorage.removeItem("carrinho");
      alert("✅ Pedido enviado! Aguarde a confirmação do operador.");
      router.push("/");
    } catch (e) {
      alert("Erro ao salvar pedido.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse">Sincronizando...</div>;

  return (
    <main className="min-h-screen bg-gray-50 pb-10 max-w-md mx-auto text-gray-900 font-sans">
      <header className="bg-white p-6 rounded-b-[45px] shadow-sm mb-6 border-b border-gray-100 text-center text-black">
        <h1 className="text-2xl font-black uppercase italic tracking-tighter">Finalizar Pedido</h1>
      </header>

      <div className="px-4 space-y-4">
        {/* LOCALIZAÇÃO */}
        <div className="bg-white p-6 rounded-[35px] shadow-sm space-y-4 border border-gray-100">
          <select 
            className="w-full bg-gray-50 p-4 rounded-2xl font-bold text-sm outline-none border border-gray-100 text-black"
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
            <input placeholder="Sua Rua" className="flex-1 bg-gray-50 p-4 rounded-2xl font-bold text-sm outline-none text-black" value={rua} onChange={e => setRua(e.target.value)} />
            <input placeholder="Nº" className="w-20 bg-gray-50 p-4 rounded-2xl font-bold text-sm text-center outline-none text-black" value={numero} onChange={e => setNumero(e.target.value)} />
          </div>
        </div>

        {/* MOTOR DE CÁLCULO */}
        <div className="bg-white p-6 rounded-[35px] shadow-sm border border-gray-100">
          {taxaCalculada !== null ? (
            <div className="flex justify-between items-center px-2">
              <span className="text-[10px] font-black uppercase text-green-600 italic">Frete Inteligente Ativo</span>
              <span className="font-black text-xl text-blue-600 font-mono">R$ {taxaCalculada.toFixed(2)}</span>
            </div>
          ) : (
            <button 
              onClick={handleCalcularFrete}
              disabled={!bairroSelecionado || calculando}
              className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black uppercase italic text-xs shadow-lg active:scale-95 transition"
            >
              {calculando ? "Sincronizando Linhas..." : "🔍 Calcular Frete Rural"}
            </button>
          )}
        </div>

        {/* TOTAL E FINALIZAR */}
        <div className="bg-zinc-900 text-white p-8 rounded-[45px] shadow-2xl">
          <div className="flex justify-between items-center text-3xl font-black italic uppercase mb-6">
            <span>Total</span>
            <span>R$ {(subtotal + (taxaCalculada || 0)).toFixed(2)}</span>
          </div>
          <button 
            onClick={realizarPedidoFinal}
            disabled={taxaCalculada === null || !rua}
            className="w-full bg-red-600 text-white py-5 rounded-3xl font-black uppercase italic text-sm shadow-xl active:scale-95 transition disabled:opacity-20"
          >
            Confirmar e Enviar ➔
          </button>
        </div>
      </div>
    </main>
  );
}