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
        
        // 🔍 REGEX DE ALTA PRECISÃO (Sua ideia + Trava de Segurança)
        // Grupo 1: Formato R$ 10,00 ou 10.00
        // Grupo 2: Números inteiros isolados de 1 a 4 dígitos (ex: o "10" no topo)
        const regexDinheiro = /(?:r\$\s*)?(\d{1,4}(?:[.,]\d{2}))|\b(\d{1,4})\b/g;
        let valoresEncontrados = [];
        let m;

        while ((m = regexDinheiro.exec(txt)) !== null) {
          const valorBruto = m[1] || m[2];
          const valorLimpo = valorBruto.replace(",", ".");
          const num = parseFloat(valorLimpo);

          // 🛡️ FILTRO ANTI-FRAUDE/ID:
          // Ignora qualquer número que seja 10 vezes maior que o pedido (ex: CPFs ou IDs de transação)
          if (!isNaN(num) && num > 0 && num < (totalPedido * 10)) {
            valoresEncontrados.push(num);
          }
        }

        // 🎯 SELEÇÃO POR PROXIMIDADE:
        // Escolhe o valor que mais se aproxima do valor do pedido no banco de dados
        const valorDetectado = valoresEncontrados.length 
          ? valoresEncontrados.reduce((prev, curr) => 
              Math.abs(curr - totalPedido) < Math.abs(prev - totalPedido) ? curr : prev)
          : 0;

        setAnalise({
          temPalavras: txt.includes("comprovante") || txt.includes("pix") || txt.includes("mercado") || txt.includes("pago"),
          valorLido: valorDetectado,
          valorConfere: valorDetectado >= (totalPedido - 0.10), // Margem de 10 centavos
          diferenca: valorDetectado - totalPedido
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
      balancoFinal: analise.diferenca.toFixed(2)
    });
    localStorage.removeItem("temp_pix_img");
    router.push(`/pedido-confirmado/${orderId}`);
  };

  if (erro) return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-10 text-center">
      <p className="opacity-40 mb-5 uppercase text-[10px] tracking-widest">{erro}</p>
      <button onClick={() => router.back()} className="bg-red-600 px-10 py-4 rounded-2xl font-black uppercase italic">Voltar</button>
    </main>
  );

  if (!analise) return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-7xl font-black italic text-red-600 animate-pulse">{percentual}%</div>
        <p className="text-[10px] opacity-30 mt-4 uppercase tracking-[0.4em]">Mestre Mogu AI Lendo...</p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-black text-white p-8 flex items-center justify-center font-sans">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[40px] w-full max-w-sm space-y-8 shadow-2xl">
        <div className="text-center space-y-2">
          <h1 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600">Resultado da Perícia</h1>
          <p className="text-2xl font-black italic uppercase">Mestre Mogu AI</p>
        </div>

        <div className="bg-black/50 rounded-3xl p-6 border border-white/5 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[9px] uppercase opacity-40 italic">Valor do Pedido:</span>
            <span className="text-[10px] font-bold">R$ {valorEsperado.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center border-t border-white/5 pt-4">
            <span className="text-[9px] uppercase opacity-40 italic">Detectado pela IA:</span>
            <span className={`text-[10px] font-black ${analise.valorConfere ? 'text-green-500' : 'text-red-500'}`}>
              R$ {analise.valorLido.toFixed(2)}
            </span>
          </div>
        </div>

        <button
          onClick={finalizar}
          className={`w-full py-5 rounded-2xl font-black uppercase italic text-[11px] tracking-widest transition-all ${
            analise.valorConfere 
            ? "bg-red-600 shadow-lg shadow-red-900/40" 
            : "bg-zinc-800/50 text-zinc-600 cursor-not-allowed"
          }`}
        >
          {analise.valorConfere ? "LIBERAR PEDIDO ➔" : `VALOR INSUFICIENTE`}
        </button>
      </div>
    </main>
  );
}