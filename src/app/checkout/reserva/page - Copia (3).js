"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../lib/firebase";
import { 
  collection, addDoc, getDocs, doc, 
  updateDoc, getDoc, query, where, setDoc 
} from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";

export default function CheckoutPage() {
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
  const [loading, setLoading] = useState(true);

  const subtotal = cart.reduce((acc, i) => acc + (Number(i.price) || 0), 0);

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

  // 🚀 MOTOR DE LOGÍSTICA CORRIGIDO (BUSCA O CONTADOR OFICIAL)
  const handleCalcularFrete = async () => {
    if (!bairroSelecionado) return;
    setCalculando(true);

    try {
      const idLinha = String(bairroSelecionado.linhaId || bairroSelecionado.linhald || "");
      
      if (!idLinha) {
        setTaxaCalculada(Number(bairroSelecionado.fee) || 7);
      } else {
        const hoje = new Date().toISOString().split('T')[0];
        const linhaDocId = `${hoje}_linha_${idLinha}`;
        const linhaRef = doc(db, "linhas_do_dia", linhaDocId);
        const linhaSnap = await getDoc(linhaRef);

        // Se a linha já existe hoje, pega o próximo número da fila
        let totalPedidosNaFila = 1;
        if (linhaSnap.exists()) {
          totalPedidosNaFila = linhaSnap.data().pedidosAtivos + 1;
        }

        const custoLinhaBase = 40;
        const taxaBairroBase = 3;
        const freteRateado = (custoLinhaBase / totalPedidosNaFila) + taxaBairroBase;
        
        setTaxaCalculada(freteRateado);
      }
    } catch (e) {
      alert("Erro ao calcular frete.");
    } finally {
      setCalculando(false);
    }
  };

  // 📦 FINALIZAÇÃO COM REGISTRO DE FILA
  const realizarPedidoFinal = async () => {
    if (!taxaCalculada || !rua) return;

    try {
      setLoading(true);
      const idLinha = String(bairroSelecionado.linhaId || bairroSelecionado.linhald || "");
      const hoje = new Date().toISOString().split('T')[0];
      
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
        rankEntrega: bairroSelecionado.level || "Comum",
        endereco: {
          bairro: bairroSelecionado.name,
          bairroId: bairroSelecionado.id,
          linhaId: idLinha,
          rua,
          numero
        },
        status: "Aguardando Entregador",
        repasseConfirmado: false,
        criadoEm: new Date().toISOString()
      };

      // 1. Salva o pedido
      await addDoc(collection(db, "orders"), novoPedido);

      // 2. Atualiza o contador oficial da linha para o próximo cliente
      if (idLinha) {
        const linhaDocId = `${hoje}_linha_${idLinha}`;
        const linhaRef = doc(db, "linhas_do_dia", linhaDocId);
        const linhaSnap = await getDoc(linhaRef);

        if (linhaSnap.exists()) {
          await updateDoc(linhaRef, { 
            pedidosAtivos: linhaSnap.data().pedidosAtivos + 1 
          });
        } else {
          await setDoc(linhaRef, {
            data: hoje,
            linhaId: idLinha,
            pedidosAtivos: 1
          });
        }
      }

      if (user) {
        await updateDoc(doc(db, "users", user.uid), {
          endereco: { bairroId: bairroSelecionado.id, rua, numero }
        });
      }

      localStorage.removeItem("carrinho");
      alert("✅ Pedido confirmado com frete inteligente!");
      router.push("/");
    } catch (e) {
      alert("Erro ao finalizar.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse">Processando...</div>;

  return (
    <main className="min-h-screen bg-gray-50 pb-10 max-w-md mx-auto text-black font-sans">
      <header className="bg-white p-6 rounded-b-[45px] shadow-sm mb-6 text-center">
        <h1 className="text-2xl font-black uppercase italic tracking-tighter">Checkout Elite</h1>
      </header>

      <div className="px-4 space-y-4">
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
            <input placeholder="Sua Rua" className="flex-1 bg-gray-50 p-4 rounded-2xl font-bold text-sm outline-none" value={rua} onChange={e => setRua(e.target.value)} />
            <input placeholder="Nº" className="w-20 bg-gray-50 p-4 rounded-2xl font-bold text-sm text-center outline-none" value={numero} onChange={e => setNumero(e.target.value)} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[35px] shadow-sm border border-gray-100">
          {taxaCalculada !== null ? (
            <div className="flex justify-between items-center px-2">
              <span className="text-[10px] font-black uppercase text-green-600 italic">Frete Rateado Ativo</span>
              <span className="font-black text-xl text-blue-600 font-mono">R$ {taxaCalculada.toFixed(2)}</span>
            </div>
          ) : (
            <button 
              onClick={handleCalcularFrete}
              disabled={!bairroSelecionado || calculando}
              className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black uppercase italic text-xs shadow-lg active:scale-95 transition"
            >
              {calculando ? "Sincronizando Fila..." : "🔍 Calcular Frete Rural"}
            </button>
          )}
        </div>

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