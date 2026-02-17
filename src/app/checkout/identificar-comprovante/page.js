"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db } from "../../../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Tesseract from "tesseract.js"; // Precisará de: npm install tesseract.js

export default function ProcessadorPix() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");

  const [status, setStatus] = useState("Iniciando varredura digital...");
  const [percentual, setPercentual] = useState(0);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    async function processar() {
      if (!orderId) return;

      // 1. Busca o valor que o pedido DEVERIA ter
      const snap = await getDoc(doc(db, "orders", orderId));
      if (!snap.exists()) return setStatus("Pedido não encontrado.");
      const valorEsperado = snap.data().valores.total;

      // 2. Recupera a imagem temporária (salva no localStorage ou state)
      const imagemBase64 = localStorage.getItem("temp_pix_img");
      if (!imagemBase64) return setStatus("Imagem não detectada.");

      // 3. Inicia o "Cérebro" (OCR)
      Tesseract.recognize(imagemBase64, 'por', {
        logger: m => {
          if (m.status === 'recognizing text') setPercentual(Math.floor(m.progress * 100));
        }
      }).then(({ data: { text } }) => {
        const textoLimpo = text.toLowerCase();
        
        // 🔍 Lógica de Verificação de Segurança
        const temPalavraChave = textoLimpo.includes("comprovante") || textoLimpo.includes("pix");
        const valorDetectado = textoLimpo.includes(valorEsperado.toString().replace('.', ','));

        if (temPalavraChave && valorDetectado) {
          setResultado("Sucesso! Comprovante validado com IA.");
          // Destrava o pedido automaticamente se for 100% certeiro
          finalizarValidacao(orderId, true);
        } else {
          setResultado("Atenção: Algumas informações não foram lidas. Enviar para análise manual?");
        }
      });
    }
    processar();
  }, [orderId]);

  const finalizarValidacao = async (id, automatico) => {
    await updateDoc(doc(db, "orders", id), {
      status: "Pendente", // Agora o restaurante vê o pedido
      validacaoIA: automatico ? "Aprovado" : "Manual"
    });
    router.push(`/pedido-confirmado/${id}`);
  };

  return (
    <main className="min-h-screen bg-black text-white p-10 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-sm text-center">
        <div className="relative w-40 h-40 mx-auto mb-10">
           <div className="absolute inset-0 border-4 border-red-600 rounded-full animate-ping opacity-20"></div>
           <div className="absolute inset-0 border-t-4 border-red-600 rounded-full animate-spin"></div>
           <div className="flex items-center justify-center h-full font-black text-2xl italic">{percentual}%</div>
        </div>

        <h1 className="text-xl font-black uppercase italic mb-4">{status}</h1>
        {resultado && (
           <div className="bg-zinc-900 p-6 rounded-[30px] border border-zinc-800 animate-fade-in">
              <p className="text-[10px] font-bold uppercase text-zinc-500 mb-4">{resultado}</p>
              <button onClick={() => finalizarValidacao(orderId, false)} className="bg-white text-black px-8 py-4 rounded-full font-black uppercase italic text-[10px]">
                CONFIRMAR ENVIO MESMO ASSIM ➔
              </button>
           </div>
        )}
      </div>
    </main>
  );
}