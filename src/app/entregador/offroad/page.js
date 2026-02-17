"use client";
import { useState, useEffect } from "react";
import { db } from "../../../lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "../../../contexts/AuthContext";

export default function PainelOffRoadSeguro() {
  const { user } = useAuth();
  const [pedidoDisponivel, setPedidoDisponivel] = useState(null);
  const [meusTrabalhos, setMeusTrabalhos] = useState([]);
  const [pedidosAsfalto, setPedidosAsfalto] = useState([]);

  useEffect(() => {
    if (!user) return;

    const qRural = query(collection(db, "orders"), where("endereco.nivelTerreno", "in", ["Off-Road Root", "Desbravador"]), where("status", "==", "Aguardando Entregador"));
    const unsubRural = onSnapshot(qRural, (snap) => setPedidoDisponivel(!snap.empty ? { id: snap.docs[0].id, ...snap.docs[0].data() } : null));

    const qTrabalho = query(collection(db, "orders"), where("entregadorId", "==", user.uid), where("status", "in", ["Em Produção", "Pendente", "Em Rota"]));
    const unsubTrabalho = onSnapshot(qTrabalho, (snap) => setMeusTrabalhos(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    const qAsfalto = query(collection(db, "orders"), where("endereco.nivelTerreno", "==", "Asfalto Zero"), where("status", "==", "Pendente"), where("motoboyAtual", "==", null));
    const unsubAsfalto = onSnapshot(qAsfalto, (snap) => setPedidosAsfalto(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { unsubRural(); unsubAsfalto(); unsubTrabalho(); };
  }, [user]);

  return (
    <main className="min-h-screen bg-gray-50 p-4 pb-32 font-sans">
      <header className="mb-6 flex justify-between items-center italic font-black uppercase tracking-tighter">
        <h1>Painel Elite</h1>
        <span className="text-[8px] bg-orange-600 text-white px-2 py-1 rounded-full">Off-Road</span>
      </header>

      {meusTrabalhos.map(t => (
        <div key={t.id} className="mb-4">
          {/* ESTADO: EM ROTA - AGUARDANDO CLIENTE */}
          {t.status === "Em Rota" ? (
            <div className="bg-black p-8 rounded-[40px] shadow-2xl text-white text-center border-4 border-orange-600">
              <p className="text-orange-500 font-black text-[10px] uppercase italic mb-2">Aguardando Cliente Confirmar...</p>
              <h2 className="text-xl font-black uppercase mb-4 leading-tight">{t.endereco.rua}, {t.endereco.numero}</h2>
              <div className="bg-white/10 p-4 rounded-2xl">
                <p className="text-[9px] font-bold uppercase text-gray-400">Instrução de Segurança:</p>
                <p className="text-[10px] font-black uppercase italic mt-1 text-orange-200">Entregue o pedido e peça para o cliente clicar em "Recebi o Pedido" no celular dele.</p>
              </div>
            </div>
          ) : (
            /* OUTROS ESTADOS (PRODUÇÃO / PENDENTE) */
            <div className={`p-6 rounded-[35px] shadow-sm ${t.status === 'Pendente' ? 'bg-green-600 text-white animate-pulse' : 'bg-white border-2 border-orange-100'}`}>
              <p className="text-[9px] font-black uppercase italic mb-1">{t.status === 'Pendente' ? '🔥 PRONTO!' : '🥪 COZINHA'}</p>
              <h3 className={`text-lg font-black uppercase ${t.status === 'Pendente' ? 'text-white' : 'text-gray-800'}`}>{t.endereco.bairro}</h3>
              {t.status === "Pendente" && (
                <button onClick={() => updateDoc(doc(db, "orders", t.id), { status: "Em Rota" })} className="w-full bg-white text-green-600 py-4 rounded-2xl font-black uppercase mt-4">PEGUEI O PACOTE 🏍️</button>
              )}
            </div>
          )}
        </div>
      ))}

      {/* LISTA DE OPORTUNIDADES (O RESTO CONTINUA IGUAL) */}
      {/* ... (código de oferta rural e asfalto aqui) */}
    </main>
  );
}