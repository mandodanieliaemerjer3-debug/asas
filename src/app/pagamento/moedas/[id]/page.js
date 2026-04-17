"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../../lib/firebase";
import { doc, getDoc, updateDoc, increment, Timestamp } from "firebase/firestore";
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
    const carregarDados = async () => {
      const docSnap = await getDoc(doc(db, "orders", id));
      if (docSnap.exists()) {
        setPedido({ id: docSnap.id, ...docSnap.data() });
      } else {
        alert("Pedido não encontrado!");
        router.push("/");
      }
      setLoading(false);
    };
    carregarDados();
  }, [id, router]);

  // REGRA DE CONVERSÃO: 1 Real = 200 Moedas
  const moedasProdutos = pedido?.itens?.reduce((acc, item) => acc + (item.coinPrice || 0), 0) || 0;
  const freteEmMoedas = (pedido?.valores?.taxaEntrega || 0) * 200;
  const custoTotalMoedas = moedasProdutos + freteEmMoedas;

  const executarPagamento = async () => {
    if (!user || processando || !pedido) return;
    setProcessando(true);

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const saldoAtual = userSnap.data()?.moedas || 0;

      if (saldoAtual < custoTotalMoedas) {
        alert("Saldo de moedas insuficiente!");
        setProcessando(false);
        return;
      }

      // Identifica o ID do restaurante para o repasse
      const rId = pedido.restauranteId || pedido.restaurantId || pedido.lojaId;

      // 1. DÉBITO DO CLIENTE
      await updateDoc(userRef, { moedas: increment(-custoTotalMoedas) });

      // 2. CRÉDITO DO RESTAURANTE (Entra como saldo a abater na quitação)
      if (rId) {
        const restRef = doc(db, "restaurants", rId);
        await updateDoc(restRef, {
          moedasRecebidas: increment(custoTotalMoedas),
          totalVendasMoedas: increment(1)
        });
      }

      // 3. ATUALIZAÇÃO DO STATUS DO PEDIDO
      await updateDoc(doc(db, "orders", id), {
        status: "Aguardando Entregador",
        pago: true,
        metodoPagamento: "moedas",
        pagoEm: Timestamp.now(),
        valorMoedasDebitado: custoTotalMoedas
      });

      // 4. REDIRECIONAMENTO CORRIGIDO (Removido o /checkout para evitar Erro 404)
      window.location.href = `/agradecimento/${id}`;

    } catch (error) {
      console.error("Erro no pagamento:", error);
      alert("Houve um erro técnico. Verifique seu saldo.");
    } finally {
      setProcessando(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <p className="font-black italic animate-pulse text-amber-600 uppercase">Sincronizando Carteira...</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-zinc-50 p-6 flex flex-col items-center justify-center font-sans">
      <div className="bg-white p-10 rounded-[50px] shadow-2xl w-full max-w-sm text-center border border-zinc-100">
        <div className="text-4xl mb-4">🪙</div>
        <h2 className="font-black uppercase italic text-xl mb-2 tracking-tighter">Confirmar Pagamento</h2>
        <p className="text-[10px] font-bold text-zinc-400 uppercase mb-8 italic">O valor será transferido para a loja</p>
        
        <div className="bg-zinc-50 p-6 rounded-[35px] mb-8 border border-zinc-100">
           <p className="text-[8px] font-black uppercase opacity-30 mb-1 tracking-widest">Total em Moedas</p>
           <p className="text-5xl font-black italic text-amber-600 tracking-tighter">
             {custoTotalMoedas.toLocaleString()}
           </p>
        </div>

        <button 
          onClick={executarPagamento}
          disabled={processando}
          className={`w-full py-6 rounded-3xl font-black uppercase italic text-xs transition active:scale-95 shadow-xl ${processando ? 'bg-zinc-100 text-zinc-400' : 'bg-zinc-900 text-white'}`}
        >
          {processando ? "PROCESSANDO..." : "PAGAR AGORA ➔"}
        </button>

        <button onClick={() => router.back()} className="mt-6 text-[9px] font-black uppercase opacity-20 hover:opacity-100 transition">
          Cancelar e Voltar
        </button>
      </div>
    </main>
  );
}