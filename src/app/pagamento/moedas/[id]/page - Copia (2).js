"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../../lib/firebase";
import { doc, getDoc, updateDoc, increment, Timestamp, setDoc } from "firebase/firestore";
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
      }
      setLoading(false);
    };
    carregarDados();
  }, [id]);

  // Regra: 1 Real = 200 Moedas
  const moedasProdutos = pedido?.itens?.reduce((acc, item) => acc + (item.coinPrice || 0), 0) || 0;
  const freteEmMoedas = (pedido?.valores?.taxaEntrega || 0) * 200;
  const custoTotalMoedas = moedasProdutos + freteEmMoedas;

  const executarPagamento = async () => {
    if (!user || processando || !pedido) return;
    setProcessando(true);

    try {
      // 1. Validar saldo do cliente
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const saldoAtual = userSnap.data()?.moedas || 0;

      if (saldoAtual < custoTotalMoedas) {
        alert("Saldo de moedas insuficiente para esta compra!");
        setProcessando(false);
        return;
      }

      // 2. Operação de Débito e Crédito (Execução em lote manual)
      
      // Debita do Cliente
      await updateDoc(userRef, { 
        moedas: increment(-custoTotalMoedas) 
      });

      // Credita no Restaurante (Usa o ID que está no pedido)
      if (pedido.restauranteId) {
        const restRef = doc(db, "restaurants", pedido.restauranteId);
        // Usamos setDoc com merge para garantir que o campo seja criado se não existir
        await updateDoc(restRef, {
          moedasRecebidas: increment(custoTotalMoedas),
          totalVendasMoedas: increment(1)
        });
      }

      // 3. Finaliza o Pedido e Redireciona
      await updateDoc(doc(db, "orders", id), {
        status: "Aguardando Entregador",
        pago: true,
        metodoPagamento: "moedas",
        pagoEm: Timestamp.now(),
        valorMoedasDebitado: custoTotalMoedas
      });

      // FORÇA O REDIRECIONAMENTO
      router.replace(`/checkout/agradecimento/${id}`);

    } catch (error) {
      console.error("Erro Crítico no Pagamento:", error);
      alert("Erro ao processar moedas. Verifique sua conexão.");
    } finally {
      setProcessando(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black italic animate-pulse">VALIDANDO CARTEIRA...</div>;

  return (
    <main className="min-h-screen bg-zinc-50 p-6 flex flex-col items-center justify-center font-sans">
      <div className="bg-white p-10 rounded-[50px] shadow-2xl w-full max-w-sm text-center border border-zinc-100">
        <div className="text-4xl mb-4">🪙</div>
        <h2 className="font-black uppercase italic text-xl mb-2">Confirmar Troca</h2>
        <p className="text-[10px] font-bold text-zinc-400 uppercase mb-8">O valor será transferido para a loja</p>
        
        <div className="bg-zinc-50 p-6 rounded-[35px] mb-8">
           <p className="text-[8px] font-black uppercase opacity-30 mb-1">Custo Total</p>
           <p className="text-4xl font-black italic text-amber-600">{custoTotalMoedas.toLocaleString()} <span className="text-xs">moedas</span></p>
        </div>

        <button 
          onClick={executarPagamento}
          disabled={processando}
          className={`w-full py-6 rounded-3xl font-black uppercase italic text-xs transition ${processando ? 'bg-zinc-100 text-zinc-400' : 'bg-zinc-900 text-white shadow-xl'}`}
        >
          {processando ? "GRAVANDO NO BANCO..." : "PAGAR AGORA ➔"}
        </button>
      </div>
    </main>
  );
}