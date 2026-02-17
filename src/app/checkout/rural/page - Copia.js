"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../lib/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";

export default function CheckoutPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [cart, setCart] = useState([]);
  const [bairrosDisponiveis, setBairrosDisponiveis] = useState([]);
  const [bairroSelecionado, setBairroSelecionado] = useState(null);
  
  const [nomeCliente, setNomeCliente] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [pagamento, setPagamento] = useState("Pix");
  const [loading, setLoading] = useState(true);

  // CARREGAR DADOS
  useEffect(() => {
    const savedCart = localStorage.getItem("carrinho");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    } else {
      router.push("/"); 
    }

    if (user?.displayName) setNomeCliente(user.displayName);

    const fetchBairros = async () => {
      const bSnap = await getDocs(collection(db, "neighborhoods"));
      const bList = bSnap.docs.map(d => ({ 
        id: d.id, nome: d.data().name, taxa: d.data().fee 
      })).sort((a,b) => a.nome.localeCompare(b.nome));
      setBairrosDisponiveis(bList);
      if (bList.length > 0) setBairroSelecionado(bList[0]);
      setLoading(false);
    };
    fetchBairros();
  }, [user, router]);

  // CÁLCULOS
  const subtotal = cart.reduce((acc, item) => acc + Number(item.price), 0);
  const taxaEntrega = bairroSelecionado ? Number(bairroSelecionado.taxa) : 0;
  const totalGeral = subtotal + taxaEntrega;
  
  // CÁLCULOS DE MOEDAS 🪙
  const totalMoedasCusto = cart.reduce((acc, item) => acc + (item.coinPrice || 0), 0);
  const totalMoedasGanho = cart.reduce((acc, item) => acc + (item.coinBonus || 0), 0);

  const sendOrder = async () => {
    if (!nomeCliente) return alert("Digite seu nome!");
    if (taxaEntrega > 0 && (!rua || !numero)) return alert("Endereço incompleto!");

    if (pagamento === "Moedas") {
       if (!confirm(`Confirmar pagamento de 🪙 ${totalMoedasCusto} moedas?`)) return;
    }

    try {
      await addDoc(collection(db, "orders"), {
        cliente: { nome: nomeCliente, telefone: user?.phoneNumber || "N/A", uid: user?.uid || "anon" },
        endereco: { bairro: bairroSelecionado?.nome, rua, numero },
        itens: cart,
        valores: { 
          subtotal, taxaEntrega, total: totalGeral,
          custoEmMoedas: pagamento === "Moedas" ? totalMoedasCusto : 0,
          bonusGerado: pagamento !== "Moedas" ? totalMoedasGanho : 0 
        },
        pagamento, status: "Pendente", data: new Date()
      });
      
      alert(`✅ Pedido Confirmado! ${pagamento !== "Moedas" ? `Você ganhou +${totalMoedasGanho} moedas!` : ""}`);
      localStorage.removeItem("carrinho");
      router.push("/");
    } catch (e) { alert("Erro: " + e.message); }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Carregando checkout...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-32">
      <header className="mb-6 flex items-center gap-2 sticky top-0 bg-gray-50 py-2 z-10">
        <button onClick={() => router.back()} className="text-gray-500 font-bold text-xl px-2">← Voltar</button>
        <h1 className="text-xl font-bold text-gray-800">Finalizar Pedido</h1>
      </header>

      <div className="max-w-md mx-auto space-y-6">
        
        {/* LISTA DE ITENS COM MOEDAS */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h2 className="font-bold text-gray-700 mb-3 border-b pb-2 flex justify-between">
            <span>Seus Itens ({cart.length})</span>
            <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
              Bônus total: +{totalMoedasGanho} moedas
            </span>
          </h2>
          <div className="max-h-60 overflow-y-auto space-y-3">
            {cart.map((item, index) => (
              <div key={index} className="flex justify-between items-start text-sm border-b border-gray-100 pb-2 last:border-0">
                <div className="flex-1">
                   <span className="font-medium text-gray-800">{item.name}</span>
                   {/* Mostra o ganho individual */}
                   {item.coinBonus > 0 && (
                     <p className="text-[10px] text-green-600">Ganhe +{item.coinBonus} moedas</p>
                   )}
                </div>
                <div className="text-right">
                  <span className="font-bold text-gray-900 block">R$ {Number(item.price).toFixed(2)}</span>
                  {/* Mostra o custo em moedas */}
                  {item.coinPrice && (
                    <span className="text-[10px] text-yellow-600 font-bold block">ou 🪙 {item.coinPrice}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ENTREGA */}
        <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
          <h2 className="font-bold text-gray-700 border-b pb-2">Entrega</h2>
          <input placeholder="Seu Nome" className="w-full border p-3 rounded bg-gray-50 outline-none focus:border-red-500" value={nomeCliente} onChange={e => setNomeCliente(e.target.value)}/>
          <div>
            <label className="text-xs text-gray-500 ml-1">Bairro</label>
            <select className="w-full border p-3 rounded bg-white" onChange={(e) => setBairroSelecionado(bairrosDisponiveis.find(b => b.nome === e.target.value))} value={bairroSelecionado?.nome || ""}>
              {bairrosDisponiveis.map(b => <option key={b.id} value={b.nome}>{b.nome} (+ R$ {b.taxa})</option>)}
            </select>
          </div>
          {bairroSelecionado?.taxa > 0 && (
            <div className="flex gap-2">
              <input placeholder="Rua" className="flex-1 border p-3 rounded bg-gray-50" value={rua} onChange={e => setRua(e.target.value)}/>
              <input placeholder="Nº" className="w-24 border p-3 rounded bg-gray-50" value={numero} onChange={e => setNumero(e.target.value)}/>
            </div>
          )}
        </div>

        {/* PAGAMENTO E TOTAIS */}
        <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
          <h2 className="font-bold text-gray-700 border-b pb-2">Pagamento</h2>
          
          <div className="bg-red-50 p-3 rounded border border-red-100">
             <label className="text-xs text-red-500 font-bold uppercase">Forma de Pagamento</label>
             <select className="w-full bg-white border p-2 rounded mt-1 outline-none" value={pagamento} onChange={e => setPagamento(e.target.value)}>
               <option value="Pix">Pix</option>
               <option value="Dinheiro">Dinheiro</option>
               <option value="Cartao">Cartão</option>
               <option value="Moedas">🪙 Saldo de Moedas (Custo: {totalMoedasCusto})</option>
             </select>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg mt-4">
             {pagamento === "Moedas" ? (
               // VISUAL SE PAGAR COM MOEDAS
               <div className="text-center">
                 <p className="text-gray-500 text-sm mb-1">Total em Moedas</p>
                 <div className="text-yellow-700 font-bold text-3xl">🪙 {totalMoedasCusto}</div>
                 <p className="text-xs text-red-400 mt-2">Você não ganha bônus pagando com moedas.</p>
               </div>
             ) : (
               // VISUAL SE PAGAR COM DINHEIRO
               <>
                 <div className="flex justify-between text-gray-600 mb-1"><span>Produtos</span><span>R$ {subtotal.toFixed(2)}</span></div>
                 <div className="flex justify-between text-red-600 mb-2"><span>Entrega</span><span>R$ {taxaEntrega.toFixed(2)}</span></div>
                 
                 <div className="flex justify-between text-2xl font-bold text-gray-900 mt-2 pt-2 border-t border-gray-300">
                   <span>Total</span><span>R$ {totalGeral.toFixed(2).replace('.', ',')}</span>
                 </div>

                 {/* BÔNUS DESTAQUE */}
                 {totalMoedasGanho > 0 && (
                   <div className="mt-4 bg-yellow-100 border border-yellow-300 p-3 rounded-lg text-center animate-pulse">
                     <p className="text-xs text-yellow-800 uppercase font-bold">Recompensa da Compra</p>
                     <p className="text-xl font-bold text-yellow-700">🎁 +{totalMoedasGanho} Moedas</p>
                   </div>
                 )}
               </>
             )}
          </div>
        </div>

        <button 
          onClick={sendOrder} 
          className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg mb-10 transition-transform active:scale-95
            ${pagamento === "Moedas" ? "bg-yellow-600 hover:bg-yellow-700" : "bg-green-600 hover:bg-green-700"}`}
        >
          {pagamento === "Moedas" ? "Pagar com Moedas 🪙" : "Confirmar Pedido ✅"}
        </button>
      </div>
    </div>
  );
}