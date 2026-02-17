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
  const [mostrarPopUp, setMostrarPopUp] = useState(false);

  const subtotal = cart.reduce((acc, i) => acc + i.price, 0);

  useEffect(() => {
    const savedCart = localStorage.getItem("carrinho");
    if (savedCart) setCart(JSON.parse(savedCart));
    else router.push("/");

    const fetchData = async () => {
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
        setLoading(false);
      } catch (e) { setLoading(false); }
    };
    fetchData();
  }, [user, router]);

  // 🔥 MOTOR DE LOGÍSTICA COMPLEXO (Calcula sem revelar o esquema)
  const handleValidarEGerarPreco = async () => {
    if (!bairroSelecionado) return;
    setCalculando(true);
    setErroLogistica(null);

    try {
      // 1. BUSCA DE ENTREGADORES POR RANK E LINHA
      const qEntregadores = query(
        collection(db, "users"),
        where("nivelAtuacao", "==", "entregador"),
        where("trabalhandoHoje", "==", true),
        where("rank", "==", bairroSelecionado.level) // Rank do bairro (ex: Desbravador)
      );

      const entregadoresSnap = await getDocs(qEntregadores);
      
      // Filtra se o entregador sabe fazer aquela linha específica
      const disponivel = entregadoresSnap.docs.some(d => {
        const dados = d.data();
        return !bairroSelecionado.linhaId || dados.linhasConhecidas?.includes(bairroSelecionado.linhaId);
      });

      if (!disponivel) {
        setErroLogistica("Ops! Nenhum entregador com Rank disponível para esta rota no momento.");
        setCalculando(false);
        return;
      }

      // 2. CÁLCULO DE PREÇO (RATEIO SEGREDO)
      if (!bairroSelecionado.linhaId) {
        setTaxaCalculada(bairroSelecionado.fee || 0);
      } else {
        const qPedidos = query(
          collection(db, "orders"),
          where("endereco.linhaId", "==", bairroSelecionado.linhaId),
          where("status", "in", ["Aguardando Entregador", "Em Produção"])
        );
        const snapPedidos = await getDocs(qPedidos);
        const volume = snapPedidos.size + 1;

        // Lógica de Equilíbrio
        const vL = 40; // Viagem base
        const tB = 3;  // Adicional bairro
        setTaxaCalculada((vL / volume) + tB);
      }
    } catch (error) {
      setErroLogistica("Erro na central de logística. Tente novamente.");
    } finally {
      setCalculando(false);
    }
  };

  // 3. CRIAÇÃO DO PEDIDO NO BANCO DE DADOS
  const realizarPedidoFinal = async () => {
    try {
      const pedidoDoc = {
        clienteId: user.uid,
        clienteNome: user.displayName,
        itens: cart,
        subtotal,
        taxaEntrega: taxaCalculada,
        total: subtotal + taxaCalculada,
        formaPagamento,
        rankEntrega: bairroSelecionado.level, // Salva o Rank para o entregador ver
        endereco: {
          bairro: bairroSelecionado.name,
          bairroId: bairroSelecionado.id,
          linhaId: bairroSelecionado.linhaId || null,
          rua, numero
        },
        status: "Aguardando Entregador",
        criadoEm: new Date().toISOString()
      };

      await addDoc(collection(db, "orders"), pedidoDoc);
      setMostrarPopUp(true);
    } catch (e) { alert("Erro ao processar compra."); }
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse uppercase">Conectando Central...</div>;

  return (
    <main className="min-h-screen bg-gray-50 pb-20 font-sans max-w-md mx-auto text-gray-900">
      
      {/* POP-UP SALVAMENTO ENDEREÇO */}
      {mostrarPopUp && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] p-8 w-full text-center shadow-2xl">
            <h3 className="text-xl font-black uppercase italic leading-tight">Deseja salvar este endereço?</h3>
            <div className="grid grid-cols-2 gap-3 mt-8">
              <button onClick={() => { localStorage.removeItem("carrinho"); router.push("/pedidos"); }} className="py-4 rounded-2xl font-black uppercase text-[10px] bg-gray-100 text-gray-400">Agora não</button>
              <button onClick={async () => {
                await updateDoc(doc(db, "users", user.uid), {
                  endereco: { bairroId: bairroSelecionado.id, rua, numero, atualizadoEm: new Date().toISOString() }
                });
                localStorage.removeItem("carrinho");
                router.push("/pedidos");
              }} className="py-4 rounded-2xl font-black uppercase text-[10px] bg-green-600 text-white">Sim, Salvar</button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white p-6 rounded-b-[45px] shadow-sm mb-6">
        <h1 className="text-2xl font-black uppercase italic tracking-tighter">Finalizar Pedido</h1>
      </header>

      <div className="px-4 space-y-4">
        {/* SELEÇÃO DE BAIRRO */}
        <div className="bg-white p-6 rounded-[35px] shadow-sm">
          <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block italic">Selecione o Bairro</label>
          <select 
            className="w-full bg-gray-50 p-4 rounded-2xl font-bold text-sm outline-none border border-gray-100"
            value={bairroSelecionado?.id || ""}
            onChange={(e) => { setBairroSelecionado(bairrosDisponiveis.find(b => b.id === e.target.value)); setTaxaCalculada(null); }}
          >
            <option value="">Onde você está?</option>
            {bairrosDisponiveis.map(b => (
              <option key={b.id} value={b.id}>{b.name} ({b.level})</option>
            ))}
          </select>
        </div>

        <div className="bg-white p-6 rounded-[35px] shadow-sm flex gap-2">
          <input placeholder="Rua / Estrada" className="flex-1 bg-gray-50 p-4 rounded-2xl font-bold text-sm outline-none" value={rua} onChange={e => setRua(e.target.value)} />
          <input placeholder="Nº" className="w-20 bg-gray-50 p-4 rounded-2xl font-bold text-sm text-center outline-none" value={numero} onChange={e => setNumero(e.target.value)} />
        </div>

        <div className="bg-white p-6 rounded-[35px] shadow-sm">
          <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block italic">Pagamento</label>
          <select className="w-full bg-gray-50 p-4 rounded-2xl font-bold text-sm outline-none border border-gray-100" value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}>
            <option value="Pix">Pix</option>
            <option value="Cartão">Cartão na Entrega</option>
            <option value="Dinheiro">Dinheiro</option>
          </select>
        </div>

        {/* ÁREA DE CENTRAL DE LOGÍSTICA */}
        <div className="bg-white p-6 rounded-[35px] shadow-sm border border-gray-100">
           {erroLogistica && <p className="text-[9px] font-black text-red-600 uppercase mb-4 italic animate-bounce">{erroLogistica}</p>}
           
           {taxaCalculada !== null ? (
             <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-green-600 italic">Central: Rota Confirmada</span>
                <span className="font-black text-xl text-gray-900">R$ {taxaCalculada.toFixed(2)}</span>
             </div>
           ) : (
             <button 
               onClick={handleValidarEGerarPreco}
               disabled={!bairroSelecionado || calculando}
               className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black uppercase italic text-[11px] shadow-lg shadow-blue-100 active:scale-95 transition"
             >
               {calculando ? "Buscando Entregadores..." : "🔍 Analisar Disponibilidade"}
             </button>
           )}
        </div>

        <div className="bg-gray-900 text-white p-8 rounded-[45px] shadow-2xl">
           <div className="flex justify-between items-center text-3xl font-black italic uppercase tracking-tighter">
              <span>Total</span>
              <span>R$ {(subtotal + (taxaCalculada || 0)).toFixed(2)}</span>
           </div>
           
           <button 
              onClick={realizarPedidoFinal}
              disabled={taxaCalculada === null || !rua}
              className="w-full bg-red-600 text-white mt-6 py-5 rounded-3xl font-black uppercase italic text-sm shadow-xl active:scale-95 transition disabled:opacity-10"
           >
              Confirmar Pedido ➔
           </button>
        </div>
      </div>
    </main>
  );
}