"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../../lib/firebase";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { useAuth } from "../../../../contexts/AuthContext";

export default function PagamentoMoedasPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();

  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchPedido = async () => {
      const docSnap = await getDoc(doc(db, "orders", id));
      if (docSnap.exists()) setPedido(docSnap.data());
      setLoading(false);
    };
    fetchPedido();
  }, [id]);

  const moedasProdutos = pedido?.itens?.reduce((acc, item) => acc + (item.coinPrice || 0), 0) || 0;
  const freteEmMoedas = (pedido?.valores?.taxaEntrega || 0) * 200;
  const custoTotalMoedas = moedasProdutos + freteEmMoedas;

  const confirmarPagamentoMoedas = async () => {
    if (!user || processando) return;
    setProcessando(true);

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const saldoAtual = userSnap.data()?.moedas || 0;

      if (saldoAtual < custoTotalMoedas) {
        alert("Saldo insuficiente!");
        setProcessando(false);
        return;
      }

      await updateDoc(userRef, { moedas: increment(-custoTotalMoedas) });
      await updateDoc(doc(db, "orders", id), {
        status: "Pago - Em Preparo",
        formaPagamento: "Moedas Mogu",
        pagoComMoedas: true,
        valorMoedasGasto: custoTotalMoedas,
        pagoEm: new Date().toISOString()
      });

      // REDIRECIONAMENTO CORRIGIDO PARA AGRADECIMENTO
      router.push(`/agradecimento/${id}`);
    } catch (error) {
      alert("Erro ao processar moedas.");
      setProcessando(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-black animate-bounce italic uppercase tracking-widest">Calculando Saldo...</div>;

  return (
    <main className="min-h-screen bg-gray-50 max-w-md mx-auto p-6 font-sans flex flex-col items-center justify-center">
      <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-[32px] flex items-center justify-center text-4xl mb-4 border-4 border-white shadow-sm">🪙</div>
      <h1 className="font-black italic uppercase text-2xl tracking-tighter text-gray-900 leading-none">Confirmar Troca</h1>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2 mb-8">Pagamento com Moedas Mogu</p>

      <section className="w-full bg-white p-8 rounded-[40px] shadow-xl border border-gray-100 text-center">
        <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Total a descontar</p>
        <p className="text-5xl font-black text-orange-600 mb-8 italic tracking-tighter leading-none">{custoTotalMoedas.toLocaleString()}</p>
        
        <button 
          onClick={confirmarPagamentoMoedas} 
          disabled={processando} 
          className="w-full bg-black text-white py-5 rounded-[28px] font-black uppercase italic shadow-2xl active:scale-95 transition disabled:bg-gray-400 tracking-tighter"
        >
          {processando ? "PROCESSANDO..." : "CONFIRMAR PAGAMENTO"}
        </button>
      </section>
    </main>
  );
}