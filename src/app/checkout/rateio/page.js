"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "../../../lib/firebase"; //
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function PaginaRateio() {
  const router = useRouter();
  const [pedidosNaRota, setPedidosNaRota] = useState(0);
  const [valorFreteOriginal, setValorFreteOriginal] = useState(10.00); // Exemplo vindo da Balança

  // 1. Monitora quantos pedidos existem na mesma linha/rota
  useEffect(() => {
    // Simulando a busca por pedidos na "Linha 1" que fecham às 19h
    const q = query(collection(db, "pedidos"), where("linha", "==", 1), where("status", "==", "pendente"));
    const unsub = onSnapshot(q, (snap) => {
      setPedidosNaRota(snap.size + 1); // +1 conta o pedido atual do cliente
    });
    return () => unsub();
  }, []);

  // 2. Lógica de cálculo do desconto progressivo
  const calcularDesconto = () => {
    if (pedidosNaRota <= 1) return 0;
    if (pedidosNaRota === 2) return valorFreteOriginal * 0.2; // 20% de volta
    return valorFreteOriginal * 0.4; // 40% de volta se houver 3 ou mais
  };

  const moedasDeVolta = calcularDesconto();

  return (
    <main className="min-h-screen bg-white flex flex-col font-sans max-w-md mx-auto shadow-2xl">
      {/* HEADER ESTILO INSTAGRAM */}
      <header className="p-6 border-b border-zinc-100 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-zinc-400">✕</button>
        <h1 className="font-bold text-sm uppercase tracking-widest text-zinc-900">Economia Coletiva</h1>
        <div className="w-4"></div>
      </header>

      <div className="flex-1 p-8 flex flex-col items-center text-center">
        {/* ÍCONE DE MOEDAS ANIMADO */}
        <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center text-4xl mb-6 animate-bounce shadow-inner">
          🪙
        </div>

        <h2 className="text-2xl font-black italic text-zinc-900 uppercase leading-tight mb-2">
          Sua rota está <span className="text-red-600">bombando!</span>
        </h2>
        
        <p className="text-zinc-500 text-sm mb-8">
          Já existem <strong>{pedidosNaRota} pedidos</strong> confirmados para a sua região hoje.
        </p>

        {/* BARRA DE PROGRESSO DO RATEIO */}
        <div className="w-full bg-zinc-100 h-4 rounded-full overflow-hidden mb-2">
          <div 
            className="bg-red-600 h-full transition-all duration-1000" 
            style={{ width: `${(pedidosNaRota / 5) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between w-full text-[10px] font-bold text-zinc-400 uppercase mb-10">
          <span>Início</span>
          <span>Frete Grátis?</span>
        </div>

        {/* BOX DE ECONOMIA */}
        <div className="w-full bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-[32px] p-6 mb-8">
          <p className="text-[10px] font-black text-zinc-400 uppercase mb-2">Previsão de Reembolso</p>
          <div className="flex items-center justify-center gap-2">
             <span className="text-3xl font-black text-green-600">+{moedasDeVolta.toFixed(0)}</span>
             <span className="text-sm font-bold text-zinc-900 uppercase">Moedas</span>
          </div>
          <p className="text-[9px] text-zinc-400 mt-2">
            Essas moedas cairão na sua carteira após o fechamento das 19:00.
          </p>
        </div>

        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-left">
          <p className="text-[11px] text-blue-700 leading-snug">
            <strong>Como funciona?</strong> Você paga o frete fixo agora. Às 19h, nossa IA divide o custo total pelo número de vizinhos e te devolve a diferença em créditos!
          </p>
        </div>
      </div>

      {/* BOTÃO PARA PAGAMENTO */}
      <footer className="p-6 pb-10">
        <button 
          onClick={() => router.push("/checkout/pagamento")}
          className="w-full bg-red-600 text-white py-5 rounded-[24px] font-black italic uppercase tracking-widest shadow-xl shadow-red-200 active:scale-95 transition"
        >
          Ir para o Pagamento ➔
        </button>
      </footer>
    </main>
  );
}