"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../lib/firebase"; // Verifique se este caminho está correto
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
  const [erroLogistica, setErroLogistica] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cálculo do subtotal (Garante que é número para não quebrar a UI)
  const subtotal = cart.reduce((acc, i) => acc + (Number(i.price) || 0), 0);

  // ==========================================
  // 🟢 1. SINCRONIZAÇÃO INICIAL (Onde costuma travar)
  // ==========================================
  useEffect(() => {
    const carregarDadosIniciais = async () => {
      try {
        // Pega o carrinho
        const savedCart = localStorage.getItem("carrinho");
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        } else {
          router.push("/");
          return;
        }

        // Pega bairros do Firebase
        const bSnap = await getDocs(collection(db, "neighborhoods"));
        const lista = bSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setBairrosDisponiveis(lista);

        // Se o usuário estiver logado, tenta pegar o endereço salvo
        if (user) {
          const userSnap = await getDoc(doc(db, "users", user.uid));
          if (userSnap.exists()) {
            const dadosUser = userSnap.data();
            if (dadosUser.endereco) {
              setRua(dadosUser.endereco.rua || "");
              setNumero(dadosUser.endereco.numero || "");
              const bSalvo = lista.find(b => b.id === dadosUser.endereco.bairroId);
              if (bSalvo) setBairroSelecionado(bSalvo);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar checkout:", error);
        setErroLogistica("Erro de conexão com o banco de dados.");
      } finally {
        // ISOLADO: Garante que o loading pare independente do resultado
        setLoading(false);
      }
    };

    carregarDadosIniciais();
  }, [user, router]);

  // ==========================================
  // 🚀 2. MOTOR DE LOGÍSTICA (RATEIO RURAL)
  // ==========================================
  const handleAnalisarLogistica = async () => {
    if (!bairroSelecionado) return;
    setCalculando(true);
    setErroLogistica(null);

    try {
      // Se for entrega urbana (sem linhaId)
      if (!bairroSelecionado.linhaId) {
        setTaxaCalculada(Number(bairroSelecionado.fee) || 7);
      } else {
        // Lógica de Rateio Rural: Busca pedidos ativos na mesma linha
        const qPedidos = query(
          collection(db, "orders"),
          where("endereco.linhaId", "==", bairroSelecionado.linhaId),
          where("status", "==", "Aguardando Entregador")
        );
        
        const snapPedidos = await getDocs(qPedidos);
        const quantidadeNoCombo = snapPedidos.size + 1; // Pedidos existentes + este atual

        // Cálculo: R$ 40 da linha (dividido) + R$ 3 do bairro individual
        const precoFinal = (40 / quantidadeNoCombo) + 3;
        setTaxaCalculada(precoFinal);
      }
    } catch (error) {
      setErroLogistica("Erro ao calcular frete rural.");
    } finally {
      setCalculando(false);
    }
  };

  // ==========================================
  // 📦 3. FINALIZAÇÃO (SALVA PEDIDO E ENDEREÇO)
  // ==========================================
  const realizarPedidoFinal = async () => {
    if (!taxaCalculada || !rua || !numero) return;

    try {
      setLoading(true);

      const novoPedido = {
        clienteId: user?.uid || "anonimo",
        clienteNome: user?.displayName || "Cliente Local",
        itens: cart,
        valores: {
          subtotal,
          taxaEntrega: taxaCalculada,
          total: subtotal + taxaCalculada
        },
        formaPagamento,
        endereco: {
          bairro: bairroSelecionado.name,
          bairroId: bairroSelecionado.id,
          linhaId: bairroSelecionado.linhaId || null,
          rua,
          numero
        },
        status: "Aguardando Entregador",
        criadoEm: new Date().toISOString()
      };

      // Salva o pedido
      await addDoc(collection(db, "orders"), novoPedido);

      // Salva o endereço no perfil do usuário (Silencioso, sem Pop-up)
      if (user) {
        await updateDoc(doc(db, "users", user.uid), {
          endereco: { 
            bairroId: bairroSelecionado.id, 
            rua, 
            numero, 
            atualizadoEm: new Date().toISOString() 
          }
        });
      }

      localStorage.removeItem("carrinho");
      alert("✅ Pedido enviado para a Central!");
      router.push("/"); // Volta para o início
    } catch (error) {
      alert("Erro ao enviar pedido: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // TELA DE CARREGAMENTO
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center font-black uppercase italic animate-bounce text-blue-600">
        ⚡ Sincronizando Logística...
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50 pb-20 font-sans max-w-md mx-auto text-gray-900">
      
      <header className="bg-white p-6 rounded-b-[45px] shadow-sm mb-6 border-b border-gray-100">
        <h1 className="text-2xl font-black uppercase italic tracking-tighter text-center">Finalizar Compra</h1>
      </header>

      <div className="px-4 space-y-4">
        {/* CAMPOS DE ENDEREÇO */}
        <div className="bg-white p-6 rounded-[35px] shadow-sm space-y-4">
          <select 
            className="w-full bg-gray-50 p-4 rounded-2xl font-bold text-sm outline-none border border-gray-100" 
            value={bairroSelecionado?.id || ""} 
            onChange={(e) => { 
              setBairroSelecionado(bairrosDisponiveis.find(b => b.id === e.target.value)); 
              setTaxaCalculada(null); 
            }}
          >
            <option value="">Selecione seu Bairro...</option>
            {bairrosDisponiveis.map(b => (
              <option key={b.id} value={b.id}>{b.name} ({b.level})</option>
            ))}
          </select>

          <div className="flex gap-2">
            <input placeholder="Rua" className="flex-1 bg-gray-50 p-4 rounded-2xl font-bold text-sm outline-none" value={rua} onChange={e => setRua(e.target.value)} />
            <input placeholder="Nº" className="w-20 bg-gray-50 p-4 rounded-2xl font-bold text-sm text-center outline-none" value={numero} onChange={e => setNumero(e.target.value)} />
          </div>
        </div>

        {/* BOTÃO DE CÁLCULO */}
        <div className="bg-white p-6 rounded-[35px] shadow-sm border border-gray-100 text-center">
           {erroLogistica && <p className="text-[10px] font-black text-red-600 uppercase mb-4 italic">⚠️ {erroLogistica}</p>}
           
           {taxaCalculada !== null ? (
             <div className="flex justify-between items-center px-2">
                <span className="text-[10px] font-black uppercase text-green-600 italic">Frete Calculado:</span>
                <span className="font-black text-xl text-blue-600">R$ {taxaCalculada.toFixed(2)}</span>
             </div>
           ) : (
             <button 
               onClick={handleAnalisarLogistica} 
               disabled={!bairroSelecionado || calculando} 
               className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black uppercase italic text-[11px] shadow-lg active:scale-95 transition"
             >
               {calculando ? "Analisando Linhas..." : "🔍 Calcular Frete Inteligente"}
             </button>
           )}
        </div>

        {/* TOTAL E BOTAO FINAL */}
        <div className="bg-gray-900 text-white p-8 rounded-[45px] shadow-2xl">
           <div className="flex justify-between items-center text-3xl font-black italic uppercase tracking-tighter mb-6">
              <span>Total</span>
              <span>R$ {(subtotal + (taxaCalculada || 0)).toFixed(2)}</span>
           </div>
           
           <button 
              onClick={realizarPedidoFinal} 
              disabled={taxaCalculada === null || !rua || !numero} 
              className="w-full bg-red-600 text-white py-5 rounded-3xl font-black uppercase italic text-sm shadow-xl active:scale-95 transition disabled:opacity-20"
           >
              Confirmar Pedido ➔
           </button>
        </div>
      </div>
    </main>
  );
}