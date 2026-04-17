"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../lib/firebase"; 
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "../../../contexts/AuthContext";

export default function PaginaRateio() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Estados para as Variáveis Nomeadas
  const [logistica, setLogistica] = useState({
    valorRateioLinha: 0,
    custoAdicionalBairro: 0,
    freteFinal: 0,
    totalProdutos: 0,
    totalGeral: 0
  });

  const [dadosPre, setDadosPre] = useState(null);
  const [pedidosNaLinha, setPedidosNaLinha] = useState(1);

  useEffect(() => {
    // 1. Puxa os dados da Balança
    const saved = JSON.parse(localStorage.getItem("pre_checkout") || "{}");
    if (!saved.bairro) {
      router.push("/checkout");
      return;
    }

    setDadosPre(saved);
    setLogistica({
      valorRateioLinha: saved.valorRateioLinha || 0,
      custoAdicionalBairro: saved.custoAdicionalBairro || 0,
      freteFinal: saved.freteFinal || 0,
      totalProdutos: saved.totalProdutos || 0,
      totalGeral: (saved.totalProdutos || 0) + (saved.freteFinal || 0)
    });

    // 2. Monitora quantos pedidos estão na mesma linha para o fechamento das 18h
    const q = query(
      collection(db, "pedidos"), 
      where("status", "==", "Pendente"),
      where("linhaId", "==", saved.bairro.linhaId || "geral")
    );
    
    const unsub = onSnapshot(q, (snap) => {
      setPedidosNaLinha(snap.size + 1);
    });
    return () => unsub();
  }, [router]);

  return (
    <main className="min-h-screen bg-white flex flex-col font-sans max-w-md mx-auto shadow-2xl">
      <header className="p-6 border-b border-zinc-50 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-zinc-400">✕</button>
        <h1 className="font-black text-[10px] uppercase tracking-widest text-zinc-900 italic">Logística de Linha</h1>
        <div className="w-4"></div>
      </header>

      <div className="flex-1 p-8 flex flex-col items-center">
        {/* CARD DE VALORES COM NOMENCLATURA DO BANCO */}
        <div className="w-full bg-zinc-900 rounded-[45px] p-8 text-center shadow-2xl mb-10 relative overflow-hidden">
          <p className="text-[10px] font-black text-red-500 uppercase mb-2 tracking-widest">Total do Pedido</p>
          <h2 className="text-5xl font-black italic text-white tracking-tighter">
            R$ {logistica.totalGeral.toFixed(2)}
          </h2>
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-1 text-[9px] font-bold text-zinc-500 uppercase">
             <p>Produtos: R$ {logistica.totalProdutos.toFixed(2)}</p>
             <p>Frete ({dadosPre?.bairro?.name}): R$ {logistica.freteFinal.toFixed(2)}</p>
          </div>
        </div>

        {/* EXPLICAÇÃO DO RATEIO */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-black italic text-zinc-900 uppercase">Saída às 18:00h 🕒</h3>
          <p className="text-zinc-400 text-[11px] font-bold uppercase mt-2">
            {pedidosNaLinha} pedido(s) agrupado(s) nesta linha
          </p>
        </div>

        <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden mb-10">
          <div 
            className="bg-red-600 h-full transition-all duration-1000" 
            style={{ width: `${Math.min((pedidosNaLinha / 10) * 100, 100)}%` }}
          ></div>
        </div>

        {/* STATUS DO RANK */}
        <div className="bg-zinc-50 p-6 rounded-[35px] border border-zinc-100 w-full flex items-center gap-4">
          <div className="text-2xl">🌲</div>
          <div>
            <p className="text-[10px] font-black text-zinc-400 uppercase">Rank de Entrega</p>
            <p className="text-sm font-black text-zinc-900 uppercase italic">
              {dadosPre?.bairro?.tipo === "offroad" ? "Off-Road Root" : "Asfalto Zero"}
            </p>
          </div>
        </div>
      </div>

      <footer className="p-6 pb-12">
        <button 
          onClick={() => router.push("/checkout/pagamento")}
          className="w-full bg-red-600 text-white py-6 rounded-[35px] font-black italic uppercase tracking-widest shadow-xl shadow-red-100 active:scale-95 transition"
        >
          Escolher Pagamento ➔
        </button>
      </footer>
    </main>
  );
}