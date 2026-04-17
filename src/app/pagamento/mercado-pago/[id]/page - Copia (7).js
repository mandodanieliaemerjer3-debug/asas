"use client";

import { useEffect, useState, Suspense } from "react";
import { initMercadoPago, CardPayment } from "@mercadopago/sdk-react";
import { db, auth } from "../../../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

initMercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY);

function CheckoutContent() {
  const params = useParams();
  const router = useRouter();

  const [valorTotal, setValorTotal] = useState(null);
  const [statusPagamento, setStatusPagamento] = useState(null);
  const [userReady, setUserReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const snap = await getDoc(doc(db, "orders", params.id));

        if (snap.exists()) {
          const total = snap.data()?.valores?.total;
          setValorTotal(
            total && !isNaN(total) ? Number(total) : 25
          );
        } else {
          setValorTotal(25);
        }
      } catch (e) {
        console.error("Erro ao buscar pedido:", e);
        setValorTotal(25);
      }

      setUserReady(true);
    });

    return () => unsubscribe();
  }, [params.id, router]);

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      orderId: params.id,
      transaction_amount: valorTotal,
      payer: {
        email: data.payer?.email,
        identification: {
          type: "CPF",
          number: data.payer?.identification?.number?.replace(/\D/g, ""),
        },
      },
    };

    try {
      const response = await fetch("/api/process_payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.status === "approved") {
        setStatusPagamento("aprovado");
        setTimeout(() => router.push("/"), 3000);
      } else if (result.status === "rejected") {
        setStatusPagamento("recusado");
      } else {
        setStatusPagamento("erro");
      }
    } catch (err) {
      console.error(err);
      setStatusPagamento("erro");
    }
  };

  if (!userReady || !valorTotal) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="p-4 max-w-md mx-auto bg-white min-h-screen">
      {statusPagamento === "aprovado" && (
        <div className="bg-green-500 text-white p-4 mb-4 text-center">
          Pagamento aprovado
        </div>
      )}

      {statusPagamento === "recusado" && (
        <div className="bg-red-500 text-white p-4 mb-4 text-center">
          Pagamento recusado
        </div>
      )}

      {statusPagamento === "erro" && (
        <div className="bg-yellow-500 p-4 mb-4 text-center">
          Erro ou pendente
        </div>
      )}

      <div className="mb-6 p-6 bg-yellow-400 text-center font-bold">
        TOTAL: R$ {valorTotal.toFixed(2)}
      </div>

      <CardPayment
        initialization={{ amount: valorTotal }}
        onSubmit={onSubmit}
      />
    </div>
  );
}

export default function PaginaPagamento() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}