"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../lib/firebase"; 
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function PaginaRateio() {
  const router = useRouter();
  const [pedidosNaRota, setPedidosNaRota] = useState(0);
  const [dadosPreCheckout, setDadosPreCheckout] = useState(null);

  // 1. Recupera os dados salvos pela Balança (Fase 1)
  useEffect(() => {
    const saved = localStorage.getItem("pre_checkout");
    if (saved) setDadosPreCheckout(JSON.parse(saved));
  }, []);

  // 2. Monitora o agrupamento da linha para o fechamento das 19h
  useEffect(() => {
    const q = query(
      collection(db, "pedidos"), 
      where("status", "==", "aguardando_onda"),
      where("dataEntrega", "==", new Date().toLocaleDateString('pt-BR'))
    );
    
    const unsub = onSnapshot(q, (snap) => {
      setPedidosNaRota(snap.size + 1); 
    });
    return () => unsub();
  }, []);

  const prosseguirParaPagamento = () => {
    // Agora o Rateio manda para onde a Balança mandava antes: a pré-logística
    router.push("/checkout/pre-logistica");
  };

  return (
    <main className="min-h-screen bg-white flex flex-col font-sans max-w-md mx-auto shadow-2xl">
      <header className="p-6 border-b border-zinc-100 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-zinc-400">✕</button>
        <h1 className="font-bold text-sm uppercase tracking-widest text-zinc-900">Logística de Linha</h1>
        <div className="w-4"></div>
      </header>

      <div className="flex-1 p-8 flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-red-50 rounded-[35px] flex items-center justify-center text-4xl mb-6 shadow-sm">
          📦
        </div>

        <h2 className="text-2xl font-black italic text-zinc-900 uppercase leading-tight mb-2">
          Sua entrega entra na <span className="text-red-600">onda das 19h</span>
        </h2>
        
        <p className="text-zinc-500 text-sm mb-8">
          Agrupando seu pedido com outros <strong>{pedidosNaRota} volumes</strong> na mesma região.
        </p>

        {/* BARRA DE OTIMIZAÇÃO DE ROTA (Substituiu Frete Grátis) */}
        <div className="w-full bg-zinc-100 h-4 rounded-full overflow-hidden mb-2">
          <div 
            className="bg-zinc-900 h-full transition-all duration-1000" 
            style={{ width: `${Math.min((pedidosNaRota / 10) * 100, 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between w-full text-[10px] font-black text-zinc-400 uppercase mb-10 tracking-widest">
          <span>Coleta</span>
          <span>Rota Otimizada</span>
        </div>

        {/* INFORMAÇÃO DE FECHAMENTO */}
        <div className="w-full bg-zinc-900 rounded-[32px] p-8 mb-8 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl rotate-12 text-white">🕒</div>
          <p className="text-[10px] font-black text-red-500 uppercase mb-2 tracking-widest">Horário de Saída</p>
          <h3 className="text-3xl font-black italic text-white uppercase">19:00h</h3>
          <p className="text-[9px] text-zinc-400 mt-4 uppercase font-bold tracking-tighter">
            As linhas do dia fecham pontualmente. Pedidos confirmados após este horário entram na próxima escala.
          </p>
        </div>

        <div className="bg-zinc-50 p-5 rounded-3xl border border-zinc-100 text-left">
          <p className="text-[11px] text-zinc-600 leading-snug font-medium">
            <strong>Logística Off-Road:</strong> Seu pedido foi identificado na <strong>{dadosPreCheckout?.bairro?.name || "Rota Principal"}</strong>. O entregador sairá com a carga completa para garantir a entrega em todos os pontos da linha.
          </p>
        </div>
      </div>

      <footer className="p-6 pb-10">
        <button 
          onClick={prosseguirParaPagamento}
          className="w-full bg-red-600 text-white py-6 rounded-[35px] font-black italic uppercase tracking-widest shadow-xl shadow-red-200 active:scale-95 transition"
        >
          Confirmar e Seguir ➔
        </button>
      </footer>
    </main>
  );
}