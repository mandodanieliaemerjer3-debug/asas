"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db } from "../../../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Tesseract from "tesseract.js";

export default function ProcessadorPix() {

  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");

  const [status, setStatus] = useState("Iniciando varredura digital...");
  const [percentual, setPercentual] = useState(0);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {

    async function processar() {

      if (!orderId) {
        setStatus("Pedido não informado.");
        return;
      }

      const snap = await getDoc(doc(db, "orders", orderId));

      if (!snap.exists()) {
        setStatus("Pedido não encontrado.");
        return;
      }

      const valorEsperado = snap.data()?.valores?.total;

      const imagemBase64 = localStorage.getItem("temp_pix_img");

      if (!imagemBase64) {
        setStatus("Nenhuma imagem de comprovante encontrada.");
        setResultado("Envie o comprovante antes de validar.");
        return;
      }

      try {

        setStatus("Escaneando comprovante...");

        const { data } = await Tesseract.recognize(
          imagemBase64,
          "por",
          {
            logger: m => {
              if (m.status === "recognizing text") {
                setPercentual(Math.floor(m.progress * 100));
              }
            },
            workerPath: "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js",
            corePath: "https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core.wasm.js"
          }
        );

        const texto = (data.text || "").toLowerCase();

        const temPix =
          texto.includes("pix") ||
          texto.includes("comprovante");

        let valorDetectado = false;

        if (valorEsperado) {
          const valor1 = valorEsperado.toFixed(2).replace(".", ",");
          const valor2 = valorEsperado.toFixed(2).replace(",", ".");
          valorDetectado =
            texto.includes(valor1) || texto.includes(valor2);
        }

        if (temPix && valorDetectado) {
          setResultado("Comprovante validado automaticamente.");
          await finalizarValidacao(orderId, true);
        } else {
          setResultado("Não foi possível validar automaticamente.");
        }

      } catch (err) {

        console.error(err);
        setStatus("Erro ao analisar o comprovante.");
        setResultado("Falha no OCR. Enviar para análise manual.");

      }

    }

    processar();

  }, [orderId]);


  async function finalizarValidacao(id, automatico) {

    await updateDoc(doc(db, "orders", id), {
      status: "Pendente",
      validacaoIA: automatico ? "Aprovado" : "Manual"
    });

    router.push(`/pedido-confirmado/${id}`);
  }

  return (
    <main className="min-h-screen bg-black text-white p-10 flex flex-col items-center justify-center font-sans">

      <div className="w-full max-w-sm text-center">

        <div className="relative w-40 h-40 mx-auto mb-10">

          <div className="absolute inset-0 border-4 border-red-600 rounded-full animate-ping opacity-20"></div>
          <div className="absolute inset-0 border-t-4 border-red-600 rounded-full animate-spin"></div>

          <div className="flex items-center justify-center h-full font-black text-2xl italic">
            {percentual}%
          </div>

        </div>

        <h1 className="text-xl font-black uppercase italic mb-4">
          {status}
        </h1>

        {resultado && (

          <div className="bg-zinc-900 p-6 rounded-[30px] border border-zinc-800">

            <p className="text-[11px] font-bold uppercase text-zinc-400 mb-5">
              {resultado}
            </p>

            <button
              onClick={() => finalizarValidacao(orderId, false)}
              className="bg-white text-black px-8 py-4 rounded-full font-black uppercase italic text-[11px]"
            >
              ENVIAR PARA ANÁLISE MANUAL →
            </button>

          </div>

        )}

      </div>

    </main>
  );
}
