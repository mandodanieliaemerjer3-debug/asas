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

  useEffect(() => {
    async function analisar() {
      if (!orderId) {
        setErro("Pedido inválido");
        return;
      }

      const imagem = localStorage.getItem("temp_pix_img");

      // 🚨 SEM IMAGEM = NÃO ANALISA
      if (!imagem) {
        setErro("Nenhum comprovante enviado");
        return;
      }

      const snap = await getDoc(doc(db, "orders", orderId));
      if (!snap.exists()) {
        setErro("Pedido não encontrado");
        return;
      }

      const valorPedido = snap.data().valores?.total ?? 0;

      try {
        const result = await Tesseract.recognize(imagem, "por", {
          logger: m => {
            if (m.status === "recognizing text") {
              setPercentual(Math.floor(m.progress * 100));
            }
          }
        });

        const txt = result.data.text.toLowerCase();

        const regexValores = /r\$\s?(\d+[\d.,]*)/g;
        let valores = [];
        let m;

        while ((m = regexValores.exec(txt)) !== null) {
          const num = parseFloat(
            m[1].replace(/\./g, "").replace(",", ".")
          );
          if (!isNaN(num)) valores.push(num);
        }

        const maiorValor = valores.length ? Math.max(...valores) : 0;

        setAnalise({
          temPalavras:
            txt.includes("pix") ||
            txt.includes("pagamento") ||
            txt.includes("comprovante"),
          valorConfere: maiorValor >= valorPedido,
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
      validacaoIA:
        analise.temPalavras && analise.valorConfere
          ? "Aprovado"
          : "Alerta de Fraude",
      valorDetectadoIA: analise.valorLido
    });

    localStorage.removeItem("temp_pix_img");
    router.push(`/pedido-confirmado/${orderId}`);
  };

  // 🔴 TELA DE ERRO
  if (erro) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center text-center p-10">
        <h1 className="text-xl font-black mb-4">PIX</h1>
        <p className="opacity-60 mb-8">{erro}</p>
        <button
          onClick={() => router.back()}
          className="bg-red-600 px-6 py-4 rounded-2xl font-bold"
        >
          Voltar
        </button>
      </main>
    );
  }

  // 🟡 CARREGANDO
  if (!analise) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl font-black text-red-600">{percentual}%</div>
          <p className="text-xs opacity-30 mt-2">
            Escaneando comprovante Pix...
          </p>
        </div>
      </main>
    );
  }

  // 🟢 RESULTADO
  return (
    <main className="min-h-screen bg-black text-white p-10 flex items-center justify-center">
      <div className="bg-zinc-900 p-8 rounded-3xl w-full max-w-sm space-y-6">
        <h1 className="text-lg font-black uppercase text-center">
          Perícia Digital Pix
        </h1>

        <div className="text-xs space-y-3">
          <div>
            Documento:{" "}
            <strong>
              {analise.temPalavras ? "Identificado" : "Não reconhecido"}
            </strong>
          </div>
          <div>
            Valor detectado:{" "}
            <strong>R$ {analise.valorLido.toFixed(2)}</strong>
          </div>
        </div>

        <button
          onClick={finalizar}
          className="w-full bg-red-600 py-4 rounded-2xl font-black"
        >
          LIBERAR PEDIDO
        </button>
      </div>
    </main>
  );
}
