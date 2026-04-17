"use client";

import { db } from "../lib/firebase";
import { doc, updateDoc, increment, addDoc, collection } from "firebase/firestore";

export default function ParceirosLocais({ parceiros = [], userProfile }) {
  
  // ==========================================
  // FUNÇÃO: REGISTRAR CLIQUE E RECOMPENSA
  // ==========================================
  const registrarCliqueProfissional = async (p) => {
    if (!userProfile) return alert("Faça login no Mogu Mogu para ganhar moedas!");

    // 1. Bloqueio de segurança no código (Evita cliques repetidos na mesma sessão)
    if (userProfile.cliquesEfetuados?.includes(p.id)) {
      return alert("Você já garantiu sua recompensa com este parceiro!");
    }

    try {
      // 2. Registrar o Log para Auditoria (Para seu repasse semanal)
      await addDoc(collection(db, "logs_cliques"), {
        userId: userProfile.uid,
        parceiroId: p.id,
        valorMoeda: p.recompensaMoedas || 1,
        dataClique: new Date().toISOString(),
        pago: false // Fica como pendente para conferência
      });

      // 3. Atualizar o Perfil do Usuário
      const userRef = doc(db, "users", userProfile.uid);
      await updateDoc(userRef, {
        // Adiciona o ID do parceiro à lista de bloqueio do usuário
        cliquesEfetuados: [...(userProfile.cliquesEfetuados || []), p.id],
        // Adiciona o valor ao saldo que será liberado depois
        saldoPendente: increment(p.recompensaMoedas || 1)
      });

      alert(`Sucesso! +${p.recompensaMoedas} moedas registradas. Seu saldo será liberado em breve!`);

    } catch (err) {
      console.error("Erro no processamento do clique:", err);
      alert("Erro ao registrar recompensa. Tente novamente.");
    }
  };

  // ==========================================
  // SISTEMA DE FILTRO E SUMIÇO DE ANÚNCIO
  // ==========================================
  const filtrados = parceiros.filter(p => {
    if (!userProfile) return true; // Se deslogado, mostra tudo

    // 1. SUMIÇO: Se o usuário já clicou, o anúncio sai da lista dele
    const jaClicou = userProfile.cliquesEfetuados?.includes(p.id);
    if (jaClicou) return false;

    // 2. SEGMENTAÇÃO: Filtro por Sexo/Público
    const sexoUser = userProfile.sexo?.toLowerCase() || "todos";
    const matchesSexo = p.publicoAlvo.includes(sexoUser) || p.publicoAlvo.includes("todos");

    // 3. SEGMENTAÇÃO: Match por Tags de Interesse (#saude, #beleza, etc)
    const userTags = userProfile.preferencias || [];
    const matchesTags = p.tagsInteresse.some(tag => userTags.includes(tag));

    // O anúncio aparece se bater o sexo OU se houver interesse nas tags
    return matchesSexo || matchesTags;
  });

  if (filtrados.length === 0) return null;

  return (
    <section className="mt-12 px-4 mb-10">
      {/* Cabeçalho da Seção */}
      <div className="flex items-center justify-between mb-5 px-1">
        <h2 className="text-[10px] font-black uppercase italic text-gray-800 tracking-widest">
          ⚡ Oportunidades <span className="text-green-600">em Guapiara</span>
        </h2>
        <div className="h-[1px] flex-1 bg-gray-100 mx-4"></div>
      </div>

      {/* Grid de Parceiros (Grupo Repetidor) */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6">
        {filtrados.map((p) => (
          <div 
            key={p.id}
            className="flex-shrink-0 w-40 bg-white rounded-[40px] p-5 border border-gray-100 shadow-sm flex flex-col items-center text-center transition-all active:scale-95"
          >
            {/* Logo com Selo de Moedas */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gray-50 p-1 mb-3 overflow-hidden border border-gray-100 shadow-inner">
                <img src={p.logo} className="w-full h-full object-cover rounded-full" alt={p.nome} />
              </div>
              <div className="absolute -top-1 -right-1 bg-yellow-400 text-white text-[9px] font-black px-2 py-1 rounded-full shadow-lg border-2 border-white animate-bounce">
                +{p.recompensaMoedas}🪙
              </div>
            </div>

            {/* Informações do Parceiro */}
            <h4 className="font-black text-[11px] text-gray-900 uppercase italic leading-tight truncate w-full">
              {p.nome}
            </h4>
            
            <p className="text-[8px] text-gray-400 font-bold mt-2 leading-tight line-clamp-3 h-9">
              {p.descricao}
            </p>

            {/* Botão de Ação (CPC) */}
            <a 
              href={p.linkZap}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => registrarCliqueProfissional(p)}
              className="mt-5 w-full py-4 bg-[#25D366] text-white rounded-[20px] text-[9px] font-black uppercase italic shadow-xl shadow-green-100 flex items-center justify-center gap-2 active:bg-green-600 transition-colors"
            >
              🟢 IR PRO ZAP
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}