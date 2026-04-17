"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

export default function PreLogisticaBlindada() {
  const router = useRouter();
  const [etapa, setEtapa] = useState("Iniciando balança digital...");
  const [progresso, setProgresso] = useState(0);

  useEffect(() => {
    const processarLogistica = async () => {
      try {
        const preDados = JSON.parse(localStorage.getItem("pre_checkout") || "{}");
        const carrinho = JSON.parse(localStorage.getItem("carrinho") || "[]");

        if (!preDados.bairro || !carrinho.length) {
          router.push("/checkout");
          return;
        }

        // ⚖️ ESTÁGIO A: PESAGEM (Garante que nunca seja nulo)
        setEtapa("Pesando itens do carrinho...");
        setProgresso(33);
        const pesoPedidoAtual = Number(preDados.pontosCarga) || 0;
        await new Promise(r => setTimeout(r, 1000));

        // 📡 ESTÁGIO B: RADAR DE LINHA (Proteção contra campos vazios)
        setEtapa("Analisando capacidade da Linha...");
        setProgresso(66);

        const idLinha = String(preDados.bairro.linhaId || preDados.bairro.linhald || "");
        let freteFinal = 43; // Padrão Off-Road Root

        if (idLinha) {
          const hoje = new Date().toISOString().split('T')[0];
          const linhaDocId = `${hoje}_linha_${idLinha}`;
          const linhaRef = doc(db, "linhas_do_dia", linhaDocId);
          const linhaSnap = await getDoc(linhaRef);

          if (linhaSnap.exists()) {
            const dadosLinha = linhaSnap.data();
            const pedidosAtivos = Number(dadosLinha.pedidosAtivos) || 0;
            const pesoAcumulado = Number(dadosLinha.pesoTotal) || 0;

            // 🛡️ TRAVA ELITE: Só entra na linha se couber no peso (Limite 25) e na fila (Limite 5)
            if (pedidosAtivos < 5 && (pesoAcumulado + pesoPedidoAtual) <= 25) {
              freteFinal = (40 / (pedidosAtivos + 1)) + 3;
              setEtapa(`Combo ativo! Fila: ${pedidosAtivos + 1} pessoas.`);
            } else {
              setEtapa("Linha cheia ou pesada. Criando nova rota...");
            }
          }
        }

        // 🏁 ESTÁGIO C: CONCLUSÃO
        setProgresso(100);
        localStorage.setItem("logistica_final", JSON.stringify({
          taxaEntrega: freteFinal,
          pesoTotal: pesoPedidoAtual,
          bairro: preDados.bairro,
          rua: preDados.rua,
          numero: preDados.numero
        }));

        await new Promise(r => setTimeout(r, 800));
        router.push("/checkout/pagamento");

      } catch (error) {
        console.error("Erro no Motor:", error);
        setEtapa("Erro técnico. Redirecionando para segurança...");
        router.push("/checkout");
      }
    };

    processarLogistica();
  }, [router]);

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-10 font-sans text-white">
      <div className="w-full max-w-sm text-center">
        <h2 className="text-3xl font-black uppercase italic mb-2">Logística</h2>
        <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden mb-6 mt-10">
          <div 
            className="bg-red-600 h-full transition-all duration-700 shadow-[0_0_15px_#dc2626]"
            style={{ width: `${progresso}%` }}
          ></div>
        </div>
        <p className="text-[10px] font-black uppercase italic animate-pulse">{etapa}</p>
      </div>
    </main>
  );
}