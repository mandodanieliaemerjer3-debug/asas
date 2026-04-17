"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../lib/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useAuth } from "../../../contexts/AuthContext";

export default function PagamentoPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();

  const [pedido, setPedido] = useState(null);
  const [saldoMoedas, setSaldoMoedas] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    // Escuta o pedido em tempo real para pegar os valores salvos no checkout
    const unsubPedido = onSnapshot(doc(db, "orders", id), (docSnap) => {
      if (docSnap.exists()) {
        setPedido({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    });

    // Escuta o saldo do usuário
    if (user) {
      const unsubUser = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
        if (docSnap.exists()) {
          setSaldoMoedas(docSnap.data().moedas || 0);
        }
      });
      return () => { unsubPedido(); unsubUser(); };
    }

    return () => unsubPedido();
  }, [id, user]);

  // --- LÓGICA DE MOEDAS (SEGUNDO PREÇO) ---
  const moedasProdutos = pedido?.itens?.reduce((acc, item) => acc + (item.coinPrice || 0), 0) || 0;
  const freteEmReais = pedido?.valores?.taxaEntrega || 0;
  
  // O frete em moedas é o frete em Real x 200
  const freteEmMoedas = freteEmReais * 200;
  const custoMoedasTotal = moedasProdutos + freteEmMoedas;

  const selecionarForma = async (forma) => {
    try {
      await updateDoc(doc(db, "orders", id), {
        formaPagamento: forma,
        // Se pagar com moedas, o sistema já registra o valor final gasto
        moedasGastas: forma === 'moedas' ? custoMoedasTotal : 0
      });
      
      router.push(`/pagamento/${forma}/${id}`);
    } catch (error) {
      console.error("Erro ao selecionar pagamento:", error);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50 max-w-md mx-auto font-sans pb-10">
      
      {/* HEADER PREMIUM COM TOTAL EM REAL */}
      <div className="bg-white p-6 rounded-b-[40px] shadow-sm border-b border-gray-100 mb-6">
        <div className="flex justify-between items-start">
          <button onClick={() => router.back()} className="text-gray-400">❮ Voltar</button>
          <span className="text-[9px] font-black text-white bg-black px-3 py-1 rounded-full uppercase italic">Pedido: {id?.slice(-6)}</span>
        </div>
        
        <h1 className="font-black italic uppercase text-3xl text-gray-900 tracking-tighter mt-4">Checkout</h1>
        <div className="mt-2">
          <p className="text-[10px] font-black text-gray-400 uppercase leading-none">Total a pagar</p>
          <p className="text-4xl font-black text-red-600 italic tracking-tighter">R$ {pedido?.valores?.total.toFixed(2)}</p>
        </div>
      </div>

      <div className="px-4 space-y-4">
        <p className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Escolha a forma de pagamento</p>

        {/* PIX */}
        <button onClick={() => selecionarForma('pix')} className="group w-full bg-white p-5 rounded-[32px] border-2 border-transparent hover:border-teal-500 shadow-sm transition-all active:scale-95 flex items-center gap-4">
          <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition">⚡</div>
          <div className="flex-1 text-left">
            <p className="font-black text-gray-800 uppercase text-xs tracking-tight">Pix Instantâneo</p>
            <p className="text-[9px] text-teal-600 font-bold uppercase tracking-tighter italic">Liberação imediata do pedido</p>
          </div>
          <span className="text-gray-200">❯</span>
        </button>

        {/* MERCADO PAGO / CARTÃO */}
        <button onClick={() => selecionarForma('mercado-pago')} className="group w-full bg-white p-5 rounded-[32px] border-2 border-transparent hover:border-blue-500 shadow-sm transition-all active:scale-95 relative overflow-hidden flex items-center gap-4">
          {/* Selo de Parcelamento */}
          <div className="absolute top-0 right-0 bg-blue-600 text-white text-[8px] font-black px-4 py-1 rounded-bl-2xl uppercase italic tracking-tighter">Até 12x no cartão</div>
          
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition">💳</div>
          <div className="flex-1 text-left">
            <p className="font-black text-gray-800 uppercase text-xs tracking-tight">Mercado Pago</p>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter italic">Crédito, Débito ou Parcelado</p>
          </div>
          <span className="text-gray-200">❯</span>
        </button>

        {/* DINHEIRO */}
        <button onClick={() => selecionarForma('dinheiro')} className="w-full bg-white p-5 rounded-[32px] border-2 border-transparent shadow-sm active:scale-95 flex items-center gap-4">
          <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-2xl">💵</div>
          <div className="flex-1 text-left">
            <p className="font-black text-gray-800 uppercase text-xs tracking-tight">Dinheiro</p>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter italic">Pagamento na entrega</p>
          </div>
          <span className="text-gray-200">❯</span>
        </button>

        {/* DIVISOR ESTILIZADO */}
        <div className="py-6 flex items-center gap-4 opacity-20">
          <div className="h-[2px] bg-gray-400 flex-1"></div>
          <span className="text-xl font-black italic text-gray-800">OU</span>
          <div className="h-[2px] bg-gray-400 flex-1"></div>
        </div>

        {/* SEÇÃO DE MOEDAS (SEGUNDO PREÇO) */}
        <div className={`p-[2px] rounded-[40px] ${saldoMoedas >= custoMoedasTotal ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 animate-gradient shadow-xl' : 'bg-gray-200 opacity-60'}`}>
          <button
            disabled={saldoMoedas < custoMoedasTotal}
            onClick={() => selecionarForma('moedas')}
            className="w-full bg-white p-6 rounded-[38px] flex flex-col items-center relative overflow-hidden"
          >
            {saldoMoedas >= custoMoedasTotal && (
              <div className="absolute -top-1 -right-1 bg-green-600 text-white text-[7px] font-black px-3 py-1 rounded-bl-xl animate-pulse uppercase italic">Saldo Disponível</div>
            )}
            
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl drop-shadow-md">🪙</span>
              <div className="text-left">
                <span className="font-black uppercase italic text-gray-900 text-base tracking-tighter block leading-none">Pagar com Moedas</span>
                <span className="text-[8px] font-black text-orange-500 uppercase">Crédito exclusivo Mogu Mogu</span>
              </div>
            </div>

            <div className="grid grid-cols-2 w-full border-t border-gray-50 pt-5">
              <div className="text-center border-r border-gray-100">
                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Custo Total</p>
                <p className="font-black text-orange-600 text-2xl tracking-tighter">{custoMoedasTotal.toLocaleString()}</p>
                <p className="text-[6px] text-gray-300 uppercase font-bold mt-1 tracking-widest">Moedas</p>
              </div>
              <div className="text-center pl-2">
                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Seu Saldo</p>
                <p className={`font-black text-2xl tracking-tighter ${saldoMoedas >= custoMoedasTotal ? 'text-green-600' : 'text-red-500'}`}>
                  {saldoMoedas.toLocaleString()}
                </p>
                <p className="text-[6px] text-gray-300 uppercase font-bold mt-1 tracking-widest">Disponíveis</p>
              </div>
            </div>

            {saldoMoedas < custoMoedasTotal && (
              <div className="mt-5 bg-red-50 px-4 py-2 rounded-full border border-red-100">
                <p className="text-[8px] font-black text-red-500 uppercase italic tracking-tighter">
                  Faltam {(custoMoedasTotal - saldoMoedas).toLocaleString()} moedas para este pedido
                </p>
              </div>
            )}
          </button>
        </div>
      </div>
      
      {/* ANIMAÇÃO DO GRADIENTE DOURADO */}
      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </main>
  );
}