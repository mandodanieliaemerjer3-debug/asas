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

  const [cart, setCart] = useState([]);
  const [bairrosDisponiveis, setBairrosDisponiveis] = useState([]);
  const [bairroSelecionado, setBairroSelecionado] = useState(null);
  const [enderecoSalvoOriginal, setEnderecoSalvoOriginal] = useState(null);
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [loading, setLoading] = useState(true);
  const [mostrarPopUp, setMostrarPopUp] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem("carrinho");
    if (savedCart) setCart(JSON.parse(savedCart));
    else router.push("/");

    const fetchData = async () => {
      try {
        const bSnap = await getDocs(collection(db, "neighborhoods"));
        const listaBairros = bSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setBairrosDisponiveis(listaBairros);

        if (user) {
          const userSnap = await getDoc(doc(db, "users", user.uid));
          if (userSnap.exists() && userSnap.data().endereco) {
            const end = userSnap.data().endereco;
            setRua(end.rua || "");
            setNumero(end.numero || "");
            setEnderecoSalvoOriginal(end); // Guardamos para comparar depois
            
            const bSalvo = listaBairros.find(b => b.id === end.bairroId);
            if (bSalvo) {
              if (bSalvo.linhaId) {
                localStorage.setItem("bairro_rural", JSON.stringify(bSalvo));
                router.push("/checkout/rural");
                return;
              }
              setBairroSelecionado(bSalvo);
            }
          }
        }
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, router]);

  // FUNÇÃO PARA CRIAR O PEDIDO REAL NO FIREBASE
  const finalizarPedidoComum = async () => {
    try {
      const novoPedido = {
        clienteId: user.uid,
        clienteNome: user.displayName,
        itens: cart,
        subtotal: cart.reduce((acc, i) => acc + i.price, 0),
        taxaEntrega: bairroSelecionado.fee,
        total: cart.reduce((acc, i) => acc + i.price, 0) + bairroSelecionado.fee,
        endereco: {
          bairro: bairroSelecionado.name,
          bairroId: bairroSelecionado.id,
          rua,
          numero
        },
        status: "Aguardando Entregador",
        criadoEm: new Date().toISOString()
      };

      await addDoc(collection(db, "orders"), novoPedido);
      
      // Verifica se o endereço digitado é DIFERENTE do salvo para mostrar o Pop-up
      const mudouEndereco = !enderecoSalvoOriginal || 
                            enderecoSalvoOriginal.rua !== rua || 
                            enderecoSalvoOriginal.numero !== numero ||
                            enderecoSalvoOriginal.bairroId !== bairroSelecionado.id;

      if (mudouEndereco) {
        setMostrarPopUp(true);
      } else {
        concluirEIrParaSucesso();
      }
    } catch (error) {
      alert("Erro ao enviar pedido.");
    }
  };

  const salvarNovoEndereco = async () => {
    await updateDoc(doc(db, "users", user.uid), {
      endereco: {
        bairroId: bairroSelecionado.id,
        rua,
        numero,
        atualizadoEm: new Date().toISOString()
      }
    });
    concluirEIrParaSucesso();
  };

  const concluirEIrParaSucesso = () => {
    localStorage.removeItem("carrinho");
    alert("Pedido realizado com sucesso!");
    router.push("/pedidos"); // Ou sua página de acompanhamento
  };

  if (loading) return <div className="p-20 text-center font-black uppercase italic animate-pulse">Carregando...</div>;

  return (
    <main className="min-h-screen bg-gray-50 pb-20 font-sans max-w-md mx-auto relative">
      
      {/* POP-UP DE SALVAMENTO INTELIGENTE */}
      {mostrarPopUp && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] p-8 w-full text-center shadow-2xl">
            <h3 className="text-xl font-black uppercase italic leading-tight">Você mudou seu endereço!</h3>
            <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">Deseja salvar este novo local como seu padrão?</p>
            <div className="grid grid-cols-2 gap-3 mt-8">
              <button onClick={concluirEIrParaSucesso} className="py-4 rounded-2xl font-black uppercase text-[10px] bg-gray-100 text-gray-400">Agora não</button>
              <button onClick={salvarNovoEndereco} className="py-4 rounded-2xl font-black uppercase text-[10px] bg-green-600 text-white">Sim, salvar!</button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white p-6 rounded-b-[45px] shadow-sm mb-6 border-b border-gray-100">
        <button onClick={() => router.back()} className="text-gray-300 font-black text-[9px] mb-4 block uppercase italic">← Voltar</button>
        <h1 className="text-2xl font-black uppercase italic tracking-tighter text-gray-900 leading-none">Checkout</h1>
      </header>

      <div className="px-4 space-y-6">
        {/* SELEÇÃO DE BAIRRO */}
        <div className="bg-white p-6 rounded-[35px] shadow-sm">
          <label className="text-[10px] font-black uppercase text-gray-400 mb-4 block italic">Onde entregar em Guapiara?</label>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {bairrosDisponiveis.map(b => (
              <button
                key={b.id}
                onClick={() => {
                  if (b.linhaId) {
                    localStorage.setItem("bairro_rural", JSON.stringify(b));
                    router.push("/checkout/rural");
                  } else {
                    setBairroSelecionado(b);
                  }
                }}
                className={`flex-shrink-0 px-6 py-3 rounded-full font-bold text-xs transition-all ${
                  bairroSelecionado?.id === b.id ? "bg-red-600 text-white" : "bg-gray-100 text-gray-500"
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>

        {/* ENDEREÇO */}
        <div className="bg-white p-6 rounded-[35px] shadow-sm space-y-4">
          <div className="flex gap-2">
            <input 
              placeholder="Rua / Estrada" 
              className="flex-1 bg-gray-50 p-4 rounded-2xl outline-none font-bold text-sm" 
              value={rua} 
              onChange={e => setRua(e.target.value)} 
            />
            <input 
              placeholder="Nº" 
              className="w-20 bg-gray-50 p-4 rounded-2xl outline-none font-bold text-sm text-center" 
              value={numero} 
              onChange={e => setNumero(e.target.value)} 
            />
          </div>
        </div>

        {/* RESUMO DE VALORES */}
        <div className="bg-white p-6 rounded-[35px] shadow-sm border border-gray-100">
          <div className="flex justify-between items-center text-gray-900 font-black text-2xl italic uppercase tracking-tighter">
            <span>Total</span>
            <span>R$ {(cart.reduce((acc, i) => acc + i.price, 0) + (bairroSelecionado?.fee || 0)).toFixed(2)}</span>
          </div>
        </div>

        <button 
          onClick={finalizarPedidoComum}
          className="w-full bg-black text-white p-6 rounded-[35px] font-black uppercase italic text-sm shadow-xl active:scale-95 transition"
          disabled={!bairroSelecionado || !rua}
        >
          Confirmar Pedido ➔
        </button>
      </div>
    </main>
  );
}