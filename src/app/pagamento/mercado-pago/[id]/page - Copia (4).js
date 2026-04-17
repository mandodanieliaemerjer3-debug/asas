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

  useEffect(() => {
    async function carregar() {
      try {
        const snap = await getDoc(doc(db, "orders", params.id));

        if (snap.exists()) {
          const total = snap.data()?.valores?.total;

          if (!total || isNaN(Number(total))) {
            console.warn("⚠️ Valor inválido no Firebase, usando fallback");
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
      alert("Valor inválido. Recarregue a página.");
      return;
    }

    const payload = {
      ...data,
      transaction_amount: valorTotal,

      // ✅ USA OS DADOS DO FORMULÁRIO (CORRETO)
      payer: {
        email: data.payer?.email,
        identification: {
          type: "CPF",
          number: data.payer?.identification?.number?.replace(/\D/g, "")
        }
      }
    };

    console.log("📤 ENVIANDO FRONT:", payload);

    try {
      const response = await fetch("/api/process_payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      const texto = `
STATUS: ${result.status || "NÃO VEIO"}
DETALHE: ${result.status_detail || "NÃO VEIO"}
ERRO: ${result.erro_real || "NENHUM"}

DIAGNÓSTICO:
${(result.diagnostico || []).join("\n")}

ENVIADO:
${JSON.stringify(result.enviado, null, 2)}
      `;

      setTextoRelatorio(texto);
      setMostrarRelatorio(true);

      if (result.status === "approved") {
        await updateDoc(doc(db, "orders", params.id), { 
          pago: true, 
          status: "Pago" 
        });

        setTimeout(() => {
          router.push("/");
        }, 2000);
      }

    } catch (err) {
      setTextoRelatorio("Erro de conexão:\n" + err.message);
      setMostrarRelatorio(true);
    }
  };

  const copiarTexto = () => {
    navigator.clipboard.writeText(textoRelatorio);
    alert("Copiado!");
  };

  if (!valorTotal) {
    return <div className="p-20 text-center font-black">Carregando valor...</div>;
  }

  return (
    <div className="p-4 max-w-md mx-auto bg-white min-h-screen">
      
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
            
            <h2 className="font-bold mb-2">Relatório do Pagamento</h2>

            <textarea
              value={textoRelatorio}
              readOnly
              className="w-full h-64 p-2 border rounded text-xs"
            />

            <div className="flex gap-2 mt-3">
              <button
                onClick={copiarTexto}
                className="bg-green-500 text-white px-3 py-1 rounded"
              >
                Copiar
              </button>

              <button
                onClick={() => setMostrarRelatorio(false)}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                Fechar
              </button>
            </div>

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