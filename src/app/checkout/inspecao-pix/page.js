"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db } from "../../../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Tesseract from "tesseract.js";

export default function InspecaoPixPro() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");

  const [percentual, setPercentual] = useState(0);
  const [erro, setErro] = useState("");
  const [analise, setAnalise] = useState(null);
  const [valorEsperado, setValorEsperado] = useState(0);

  useEffect(() => {
    async function analisar() {
      if (!orderId) {
        setErro("Pedido inválido");
        return;
      }

      const imagem = localStorage.getItem("temp_pix_img");
      if (!imagem) {
        setErro("Nenhum comprovante enviado");
        return;
      }

      const snap = await getDoc(doc(db, "orders", orderId));
      if (!snap.exists()) {
        setErro("Pedido não encontrado");
        return;
      }

      const totalPedido = snap.data().valores?.total ?? 0;
      setValorEsperado(totalPedido);

      try {
        const result = await Tesseract.recognize(imagem, "por", {
          logger: m => {
            if (m.status === "recognizing text") {
              setPercentual(Math.floor(m.progress * 100));
            }
          }
        });

        const txt = result.data.text.toLowerCase();

        // 🔍 Lógica Robusta de Detecção de Valor (Corrige o erro de R$ 0,00)
        const regexValores = /(\d{1,3}(\.\d{3})*,\d{2})|(\d{1,3}(,\d{3})*\.\d{2})/g;
        let valoresEncontrados = [];
        let m;

        while ((m = regexValores.exec(txt)) !== null) {
          const valorLimpo = m[0].replace(/\./g, "").replace(",", ".");
          const num = parseFloat(valorLimpo);
          if (!isNaN(num)) valoresEncontrados.push(num);
        }

        const maiorValor = valoresEncontrados.length ? Math.max(...valoresEncontrados) : 0;

        setAnalise({
          temPalavras: txt.includes("pix") || txt.includes("pagamento") || txt.includes("comprovante") || txt.includes("enviada"),
          valorConfere: maiorValor >= (totalPedido - 0.05), // Margem de 5 centavos
          valorLido: maiorValor
        });
      } catch (e) {
        setErro("Erro ao analisar o comprovante");
      }
    }

    analisar();
  }, [orderId]);

  const finalizar = async () => {
    if (!analise) return;

    await updateDoc(doc(db, "orders", orderId), {
      status: "Pendente",
      validacaoIA: analise.temPalavras && analise.valorConfere ? "Aprovado" : "Alerta de Fraude",
      valorDetectadoIA: analise.valorLido,
      dataValidacaoIA: new Date().toISOString()
    });

    localStorage.removeItem("temp_pix_img");
    router.push(`/pedido-confirmado/${orderId}`);
  };

  if (erro) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center text-center p-10">
        <h1 className="text-xl font-black mb-4 uppercase">Ops!</h1>
        <p className="opacity-60 mb-8">{erro}</p>
        <button onClick={() => router.back()} className="bg-red-600 px-10 py-4 rounded-2xl font-black uppercase italic">Voltar</button>
      </main>
    );
  }

  if (!analise) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl font-black text-red-600 italic animate-pulse">{percentual}%</div>
          <p className="text-[10px] opacity-40 mt-4 uppercase tracking-[0.2em]">Perícia Digital em curso...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[40px] w-full max-w-sm space-y-8 shadow-2xl">
        <h1 className="text-sm font-black uppercase text-center italic tracking-widest text-red-600">Resultado da Perícia</h1>

        <div className="space-y-4">
            <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5">
                <span className="text-[10px] uppercase opacity-40">Status do Doc:</span>
                <span className={`text-[10px] font-black uppercase ${analise.temPalavras ? 'text-green-500' : 'text-yellow-500'}`}>
                    {analise.temPalavras ? "Autêntico" : "Dúbio"}
                </span>
            </div>
            
            <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5">
                <span className="text-[10px] uppercase opacity-40">Valor Lido:</span>
                <span className={`text-[10px] font-black uppercase ${analise.valorConfere ? 'text-green-500' : 'text-red-500'}`}>
                    R$ {analise.valorLido.toFixed(2)}
                </span>
            </div>

            <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5">
                <span className="text-[10px] uppercase opacity-40">Valor do Pedido:</span>
                <span className="text-[10px] font-black uppercase">R$ {valorEsperado.toFixed(2)}</span>
            </div>
        </div>

        <button
          onClick={finalizar}
          className={`w-full py-5 rounded-2xl font-black uppercase italic text-xs transition-all ${
            analise.valorConfere 
            ? "bg-red-600 shadow-lg shadow-red-900/40" 
            : "bg-zinc-800 opacity-50 cursor-not-allowed"
          }`}
        >
          {analise.valorConfere ? "LIBERAR PEDIDO ➔" : "VALOR INSUFICIENTE"}
        </button>
      </div>
    </main>
  );
}