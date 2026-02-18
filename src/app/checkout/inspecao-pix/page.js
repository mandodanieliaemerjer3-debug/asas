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

        // 🔍 LÓGICA REFORÇADA (Sua ideia):
        // 1. Procura "r$" seguido de espaços opcionais \s*
        // 2. Captura apenas números no formato de moeda (ex: 10,00 ou 1.250,50)
        // 3. Limita a detecção para evitar IDs de transação gigantes
        const regexValores = /r\$\s?(\d{1,3}(\.\d{3})*,\d{2})/g;
        let valoresEncontrados = [];
        let m;

        while ((m = regexValores.exec(txt)) !== null) {
          const valorLimpo = m[1].replace(/\./g, "").replace(",", ".");
          const num = parseFloat(valorLimpo);
          if (!isNaN(num)) valoresEncontrados.push(num);
        }

        // Se encontrar vários valores, pegamos o que mais se aproxima do pedido
        const valorDetectado = valoresEncontrados.length 
          ? valoresEncontrados.reduce((prev, curr) => 
              Math.abs(curr - totalPedido) < Math.abs(prev - totalPedido) ? curr : prev)
          : 0;

        setAnalise({
          temPalavras: txt.includes("comprovante") || txt.includes("pix") || txt.includes("pago"),
          valorLido: valorDetectado,
          // Verifica se o valor é suficiente ou se o cliente pagou a mais
          valorConfere: valorDetectado >= (totalPedido - 0.05), 
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
      valorRealLido: analise.valorLido,
      balancoPagamento: analise.diferenca >= 0 ? "Completo/Maior" : "Incompleto"
    });

    localStorage.removeItem("temp_pix_img");
    router.push(`/pedido-confirmado/${orderId}`);
  };

  if (erro) return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-10">
      <p className="opacity-50 mb-5 uppercase text-[10px] tracking-widest">{erro}</p>
      <button onClick={() => router.back()} className="bg-zinc-900 border border-zinc-800 px-8 py-3 rounded-2xl text-[10px] font-black uppercase">Voltar</button>
    </main>
  );

  if (!analise) return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl font-black italic text-red-600 animate-pulse">{percentual}%</div>
        <p className="text-[10px] opacity-30 mt-4 uppercase tracking-[0.3em]">Varredura Digital...</p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-black text-white p-8 flex items-center justify-center font-sans">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[40px] w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600">Resultado da Perícia</h1>
          <p className="text-2xl font-black italic uppercase">Mestre Mogu AI</p>
        </div>

        <div className="bg-black/50 rounded-3xl p-6 border border-white/5 space-y-4">
          <div className="flex justify-between">
            <span className="text-[9px] uppercase opacity-40">Valor do Pedido:</span>
            <span className="text-[10px] font-bold">R$ {valorEsperado.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-white/5 pt-4">
            <span className="text-[9px] uppercase opacity-40">Detectado pela IA:</span>
            <span className={`text-[10px] font-black ${analise.valorConfere ? 'text-green-500' : 'text-red-500'}`}>
              R$ {analise.valorLido.toFixed(2)}
            </span>
          </div>
        </div>

        {analise.valorConfere ? (
          <div className="text-center py-2 bg-green-500/10 rounded-xl border border-green-500/20">
             <p className="text-[9px] font-bold text-green-500 uppercase">
               {analise.diferenca > 0 ? `+ R$ ${analise.diferenca.toFixed(2)} detectados` : "Valor Exato Identificado"}
             </p>
          </div>
        ) : (
          <div className="text-center py-2 bg-red-500/10 rounded-xl border border-red-500/20">
             <p className="text-[9px] font-bold text-red-500 uppercase">Faltam R$ {Math.abs(analise.diferenca).toFixed(2)}</p>
          </div>
        )}

        <button
          onClick={finalizar}
          className={`w-full py-5 rounded-2xl font-black uppercase italic text-[10px] tracking-widest transition-all ${
            analise.valorConfere 
            ? "bg-red-600 shadow-lg shadow-red-900/40" 
            : "bg-zinc-800 opacity-50 cursor-not-allowed"
          }`}
        >
          {analise.valorConfere ? "LIBERAR PEDIDO ➔" : "AGUARDANDO VALOR CORRETO"}
        </button>
      </div>
    </main>
  );
}