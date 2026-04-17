"use client";
import { useEffect, useState, Suspense } from "react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { db } from "../../../../lib/firebase"; 
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";

// CHAVE DE TESTE (Verifique se está correta no seu .env.local)
initMercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY);

function CheckoutContent() {
  const params = useParams();
  const pedidoId = params.id; 
  const router = useRouter();
  
  const [valorTotal, setValorTotal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarDados() {
      if (!pedidoId) return;
      try {
        const docRef = doc(db, "orders", pedidoId);
        const snap = await getDoc(docRef);
        
        if (snap.exists()) {
          // Garante que estamos pegando um número
          setValorTotal(Number(snap.data().total));
        } else {
          console.error("Pedido não encontrado no banco!");
        }
      } catch (error) {
        console.error("Erro ao carregar pedido:", error);
      } finally {
        setLoading(false);
      }
    }
    carregarDados();
  }, [pedidoId]);

  const onSubmit = async ({ formData }) => {
    try {
      const response = await fetch("/api/process_payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          transaction_amount: valorTotal,
          description: `Mogu Mogu - Pedido #${pedidoId}`,
        }),
      });

      const result = await response.json();

      if (result.status === 'approved') {
        await updateDoc(doc(db, "orders", pedidoId), { status: "pago" });
        alert("Pagamento Aprovado! O Mogu Mogu já recebeu seu pedido. 🍔");
        router.push(`/`); 
      } else {
        alert("O pagamento não foi aprovado. Verifique os dados do cartão de teste.");
      }
    } catch (error) {
      console.error("Erro no processamento:", error);
      alert("Erro ao conectar com o servidor de pagamento.");
    }
  };

  // 1. TRAVA DE SEGURANÇA: Enquanto carrega ou se o valor for nulo, não mostra o .toFixed
  if (loading || valorTotal === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="font-black uppercase italic animate-pulse">Buscando Pedido...</div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto min-h-screen bg-white">
      <h1 className="font-black uppercase italic mb-6 text-xl">Finalizar Compra</h1>
      
      <div className="mb-6 p-6 bg-yellow-400 rounded-[35px] shadow-lg text-black">
        <h1 className="font-black uppercase italic text-[10px] opacity-60">Total a Pagar</h1>
        <p className="text-4xl font-black">
          R$ {valorTotal.toFixed(2)}
        </p>
      </div>

      {/* Só renderiza o Payment se o valorTotal existir */}
      <Payment
        initialization={{ amount: valorTotal }}
        customization={{
          paymentMethods: {
            creditCard: "all",
            debitCard: "all",
            bankTransfer: "all", 
          },
        }}
        onSubmit={onSubmit}
      />
    </div>
  );
}

export default function PaginaPagamento() {
  return (
    <Suspense fallback={<div className="p-20 text-center font-black">CARREGANDO...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}