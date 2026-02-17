"use client";
import { useState, useEffect } from "react";
import { db } from "../../../lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "../../../contexts/AuthContext";

export default function PainelOffRoadHibrido() {
  const { user } = useAuth();
  const [pedidoDisponivel, setPedidoDisponivel] = useState(null); // Oferta Rural
  const [meusTrabalhos, setMeusTrabalhos] = useState([]); // Lista de pedidos que peguei
  const [pedidosAsfalto, setPedidosAsfalto] = useState([]); // Pedidos da cidade

  useEffect(() => {
    if (!user) return;

    // 1. Monitora NOVAS RESERVAS RURAIS
    const qRural = query(
      collection(db, "orders"),
      where("endereco.nivelTerreno", "in", ["Off-Road Root", "Desbravador"]),
      where("status", "==", "Aguardando Entregador")
    );
    const unsubRural = onSnapshot(qRural, (snap) => {
      setPedidoDisponivel(!snap.empty ? { id: snap.docs[0].id, ...snap.docs[0].data() } : null);
    });

    // 2. Monitora TODOS os meus pedidos ativos (Rural e Urbano)
    const qTrabalho = query(
      collection(db, "orders"),
      where("entregadorId", "==", user.uid),
      where("status", "in", ["Em Produção", "Pendente", "Em Rota"])
    );
    const unsubTrabalho = onSnapshot(qTrabalho, (snap) => {
      setMeusTrabalhos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 3. Monitora Pedidos de Asfalto (Cidade)
    const qAsfalto = query(
      collection(db, "orders"),
      where("endereco.nivelTerreno", "==", "Asfalto Zero"),
      where("status", "==", "Pendente"),
      where("motoboyAtual", "==", null)
    );
    const unsubAsfalto = onSnapshot(qAsfalto, (snap) => {
      setPedidosAsfalto(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubRural(); unsubAsfalto(); unsubTrabalho(); };
  }, [user]);

  // Função para pegar asfalto (Permitido enquanto o Rural está "Em Produção")
  const pegarAsfalto = async (id) => {
    // Só bloqueia se você já estiver NA RUA entregando algo
    const ocupadoNaRua = meusTrabalhos.some(t => t.status === "Em Rota");
    if (ocupadoNaRua) return alert("Finalize sua entrega atual antes de pegar outra!");
    
    await updateDoc(doc(db, "orders", id), {
      status: "Em Rota",
      entregadorId: user.uid,
      entregadorNome: user.displayName || "Entregador"
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 font-sans pb-32">
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-xl font-black italic uppercase tracking-tighter">Painel Elite</h1>
        <span className="bg-orange-600 text-white text-[8px] px-3 py-1 rounded-full font-black uppercase">Off-Road Root</span>
      </header>

      {/* 1. OFERTA RURAL (RESERVA) */}
      {pedidoDisponivel && !meusTrabalhos.some(t => t.endereco.nivelTerreno !== "Asfalto Zero") && (
        <div className="bg-orange-600 p-6 rounded-[40px] shadow-2xl mb-8 animate-bounce text-white border-4 border-white">
           <p className="text-[10px] font-black uppercase italic mb-2">🚨 NOVA RESERVA RURAL</p>
           <h2 className="text-2xl font-black uppercase leading-none mb-4">{pedidoDisponivel.endereco.bairro}</h2>
           <button 
             onClick={() => updateDoc(doc(db, "orders", pedidoDisponivel.id), { status: "Em Produção", entregadorId: user.uid, entregadorNome: user.displayName })}
             className="w-full bg-white text-orange-600 py-5 rounded-3xl font-black uppercase shadow-lg"
           >
              ACEITAR E AVISAR LOJA 🚜
           </button>
        </div>
      )}

      {/* 2. MEUS TRABALHOS (GERENCIAMENTO DE ESTÁGIOS) */}
      <div className="space-y-4 mb-10">
        {meusTrabalhos.map(t => (
          <div key={t.id}>
            {/* ESTÁGIO: COZINHA PREPARANDO (Apenas Aviso) */}
            {t.status === "Em Produção" && (
              <div className="bg-white p-6 rounded-[35px] border-2 border-orange-100 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[9px] font-black text-orange-500 uppercase italic">🥪 Cozinha Preparando...</p>
                    <h3 className="text-lg font-black uppercase italic">{t.endereco.bairro}</h3>
                  </div>
                  <span className="bg-orange-50 text-orange-500 p-2 rounded-xl text-[10px] font-black italic">RURAL</span>
                </div>
                <p className="text-[9px] text-gray-400 font-bold mt-2 uppercase">Aguarde o restaurante avisar que está pronto. Você pode fazer entregas de asfalto enquanto espera!</p>
              </div>
            )}

            {/* ESTÁGIO: PRONTO PARA BUSCAR (Botão Verde) */}
            {t.status === "Pendente" && (
              <div className="bg-green-600 p-6 rounded-[40px] shadow-2xl border-4 border-white animate-pulse text-white">
                <p className="text-[10px] font-black uppercase italic mb-1">🔥 PEDIDO PRONTO!</p>
                <h3 className="text-xl font-black uppercase leading-none">{t.endereco.bairro}</h3>
                <button 
                  onClick={() => updateDoc(doc(db, "orders", t.id), { status: "Em Rota" })}
                  className="w-full bg-white text-green-600 py-4 rounded-2xl font-black uppercase mt-4 shadow-lg"
                >
                  PEGUEI O PACOTE 🏍️
                </button>
              </div>
            )}

            {/* ESTÁGIO: EM ROTA (Botão Finalizar) */}
            {t.status === "Em Rota" && (
              <div className="bg-black p-8 rounded-[40px] shadow-2xl text-white">
                <p className="text-orange-500 font-black text-[10px] uppercase italic mb-2">🚀 EM ROTA DE ENTREGA</p>
                <h2 className="text-xl font-black uppercase mb-6 leading-tight">{t.endereco.rua}, {t.endereco.numero}</h2>
                <button 
                  onClick={() => updateDoc(doc(db, "orders", t.id), { status: "Entregue" })}
                  className="w-full bg-green-600 py-4 rounded-2xl font-black uppercase shadow-lg"
                >
                  FINALIZAR ENTREGA ✅
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 3. LISTA DE ASFALTO (PARA NÃO FICAR PARADO) */}
      <section>
        <h3 className="text-[11px] font-black uppercase text-gray-400 mb-4 px-2 italic tracking-widest">Oportunidades Urbanas 🏙️</h3>
        <div className="space-y-3">
          {pedidosAsfalto.length === 0 && (
            <p className="text-center py-10 text-[10px] font-bold text-gray-300 uppercase italic">Nenhum pedido na cidade...</p>
          )}
          {pedidosAsfalto.map(p => (
            <div key={p.id} className="bg-white p-5 rounded-[30px] shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <p className="text-[11px] font-black uppercase italic leading-none">{p.endereco.bairro}</p>
                <p className="text-[9px] font-bold text-blue-600 mt-1 uppercase">Taxa: R$ {p.valores.taxaEntrega.toFixed(2)}</p>
              </div>
              <button 
                onClick={() => pegarAsfalto(p.id)}
                className="bg-gray-900 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase active:scale-95 transition"
              >
                Pegar
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}