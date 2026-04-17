"use client";

import { useEffect, useState, Suspense } from "react";
import { initMercadoPago, CardPayment } from "@mercadopago/sdk-react";
import { db } from "../../../../lib/firebase"; 
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";

initMercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY);

function CheckoutContent() {
  const params = useParams();
  const router = useRouter();
  const [valorTotal, setValorTotal] = useState(null);

  const [mostrarRelatorio, setMostrarRelatorio] = useState(false);
  const [textoRelatorio, setTextoRelatorio] = useState("");

  const [statusPagamento, setStatusPagamento] = useState(null); // 👈 NOVO

  useEffect(() => {
    async function carregar() {
      try {
        const snap = await getDoc(doc(db, "orders", params.id));

        if (snap.exists()) {
          const total = snap.data()?.valores?.total;

          if (!total || isNaN(Number(total))) {
            setValorTotal(25);
          } else {
            setValorTotal(Number(total));
          }
        } else {
          setValorTotal(25);
        }

      } catch (e) { 
        console.error("Erro Firebase:", e); 
        setValorTotal(25);
      }
    }

    carregar();
  }, [params.id]);

  const onSubmit = async (data) => {

    if (!valorTotal || isNaN(valorTotal)) {
      alert("Valor inválido.");
      return;
    }

    const payload = {
      ...data,
      transaction_amount: valorTotal,
      payer: {
        email: data.payer?.email,
        identification: {
          type: "CPF",
          number: data.payer?.identification?.number?.replace(/\D/g, "")
        }
      }
    };

    try {
      const response = await fetch("/api/process_payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      // RELATÓRIO
      const texto = `
STATUS: ${result.status || "NÃO VEIO"}
DETALHE: ${result.status_detail || "NÃO VEIO"}
`;
      setTextoRelatorio(texto);
      setMostrarRelatorio(true);

      // 👇 TRATAMENTO DE STATUS
      if (result.status === "approved") {
        setStatusPagamento("aprovado");

        await updateDoc(doc(db, "orders", params.id), { 
          pago: true, 
          status: "Pago" 
        });

        setTimeout(() => {
          router.push("/");
        }, 3000);

      } else if (result.status === "rejected") {
        setStatusPagamento("recusado");
      } else {
        setStatusPagamento("erro");
      }

    } catch (err) {
      setStatusPagamento("erro");
      setTextoRelatorio("Erro:\n" + err.message);
      setMostrarRelatorio(true);
    }
  };

  if (!valorTotal) {
    return <div className="p-20 text-center font-black">Carregando valor...</div>;
  }

  return (
    <div className="p-4 max-w-md mx-auto bg-white min-h-screen">

      {/* 💥 MENSAGEM DE STATUS */}
      {statusPagamento === "aprovado" && (
        <div className="bg-green-500 text-white p-4 rounded mb-4 text-center font-bold">
          ✅ Pagamento aprovado!
        </div>
      )}

      {statusPagamento === "recusado" && (
        <div className="bg-red-500 text-white p-4 rounded mb-4 text-center font-bold">
          ❌ Pagamento recusado
        </div>
      )}

      {statusPagamento === "erro" && (
        <div className="bg-yellow-500 text-black p-4 rounded mb-4 text-center font-bold">
          ⚠️ Erro no pagamento
        </div>
      )}

      <div className="mb-6 p-8 bg-yellow-400 rounded-[40px] font-black text-center shadow-lg text-black">
        TOTAL: R$ {valorTotal.toFixed(2)}
      </div>
      
      <CardPayment
        initialization={{ amount: valorTotal }}
        onSubmit={onSubmit}
        customization={{ visual: { hideFormTitle: true } }}
      />

      {mostrarRelatorio && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-xl w-[90%] max-w-lg shadow-xl">
            
            <h2 className="font-bold mb-2">Relatório</h2>

            <textarea
              value={textoRelatorio}
              readOnly
              className="w-full h-64 p-2 border rounded text-xs"
            />

            <button
              onClick={() => setMostrarRelatorio(false)}
              className="mt-3 bg-gray-800 text-white px-3 py-1 rounded"
            >
              Fechar
            </button>

          </div>
        </div>
      )}

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