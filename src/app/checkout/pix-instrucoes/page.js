"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db } from "../../../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Tesseract from "tesseract.js"; //

export default function InspecaoPixPro() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");

  const [percentual, setPercentual] = useState(0);
  const [analise, setAnalise] = useState({ temPalavras: false, valorConfere: false, finalizado: false });

  useEffect(() => {
    async function analisar() {
      const imagem = localStorage.getItem("temp_pix_img");
      const snap = await getDoc(doc(db, "orders", orderId));
      if (!snap.exists()) return;
      
      const valorPedido = snap.data().valores.total; // Ex: 35.90

      Tesseract.recognize(imagem, 'por', {
        logger: m => m.status === 'recognizing text' && setPercentual(Math.floor(m.progress * 100))
      }).then(({ data: { text } }) => {
        const txt = text.toLowerCase();
        
        // 🔍 LÓGICA DE DETETIVE: Encontrar valores financeiros
        // Regex que procura R$ seguido de números, vírgulas ou pontos
        const regexValores = /r\$\s?(\d+[\d.,]*)/g;
        let matches = [];
        let m;
        while ((m = regexValores.exec(txt)) !== null) {
          // Converte o valor encontrado para número puro (ex: "126,41" -> 126.41)
          const num = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
          if (!isNaN(num)) matches.push(num);
        }

        // Pega o maior valor encontrado no papel
        const maiorValorNoPapel = matches.length > 0 ? Math.max(...matches) : 0;

        setAnalise({
          // Verifica se é um documento bancário
          temPalavras: txt.includes("comprovante") || txt.includes("pagamento") || txt.includes("pix") || txt.includes("santander"),
          // O maior valor lido deve ser MAIOR ou IGUAL ao valor do pedido
          valorConfere: maiorValorNoPapel >= valorPedido,
          finalizado: true,
          valorLido: maiorValorNoPapel
        });
      });
    }
    analisar();
  }, [orderId]);

  const finalizar = async () => {
    const v = analise.temPalavras && analise.valorConfere ? "Aprovado" : "Alerta de Fraude";
    await updateDoc(doc(db, "orders", orderId), {
      status: "Pendente",
      validacaoIA: v,
      valorDetectadoIA: analise.valorLido
    });
    router.push(`/pedido-confirmado/${orderId}`);
  };

  return (
    <main className="min-h-screen bg-black text-white p-10 flex flex-col items-center justify-center text-center font-sans">
      <h1 className="text-xl font-black italic uppercase mb-10 tracking-tighter">Perícia Digital Pix</h1>
      
      <div className="w-full max-w-xs bg-zinc-900 p-8 rounded-[40px] border border-white/5 shadow-2xl">
        {!analise.finalizado ? (
          <div className="animate-pulse">
            <div className="text-5xl font-black italic mb-4 text-red-600">{percentual}%</div>
            <p className="text-[9px] uppercase font-bold opacity-30">Escaneando padrões financeiros...</p>
          </div>
        ) : (
          <div className="space-y-6">
             <div className="text-left bg-black/50 p-6 rounded-3xl border border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] font-black uppercase opacity-40">Documento</span>
                  <span className={`text-[9px] font-black uppercase ${analise.temPalavras ? 'text-emerald-500' : 'text-red-500'}`}>
                    {analise.temPalavras ? "Identificado" : "Não Reconhecido"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[8px] font-black uppercase opacity-40">Valor Detectado</span>
                  <span className={`text-[9px] font-black uppercase ${analise.valorConfere ? 'text-emerald-500' : 'text-red-500'}`}>
                    {analise.valorConfere ? `R$ ${analise.valorLido.toFixed(2)}` : "Abaixo do Pedido"}
                  </span>
                </div>
             </div>
             
             <button onClick={finalizar} className="w-full bg-red-600 text-white py-6 rounded-3xl font-black uppercase italic text-xs shadow-xl active:scale-95 transition">
               LIBERAR PEDIDO ➔
             </button>
             <button onClick={() => router.back()} className="text-[10px] font-black uppercase opacity-20 underline">Tentar outra foto</button>
          </div>
        )}
      </div>
    </main>
  );
}