"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

export default function PreLogisticaAutomatico() {
  const router = useRouter();
  const [etapa, setEtapa] = useState("Iniciando balança digital...");
  const [progresso, setProgresso] = useState(0);

  useEffect(() => {
    const processarCerebroLogistico = async () => {
      // 1. Recupera o que foi pesado na Fase 1
      const preDados = JSON.parse(localStorage.getItem("pre_checkout") || "{}");
      const carrinho = JSON.parse(localStorage.getItem("carrinho") || "[]");

      if (!preDados.bairro || !carrinho.length) {
        router.push("/checkout");
        return;
      }

      // ⚖️ ESTÁGIO A: Validação de Peso (Local)
      setEtapa("Calculando centro de massa da carga...");
      setProgresso(33);
      await new Promise(r => setTimeout(r, 1200)); // UX: Tempo para leitura do user

      // 📡 ESTÁGIO B: Radar de Linhas (Firebase)
      setEtapa("Buscando combo de linha disponível...");
      setProgresso(66);

      const idLinha = String(preDados.bairro.linhaId || preDados.bairro.linhald || "");
      let freteFinal = 43; // Valor cheio padrão (40 linha + 3 bairro)

      if (idLinha) {
        const hoje = new Date().toISOString().split('T')[0];
        const q = query(
          collection(db, "orders"),
          where("endereco.linhaId", "==", idLinha),
          where("status", "in", ["Aguardando Entregador", "Aguardando Restaurante"]),
          where("criadoEm", ">=", hoje)
        );

        const snap = await getDocs(q);
        const pedidosNaLinha = snap.size;
        
        // 🛡️ TRAVA DE SEGURANÇA: Limite de 5 pedidos por viagem
        if (pedidosNaLinha < 5) {
          freteFinal = (40 / (pedidosNaLinha + 1)) + 3;
          setEtapa(`Combo encontrado! Rateio para ${pedidosNaLinha + 1} pessoas.`);
        } else {
          setEtapa("Linha anterior lotada. Iniciando nova rota elite...");
        }
      }

      // 🏁 ESTÁGIO C: Conclusão e Redirecionamento
      setProgresso(100);
      
      // Salva o frete final calculado para a tela de pagamento
      localStorage.setItem("logistica_final", JSON.stringify({
        taxaEntrega: freteFinal,
        pesoTotal: preDados.pontosCarga,
        bairro: preDados.bairro,
        rua: preDados.rua,
        numero: preDados.numero
      }));

      await new Promise(r => setTimeout(r, 1000));
      router.push("/checkout/pagamento"); // Vai para a Fase 3
    };

    processarCerebroLogistico();
  }, [router]);

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-10 font-sans text-white">
      <div className="w-full max-w-sm text-center">
        <h2 className="text-3xl font-black uppercase italic mb-2 tracking-tighter">Logística</h2>
        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-12">Processamento de Carga Elite</p>
        
        {/* BARRA DE PROGRESSO UX */}
        <div className="relative w-full bg-zinc-900 h-2 rounded-full overflow-hidden mb-6">
          <div 
            className="absolute top-0 left-0 bg-red-600 h-full transition-all duration-700 ease-in-out shadow-[0_0_15px_rgba(220,38,38,0.5)]"
            style={{ width: `${progresso}%` }}
          ></div>
        </div>

        <p className="text-[10px] font-black uppercase italic text-white animate-pulse">
          {etapa}
        </p>

        <div className="mt-24 border-t border-zinc-900 pt-6">
          <p className="text-[7px] font-black text-zinc-700 uppercase leading-relaxed tracking-widest">
            Sistema de Rateio Inteligente <br/> 
            Limite: 5 pedidos por Linha <br/>
            Carga Máxima: 25 Pontos/Operador
          </p>
        </div>
      </div>
    </main>
  );
}