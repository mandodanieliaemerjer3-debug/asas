"use client";
import { useState, useEffect } from "react";
import { db } from "../../../lib/firebase";
import { 
  collection, query, where, onSnapshot, doc, 
  updateDoc, getDoc, Timestamp, getDocs 
} from "firebase/firestore";
import { useAuth } from "../../../contexts/AuthContext";

export default function PainelOffRoad() {
  const { user } = useAuth();
  const [pedidoEspecial, setPedidoEspecial] = useState(null);
  const [meuTrabalho, setMeuTrabalho] = useState(null);
  const [tempoOferta, setTempoOferta] = useState(30);

  useEffect(() => {
    if (!user) return;

    // VERSÃO DE TESTE: Busca QUALQUER pedido Off-Road Root que esteja Pendente ou Aguardando
    const qFila = query(
      collection(db, "orders"),
      where("endereco.nivelTerreno", "==", "Off-Road Root"),
      where("status", "in", ["Aguardando Entregador", "Pendente"])
    );

    const unsubFila = onSnapshot(qFila, (snap) => {
      if (!snap.empty) {
        // Pega o primeiro disponível para teste
        setPedidoEspecial({ id: snap.docs[0].id, ...snap.docs[0].data() });
        setTempoOferta(30);
      } else {
        setPedidoEspecial(null);
      }
    });

    const qTrabalho = query(
      collection(db, "orders"),
      where("entregadorId", "==", user.uid),
      where("status", "in", ["Em Produção", "Em Rota"])
    );
    const unsubTrabalho = onSnapshot(qTrabalho, (snap) => {
      if (!snap.empty) setMeuTrabalho({ id: snap.docs[0].id, ...snap.docs[0].data() });
      else setMeuTrabalho(null);
    });

    return () => { unsubFila(); unsubTrabalho(); };
  }, [user]);

  const aceitarPedidoRural = async () => {
    await updateDoc(doc(db, "orders", pedidoEspecial.id), {
      status: "Em Produção",
      entregadorId: user.uid,
      entregadorNome: user.displayName || "Entregador Elite",
      motoboyAtual: null
    });
  };

  return (
    <main className="min-h-screen bg-orange-50 p-4 font-sans pb-20">
      <header className="bg-orange-600 p-6 rounded-[40px] shadow-xl mb-6 text-white text-center">
        <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white">Equipe Off-Road Root 🚜</h1>
      </header>

      {/* SE APARECER ISSO, A CONEXÃO ESTÁ OK */}
      {pedidoEspecial && !meuTrabalho && (
        <div className="bg-white border-4 border-orange-600 p-6 rounded-[40px] shadow-2xl animate-bounce">
           <p className="text-[10px] font-black text-red-600 uppercase italic mb-2 text-center">🔔 Nova Corrida Rural!</p>
           <h2 className="text-xl font-black uppercase text-center">{pedidoEspecial.endereco.bairro}</h2>
           <p className="text-center font-bold text-green-600 mb-6">Taxa: R$ {pedidoEspecial.valores.taxaEntrega.toFixed(2)}</p>
           <button onClick={aceitarPedidoRural} className="w-full bg-orange-600 text-white py-5 rounded-3xl font-black uppercase shadow-lg shadow-orange-200">
              Aceitar Agora 🚀
           </button>
        </div>
      )}

      {meuTrabalho && (
        <div className="bg-black text-white p-8 rounded-[40px] shadow-2xl text-center">
          <p className="text-orange-500 font-black text-[10px] uppercase mb-2">Status: {meuTrabalho.status}</p>
          <h2 className="text-xl font-black uppercase mb-6">{meuTrabalho.endereco.rua}, {meuTrabalho.endereco.numero}</h2>
          <button 
            onClick={() => updateDoc(doc(db, "orders", meuTrabalho.id), { status: "Entregue" })}
            className="w-full bg-green-600 py-4 rounded-2xl font-black uppercase"
          >
            Finalizar Entrega ✅
          </button>
        </div>
      )}

      {!pedidoEspecial && !meuTrabalho && (
        <div className="py-20 text-center opacity-30 font-black uppercase italic text-orange-900">
          🔍 Monitorando estradas rurais...
        </div>
      )}
    </main>
  );
}