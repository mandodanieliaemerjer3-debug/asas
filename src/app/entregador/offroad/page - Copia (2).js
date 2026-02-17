"use client";
import { useState, useEffect } from "react";
import { db } from "../../../lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "../../../contexts/AuthContext";

export default function PainelOffRoad() {
  const { user } = useAuth();
  const [pedidoDisponivel, setPedidoDisponivel] = useState(null);
  const [meuTrabalho, setMeuTrabalho] = useState(null);
  const [comboOportunidade, setComboOportunidade] = useState(null);

  useEffect(() => {
    if (!user) return;

    // 1. Monitora NOVAS RESERVAS (Status: Aguardando Entregador)
    const qBusca = query(
      collection(db, "orders"),
      where("endereco.nivelTerreno", "in", ["Off-Road Root", "Desbravador"]),
      where("status", "==", "Aguardando Entregador")
    );

    const unsubBusca = onSnapshot(qBusca, (snap) => {
      if (!snap.empty) setPedidoDisponivel({ id: snap.docs[0].id, ...snap.docs[0].data() });
      else setPedidoDisponivel(null);
    });

    // 2. Monitora meu TRABALHO ATIVO (Cozinha ou Rua)
    const qTrabalho = query(
      collection(db, "orders"),
      where("entregadorId", "==", user.uid),
      where("status", "in", ["Em Produção", "Pendente", "Em Rota"])
    );

    const unsubTrabalho = onSnapshot(qTrabalho, (snap) => {
      if (!snap.empty) setMeuTrabalho({ id: snap.docs[0].id, ...snap.docs[0].data() });
      else setMeuTrabalho(null);
    });

    return () => { unsubBusca(); unsubTrabalho(); };
  }, [user]);

  // 3. INTELIGÊNCIA DE LINHA (Busca Combo se você já está em rota)
  useEffect(() => {
    if (!meuTrabalho || !meuTrabalho.endereco.linhaId) return;

    const qCombo = query(
      collection(db, "orders"),
      where("endereco.linhaId", "==", meuTrabalho.endereco.linhaId),
      where("status", "==", "Aguardando Entregador")
    );

    const unsubCombo = onSnapshot(qCombo, (snap) => {
      const outro = snap.docs.find(d => d.id !== meuTrabalho.id);
      if (outro) setComboOportunidade({ id: outro.id, ...outro.data() });
      else setComboOportunidade(null);
    });

    return () => unsubCombo();
  }, [meuTrabalho]);

  return (
    <main className="min-h-screen bg-orange-50 p-4 font-sans pb-20">
      
      {/* ALERTA 1: PEDIDO PRONTO PARA COLETAR (Status: Pendente) */}
      {meuTrabalho?.status === "Pendente" && (
        <div className="mb-6 bg-green-600 p-6 rounded-[40px] shadow-2xl border-4 border-white animate-pulse">
          <p className="text-[10px] font-black text-white uppercase italic mb-1">🔥 PRONTO AGORA!</p>
          <h2 className="text-xl font-black text-white uppercase leading-none">VÁ BUSCAR NO RESTAURANTE</h2>
          <p className="text-[10px] text-white/80 mt-2 font-bold uppercase italic">O preparo terminou. O cliente está aguardando.</p>
          <button 
            onClick={() => updateDoc(doc(db, "orders", meuTrabalho.id), { status: "Em Rota" })}
            className="w-full bg-white text-green-600 py-4 rounded-2xl font-black uppercase mt-4 shadow-lg"
          >
            INICIAR DESLOCAMENTO 🏍️
          </button>
        </div>
      )}

      {/* ALERTA 2: NOVA RESERVA (Ainda não produziu) */}
      {pedidoDisponivel && !meuTrabalho && (
        <div className="bg-white border-4 border-orange-600 p-8 rounded-[40px] shadow-2xl mb-6">
           <p className="text-[10px] font-black text-red-600 uppercase italic mb-2">📍 NOVA RESERVA RURAL</p>
           <h2 className="text-2xl font-black uppercase mb-4 leading-none">{pedidoDisponivel.endereco.bairro}</h2>
           <p className="text-xs font-bold text-gray-400 mb-6 italic">Aceite para a cozinha começar a produzir.</p>
           <button 
             onClick={() => updateDoc(doc(db, "orders", pedidoDisponivel.id), { status: "Em Produção", entregadorId: user.uid, entregadorNome: user.displayName })}
             className="w-full bg-orange-600 text-white py-5 rounded-3xl font-black uppercase shadow-lg shadow-orange-200"
           >
              GARANTIR LOGÍSTICA 🚀
           </button>
        </div>
      )}

      {/* ALERTA 3: COMBO NA MESMA LINHA */}
      {meuTrabalho && comboOportunidade && (
        <div className="bg-blue-600 p-6 rounded-[40px] shadow-2xl border-4 border-white mb-6">
          <p className="text-[10px] font-black text-white uppercase italic mb-1">📦 COMBO NA LINHA {meuTrabalho.endereco.linhaId}</p>
          <h2 className="text-lg font-black text-white uppercase leading-none">{comboOportunidade.endereco.bairro}</h2>
          <button 
            onClick={() => updateDoc(doc(db, "orders", comboOportunidade.id), { status: "Em Produção", entregadorId: user.uid, entregadorNome: user.displayName })}
            className="w-full bg-white text-blue-600 py-4 rounded-2xl font-black uppercase mt-4"
          >
            ADICIONAR À CARGA +
          </button>
        </div>
      )}

      {/* MONITORAMENTO DO TRABALHO */}
      {meuTrabalho && (
        <div className="bg-black text-white p-8 rounded-[40px] shadow-2xl">
          <p className="text-orange-500 font-black text-[10px] uppercase italic mb-2">
            Status: {meuTrabalho.status === "Em Produção" ? "COZINHA PREPARANDO..." : meuTrabalho.status}
          </p>
          <h2 className="text-xl font-black uppercase mb-6 leading-tight">{meuTrabalho.endereco.rua}, {meuTrabalho.endereco.numero}</h2>
          
          {meuTrabalho.status === "Em Rota" && (
            <button 
              onClick={() => updateDoc(doc(db, "orders", meuTrabalho.id), { status: "Entregue" })}
              className="w-full bg-green-600 py-4 rounded-2xl font-black uppercase shadow-lg shadow-green-900"
            >
              FINALIZAR ENTREGA ✅
            </button>
          )}
        </div>
      )}

      {!pedidoDisponivel && !meuTrabalho && (
        <div className="py-20 text-center opacity-30 font-black uppercase italic text-orange-900 tracking-widest">
          🔍 Patrulhando Rotas Rurais...
        </div>
      )}
    </main>
  );
}