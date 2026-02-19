"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../lib/firebase";
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
    // Regra: Refri=5, Pizza=2, Lanche/Outros=1
    const p = item.category === "Bebidas" ? 5 : (item.category === "Pizzas" ? 2 : 1);
    return acc + p;
  }, 0);

  useEffect(() => {
    const carregar = async () => {
      const savedCart = localStorage.getItem("carrinho");
      if (savedCart) setCart(JSON.parse(savedCart));
      else router.push("/");

      const bSnap = await getDocs(collection(db, "neighborhoods"));
      setBairros(bSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      if (user) {
        const uSnap = await getDoc(doc(db, "users", user.uid));
        if (uSnap.exists() && uSnap.data().endereco) {
          const end = uSnap.data().endereco;
          setRua(end.rua || ""); setNumero(end.numero || "");
        }
      }
      setLoading(false);
    };
    carregar();
  }, [user, router]);

  const irParaLogistica = () => {
    if (!bairroSelecionado || !rua) return;
    
    // Salva os dados para a Fase 2 (A transição automática)
    localStorage.setItem("pre_checkout", JSON.stringify({
      bairro: bairroSelecionado,
      rua,
      numero,
      pontosCarga: totalPontos
    }));

    // Manda para a página da Barra de Carregamento
    router.push("/checkout/pre-logistica");
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse">CARREGANDO CARRINHO...</div>;

  return (
    <main className="min-h-screen bg-gray-50 pb-10 max-w-md mx-auto text-black font-sans">
      <header className="bg-white p-6 rounded-b-[45px] shadow-sm mb-6 text-center">
        <h1 className="text-2xl font-black uppercase italic tracking-tighter">Fase 1: Balança</h1>
      </header>

      <div className="px-4 space-y-4">
        {/* BALANÇA DE CARGA */}
        <div className="bg-zinc-900 text-white p-6 rounded-[35px] shadow-xl flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black uppercase italic opacity-40">Volume da Carga</p>
            <h3 className="text-2xl font-black italic">{totalPontos} PONTOS</h3>
          </div>
          <div className="text-right">
            <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase ${totalPontos > 15 ? 'bg-red-600' : 'bg-green-600'}`}>
              {totalPontos > 15 ? 'Carga Pesada' : 'Carga Leve'}
            </span>
          </div>
        </div>

        {/* ENDEREÇO */}
        <div className="bg-white p-6 rounded-[35px] shadow-sm space-y-4 border border-gray-100">
          <select 
            className="w-full bg-gray-50 p-4 rounded-2xl font-bold text-sm outline-none border border-gray-100"
            onChange={(e) => setBairroSelecionado(bairros.find(b => b.id === e.target.value))}
          >
            <option value="">Selecione seu Bairro...</option>
            {bairros.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>

          <input placeholder="Sua Rua" className="w-full bg-gray-50 p-4 rounded-2xl font-bold text-sm outline-none" value={rua} onChange={e => setRua(e.target.value)} />
          <input placeholder="Número" className="w-full bg-gray-50 p-4 rounded-2xl font-bold text-sm outline-none" value={numero} onChange={e => setNumero(e.target.value)} />
        </div>

        <button 
          onClick={irParaLogistica}
          disabled={!bairroSelecionado || !rua}
          className="w-full bg-red-600 text-white py-6 rounded-[35px] font-black uppercase italic text-sm shadow-2xl active:scale-95 transition disabled:opacity-20"
        >
          Analisar Logística ➔
        </button>
      </div>
    </main>
  );
}