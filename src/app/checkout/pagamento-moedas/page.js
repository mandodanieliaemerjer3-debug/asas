"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "../../../lib/firebase"; 
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { useAuth } from "../../../contexts/AuthContext";

export default function PagamentoComMoedas() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [pedido, setPedido] = useState(null);
  const [saldoMoedas, setSaldoMoedas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    async function carregarDados() {
      if (!user || !orderId) return;

      // 1. Busca o valor total do pedido em moedas
      // Aqui somamos o 'coinPrice' de cada item do seu JSON
      const orderRef = doc(db, "orders", orderId);
      const orderSnap = await getDoc(orderRef);

      // 2. Busca o saldo atual de moedas do usuário
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (orderSnap.exists() && userSnap.exists()) {
        const dadosPedido = orderSnap.data();
        
        // Calculamos o custo total em moedas somando os itens
        const custoMoedas = dadosPedido.itens.reduce((acc, i) => acc + (Number(i.coinPrice) || 0), 0);
        
        setPedido({ id: orderId, custoTotalMoedas: custoMoedas, ...dadosPedido });
        setSaldoMoedas(userSnap.data().moedas || 0);
      }
      setLoading(false);
    }
    carregarDados();
  }, [user, orderId]);

  const confirmarCompraComMoedas = async () => {
    if (saldoMoedas < pedido.custoTotalMoedas) {
      alert("Saldo de moedas insuficiente! 🪙");
      return;
    }

    setProcessando(true);
    try {
      // 1. Subtrai as moedas do usuário
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        moedas: increment(-pedido.custoTotalMoedas)
      });

      // 2. Atualiza o status do pedido para 'Pago com Moedas'
      const orderRef = doc(db, "orders", pedido.id);
      await updateDoc(orderRef, {
        status: "Pago - Preparando",
        formaPagamento: "Moedas do App",
        pagoComMoedas: true
      });

      alert("🎉 Compra realizada com sucesso usando suas moedas!");
      router.push(`/pedido-confirmado/${pedido.id}`);
    } catch (e) {
      alert("Erro ao processar moedas: " + e.message);
    } finally {
      setProcessando(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white italic font-black uppercase">Verificando Carteira...</div>;

  const podePagar = saldoMoedas >= pedido.custoTotalMoedas;

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-sm bg-white text-black p-10 rounded-[50px] text-center shadow-2xl">
        <h1 className="text-xl font-black uppercase italic mb-8 tracking-tighter">Pagamento em Moedas</h1>
        
        <div className="bg-zinc-100 p-8 rounded-[40px] mb-6">
            <p className="text-[8px] font-black opacity-30 uppercase mb-1">Custo do Pedido</p>
            <h2 className="text-4xl font-black italic text-red-600">{pedido.custoTotalMoedas} 🪙</h2>
        </div>

        <div className="bg-zinc-50 p-6 rounded-[35px] border-2 border-zinc-100 mb-8">
            <p className="text-[8px] font-black opacity-30 uppercase mb-1">Seu Saldo Atual</p>
            <h2 className={`text-2xl font-black italic ${podePagar ? 'text-emerald-600' : 'text-zinc-400'}`}>
                {saldoMoedas} 🪙
            </h2>
        </div>

        {podePagar ? (
            <button 
              onClick={confirmarCompraComMoedas}
              disabled={processando}
              className="w-full bg-black text-white py-6 rounded-[30px] font-black uppercase italic shadow-xl active:scale-95 transition"
            >
              {processando ? "PROCESSANDO..." : "CONFIRMAR PAGAMENTO ➔"}
            </button>
        ) : (
            <div className="text-center">
                <p className="text-[10px] font-black text-red-600 uppercase italic mb-4">Saldo Insuficiente</p>
                <button onClick={() => router.push("/")} className="text-[10px] font-black uppercase underline opacity-30">Voltar e escolher outra forma</button>
            </div>
        )}
      </div>
    </main>
  );
}