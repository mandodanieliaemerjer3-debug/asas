"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../lib/firebase"; //
import { getDocs, collection, doc, getDoc } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";

export default function CheckoutFase1() {
  const { user } = useAuth();
  const router = useRouter();

  const [cart, setCart] = useState([]);
  const [bairros, setBairros] = useState([]);
  const [bairroSelecionado, setBairroSelecionado] = useState(null);
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [loading, setLoading] = useState(true);

  // ⚖️ CÁLCULO DA BALANÇA (PONTOS)
  const totalPontos = cart.reduce((acc, item) => {
    const p = item.category === "Bebidas" ? 5 : (item.category === "Pizzas" ? 2 : 1);
    return acc + p;
  }, 0);

  useEffect(() => {
    const carregarDados = async () => {
      // 1. Carrega carrinho local
      const savedCart = localStorage.getItem("carrinho");
      if (savedCart) setCart(JSON.parse(savedCart));
      else router.push("/");

      // 2. Carrega lista de bairros do Firebase
      const bSnap = await getDocs(collection(db, "neighborhoods"));
      const listaBairros = bSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setBairros(listaBairros);

      // 3. PUXA O BAIRRO E ENDEREÇO DO USUÁRIO AUTOMATICAMENTE
      if (user) {
        const uSnap = await getDoc(doc(db, "users", user.uid));
        if (uSnap.exists()) {
          const dadosUser = uSnap.data();
          if (dadosUser.endereco) {
            setRua(dadosUser.endereco.rua || "");
            setNumero(dadosUser.endereco.numero || "");
            
            // Tenta pré-selecionar o bairro se o ID salvo coincidir
            const bairroSalvo = listaBairros.find(b => b.id === dadosUser.endereco.bairroId);
            if (bairroSalvo) setBairroSelecionado(bairroSalvo);
          }
        }
      }
      setLoading(false);
    };
    carregarDados();
  }, [user, router]);

  const irParaRateio = () => {
    if (!bairroSelecionado || !rua) return;
    
    // Salva os dados para as próximas fases
    localStorage.setItem("pre_checkout", JSON.stringify({
      bairro: bairroSelecionado,
      rua,
      numero,
      pontosCarga: totalPontos
    }));

    // 🚀 NOVA DIREÇÃO: Manda para a página de Rateio antes da logística final
    router.push("/checkout/rateio");
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-zinc-400 uppercase italic">Pesando Carga...</div>;

  return (
    <main className="min-h-screen bg-gray-50 pb-10 max-w-md mx-auto text-black font-sans">
      <header className="bg-white p-6 rounded-b-[45px] shadow-sm mb-6 text-center border-b border-gray-100">
        <h1 className="text-2xl font-black uppercase italic tracking-tighter">Fase 1: Balança</h1>
      </header>

      <div className="px-4 space-y-4">
        {/* CARD DA BALANÇA (VISUAL ANTIGO QUE VOCÊ GOSTA) */}
        <div className="bg-zinc-900 text-white p-8 rounded-[40px] shadow-2xl flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl rotate-12">⚖️</div>
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase italic opacity-40 tracking-widest">Volume da Carga</p>
            <h3 className="text-3xl font-black italic uppercase">{totalPontos} Pontos</h3>
          </div>
          <div className="relative z-10 text-right">
            <span className={`text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-tighter ${totalPontos > 15 ? 'bg-red-600' : 'bg-green-600'}`}>
              {totalPontos > 15 ? 'Carga Pesada' : 'Carga Leve'}
            </span>
          </div>
        </div>

        {/* FORMULÁRIO DE ENDEREÇO COM AUTO-PREENCHIMENTO */}
        <div className="bg-white p-6 rounded-[40px] shadow-sm space-y-4 border border-gray-100">
          <p className="text-[10px] font-black uppercase text-zinc-400 ml-2 italic">Local de Entrega</p>
          
          <select 
            className="w-full bg-gray-50 p-5 rounded-3xl font-bold text-sm outline-none border border-gray-100 appearance-none"
            value={bairroSelecionado?.id || ""}
            onChange={(e) => setBairroSelecionado(bairros.find(b => b.id === e.target.value))}
          >
            <option value="">Selecione seu Bairro...</option>
            {bairros.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>

          <input 
            placeholder="Sua Rua" 
            className="w-full bg-gray-50 p-5 rounded-3xl font-bold text-sm outline-none border border-gray-100 focus:border-red-600 transition-all" 
            value={rua} 
            onChange={e => setRua(e.target.value)} 
          />
          
          <input 
            placeholder="Número ou Referência" 
            className="w-full bg-gray-50 p-5 rounded-3xl font-bold text-sm outline-none border border-gray-100 focus:border-red-600 transition-all" 
            value={numero} 
            onChange={e => setNumero(e.target.value)} 
          />
        </div>

        {/* BOTÃO DE AÇÃO PARA O RATEIO */}
        <button 
          onClick={irParaRateio}
          disabled={!bairroSelecionado || !rua}
          className="w-full bg-red-600 text-white py-6 rounded-[40px] font-black uppercase italic text-sm shadow-xl shadow-red-100 active:scale-95 transition disabled:opacity-20 mt-4"
        >
          Analisar Logística ➔
        </button>
      </div>

      <div className="mt-8 text-center px-10">
         <p className="text-[10px] font-bold text-zinc-400 uppercase leading-tight">
           Sua carga será processada pela nossa IA para agrupamento na linha das 19h.
         </p>
      </div>
    </main>
  );
}