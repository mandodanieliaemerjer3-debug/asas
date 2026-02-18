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
      if (!orderId) return setErro("Pedido inválido");

      const imagem = localStorage.getItem("temp_pix_img");
      if (!imagem) return setErro("Nenhum comprovante enviado");

      const snap = await getDoc(doc(db, "orders", orderId));
      if (!snap.exists()) return setErro("Pedido não encontrado");

      const totalPedido = snap.data().valores?.total ?? 0;
      setValorEsperado(totalPedido);

      try {
        const result = await Tesseract.recognize(imagem, "por", {
          logger: m => {
            if (m.status === "recognizing text") setPercentual(Math.floor(m.progress * 100));
          }
        });

        // 📝 RELATÓRIO DE TEXTO BRUTO
        const textoBruto = result.data.text.toLowerCase().replace(/\s+/g, ' '); 
        
        // 🔍 BUSCA POR CONJUNTO (Símbolo + Valor)
        // Detecta: "r$ 10", "r$10", "$ 10", "r$ 10,00"
        const regexConjunto = /(?:r|s)?\$\s?(\d{1,4}(?:[.,]\d{2})?)|\b(\d{1,4})\b/g;
        let achados = [];
        let m;

        while ((m = regexConjunto.exec(textoBruto)) !== null) {
          const valorString = m[1] || m[2];
          const valorNum = parseFloat(valorString.replace(",", "."));
          
          // Se o número foi achado logo após um símbolo ou palavra "valor", ganha prioridade
          const contexto = textoBruto.substring(m.index - 10, m.index + 10);
          const temContextoMoeda = contexto.includes("$") || contexto.includes("r$") || contexto.includes("valor");

          if (!isNaN(valorNum) && valorNum > 0) {
            achados.push({ valor: valorNum, prioridade: temContextoMoeda ? 2 : 1 });
          }
        }

        // 🎯 SELEÇÃO INTELIGENTE
        // Filtramos apenas valores que não sejam absurdamente maiores que o pedido (Trava de 10x)
        const validos = achados.filter(a => a.valor < (totalPedido * 10));
        
        // Escolhemos o de maior prioridade que seja mais próximo do pedido
        const final = validos.sort((a, b) => {
          if (b.prioridade !== a.prioridade) return b.prioridade - a.prioridade;
          return Math.abs(a.valor - totalPedido) - Math.abs(b.valor - totalPedido);
        })[0];

        const valorFinal = final ? final.valor : 0;

        setAnalise({
          textoDetectado: textoBruto,
          valorLido: valorFinal,
          valorConfere: valorFinal >= (totalPedido - 0.10),
          diferenca: valorFinal - totalPedido
        });

      } catch (e) {
        setErro("Erro na leitura óptica");
      }
    }
    analisar();
  }, [orderId]);

  const finalizar = async () => {
    if (!analise) return;
    await updateDoc(doc(db, "orders", orderId), {
      status: "Pendente",
      validacaoIA: analise.valorConfere ? "Aprovado" : "Analise Manual",
      detalhesIA: `Texto Lido: ${analise.textoDetectado.substring(0, 100)}...`
    });
    localStorage.removeItem("temp_pix_img");
    router.push(`/pedido-confirmado/${orderId}`);
  };

  if (!analise) return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-7xl font-black italic text-red-600">{percentual}%</div>
        <p className="text-[10px] opacity-30 mt-4 uppercase">Mestre Mogu AI Escaneando...</p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-black text-white p-8 flex items-center justify-center font-sans">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[40px] w-full max-w-sm space-y-8">
        <h1 className="text-[10px] font-black uppercase text-center text-red-600">Perícia Concluída</h1>
        
        <div className="bg-black/50 rounded-3xl p-6 border border-white/5 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[9px] uppercase opacity-40 italic">Valor do Pedido:</span>
            <span className="text-[10px] font-bold text-white">R$ {valorEsperado.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center border-t border-white/5 pt-4">
            <span className="text-[9px] uppercase opacity-40 italic">IA Identificou:</span>
            <span className={`text-[10px] font-black ${analise.valorConfere ? 'text-green-500' : 'text-red-500'}`}>
              R$ {analise.valorLido.toFixed(2)}
            </span>
          </div>
        </div>

        <button
          onClick={finalizar}
          className={`w-full py-5 rounded-2xl font-black uppercase italic text-[11px] transition-all ${
            analise.valorConfere ? "bg-red-600" : "bg-zinc-800 opacity-50 cursor-not-allowed"
          }`}
        >
          {analise.valorConfere ? "LIBERAR PEDIDO ➔" : "VALOR INSUFICIENTE"}
        </button>
      </div>
    </main>
  );
}