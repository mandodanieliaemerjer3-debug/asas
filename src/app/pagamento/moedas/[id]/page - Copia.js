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

  // Cálculos seguindo a sua regra: (Itens em Moedas) + (Frete em Real * 200)
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

      // 1. Desconta o saldo do usuário
      await updateDoc(userRef, {
        moedas: increment(-custoTotalMoedas)
      });

      // 2. Atualiza o pedido como Pago
      await updateDoc(doc(db, "orders", id), {
        status: "Pago - Em Preparo",
        formaPagamento: "Moedas Mogu",
        pagoComMoedas: true,
        valorMoedasGasto: custoTotalMoedas,
        pagoEm: new Date().toISOString()
      });

      router.push("/perfil");
    } catch (error) {
      console.error(error);
      alert("Erro ao processar moedas.");
      setProcessando(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-black animate-bounce italic">VALIDANDO SALDO...</div>;

  return (
    <main className="min-h-screen bg-gray-50 max-w-md mx-auto p-6 font-sans">
      <header className="text-center mb-8">
        <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-[32px] flex items-center justify-center text-4xl mx-auto mb-4 shadow-sm border-4 border-white">🪙</div>
        <h1 className="font-black italic uppercase text-2xl tracking-tighter text-gray-900">Pagamento Interno</h1>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Utilizando seu Saldo Mogu</p>
      </header>

      <section className="bg-white p-8 rounded-[40px] shadow-xl border border-gray-100 text-center relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 animate-gradient"></div>
        
        <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Total a descontar</p>
        <p className="text-5xl font-black text-orange-600 mb-2 italic tracking-tighter">
          {custoTotalMoedas.toLocaleString()}
        </p>
        <p className="text-[9px] font-black text-gray-300 uppercase mb-8">Moedas Correntes</p>

        <div className="space-y-4 pt-6 border-t border-gray-50">
           <div className="flex justify-between text-[11px] font-bold uppercase italic text-gray-500">
              <span>Itens do Pedido</span>
              <span>{moedasProdutos.toLocaleString()} 🪙</span>
           </div>
           <div className="flex justify-between text-[11px] font-bold uppercase italic text-gray-500">
              <span>Logística (Frete x200)</span>
              <span>{freteEmMoedas.toLocaleString()} 🪙</span>
           </div>
        </div>

        <button 
          onClick={confirmarPagamentoMoedas}
          disabled={processando}
          className="w-full mt-10 bg-black text-white py-5 rounded-[28px] font-black uppercase italic shadow-2xl active:scale-95 transition disabled:bg-gray-400"
        >
          {processando ? "Processando..." : "Confirmar e Descontar"}
        </button>
      </section>

      <p className="mt-8 text-[9px] text-center font-bold text-gray-400 px-10 uppercase leading-tight italic">
        Ao confirmar, o valor será subtraído permanentemente do seu saldo e o restaurante será notificado.
      </p>

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