"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { db } from "../../../lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

import Tesseract from "tesseract.js";

export default function InspecaoAuditoria() {

  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");

  const [percentual, setPercentual] = useState(0);
  const [analiseConcluida, setAnaliseConcluida] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function processar() {

      if (!orderId) return;

      try {

        const pedidoRef = doc(db, "orders", orderId);
        const pedidoSnap = await getDoc(pedidoRef);

        if (!pedidoSnap.exists()) {
          setErro("Pedido não encontrado.");
          return;
        }

        const dados = pedidoSnap.data();

        const urlImagem = dados.comprovantePixUrl;

        if (!urlImagem) {
          setErro("Comprovante ainda não enviado.");
          return;
        }

        // OCR direto da URL (sem base64 / sem localStorage)
        const result = await Tesseract.recognize(
          urlImagem,
          "por",
          {
            logger: m => {
              if (m.status === "recognizing text") {
                setPercentual(Math.floor(m.progress * 100));
              }
            }
          }
        );

        await updateDoc(pedidoRef, {
          status: "em_analise",
          auditoriaIA: {
            textoResumo: result.data.text
              .slice(0, 800)
              .toLowerCase(),
            dataProcessamento: serverTimestamp(),
            versaoAlgoritmo: "mogu_vision_v3"
          }
        });

        setAnaliseConcluida(true);

      } catch (e) {
        console.error(e);
        setErro("Falha ao processar auditoria.");
      }
    }

    processar();
  }, [orderId]);

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 font-sans">

      {erro && (
        <div className="text-center max-w-xs">
          <p className="text-red-500 font-bold mb-6">{erro}</p>
          <button
            onClick={() => router.back()}
            className="bg-zinc-800 px-6 py-3 rounded-xl font-bold"
          >
            Voltar
          </button>
        </div>
      )}

      {!erro && !analiseConcluida && (
        <div className="text-center">
          <div className="text-8xl font-black text-red-600 animate-pulse italic">
            {percentual}%
          </div>
          <p className="text-[10px] font-black opacity-40 mt-6 uppercase tracking-[4px]">
            Mogu Vision analisando...
          </p>
        </div>
      )}

      {!erro && analiseConcluida && (
        <div className="bg-zinc-900 p-10 rounded-[50px] w-full max-w-sm text-center border border-white/5 shadow-2xl">

          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/20">
            <span className="text-green-500 text-3xl font-black">✓</span>
          </div>

          <h1 className="text-2xl font-black uppercase italic mb-2 tracking-tighter">
            Registrado!
          </h1>

          <p className="text-[10px] font-bold opacity-30 mb-10 uppercase tracking-widest leading-relaxed">
            Seu comprovante foi enviado para auditoria.
            <br />
            Acompanhe o status no balcão.
          </p>

          <button
            onClick={() => router.push(`/pedido-confirmado/${orderId}`)}
            className="w-full bg-red-600 py-6 rounded-[30px] font-black uppercase italic text-xs tracking-[2px] shadow-xl shadow-red-900/40 active:scale-95 transition-all"
          >
            VER MEU PEDIDO ➔
          </button>

        </div>
      )}

    </main>
  );
}