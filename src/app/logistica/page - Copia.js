"use client";
import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { 
  collection, query, where, onSnapshot, doc, 
  updateDoc, Timestamp 
} from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";

export default function TerminalLogistico() {
  const { user } = useAuth();
  const [perfilOperador, setPerfilOperador] = useState(null);
  const [entregaAtiva, setEntregaAtiva] = useState(null);
  const [radarPedidos, setRadarPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  // 📡 1. CONEXÃO COM A NOVA COLEÇÃO 'OPERADORES'
  useEffect(() => {
    if (!user) return;

    // O ID do documento em 'operadores' deve ser o UID do usuário
    const unsubPerfil = onSnapshot(doc(db, "operadores", user.uid), (snap) => {
      if (snap.exists()) {
        const dados = snap.data();
        setPerfilOperador({ 
          id: snap.id, 
          ...dados,
          // Garante que 'linhasConhecidas' seja lido corretamente
          linhas: (dados.linhasConhecidas || []).map(l => String(l))
        });
      } else {
        setPerfilOperador(null);
      }
      setLoading(false);
    });

    return () => unsubPerfil();
  }, [user]);

  // 🛰️ 2. RADAR DE DEMANDAS (FILTRO POR RANK E LINHAID)
  useEffect(() => {
    if (!perfilOperador || !perfilOperador.disponibilidade) return;

    const q = query(
      collection(db, "orders"),
      where("status", "==", "Aguardando Entregador"),
      where("rankEntrega", "==", perfilOperador.rank)
    );

    const unsubRadar = onSnapshot(q, (snap) => {
      const todosAptos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Filtra pedidos onde o 'linhaId' está na lista do operador
      const filtradosPorLinha = todosAptos.filter(pedido => {
        const idLinhaDoPedido = String(pedido.endereco?.linhaId || "");
        return perfilOperador.linhas.includes(idLinhaDoPedido);
      });

      // ⚡ LÓGICA ELITE: Aceite Automático para Off-Road Root
      if (perfilOperador.rank === "Off-Road Root" && filtradosPorLinha.length > 0 && !entregaAtiva) {
        vincularOperador(filtradosPorLinha[0].id);
      }

      setRadarPedidos(filtradosPorLinha);
    });

    // Monitora se este operador já possui uma carga em rota
    const qAtiva = query(
      collection(db, "orders"),
      where("operadorId", "==", user.uid),
      where("status", "==", "Em Rota")
    );
    const unsubAtiva = onSnapshot(qAtiva, (snap) => {
      if (!snap.empty) setEntregaAtiva({ id: snap.docs[0].id, ...snap.docs[0].data() });
      else setEntregaAtiva(null);
    });

    return () => { unsubRadar(); unsubAtiva(); };
  }, [perfilOperador, entregaAtiva, user]);

  const vincularOperador = async (pedidoId) => {
    await updateDoc(doc(db, "orders", pedidoId), {
      status: "Em Rota",
      operadorId: user.uid,
      aceitoEm: Timestamp.now()
    });
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse">AUTENTICANDO OPERADOR...</div>;

  if (!perfilOperador) return (
    <div className="p-20 text-center">
      <h1 className="text-red-600 font-black uppercase italic">Acesso Restrito</h1>
      <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase">Perfil de Operador não localizado no sistema.</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-zinc-950 text-white font-sans max-w-md mx-auto p-6">
      
      {/* STATUS DO TERMINAL */}
      <header className="mb-8 border-l-4 border-red-600 pl-4">
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Terminal Logístico</p>
        <h1 className="text-2xl font-black uppercase italic">{perfilOperador.nomeOperador}</h1>
        <div className="flex gap-2 mt-2">
          <span className="bg-red-600 text-[8px] px-2 py-1 rounded font-black uppercase">{perfilOperador.rank}</span>
          <span className="bg-zinc-800 text-[8px] px-2 py-1 rounded font-black uppercase">Linhas: {perfilOperador.linhas.join(", ")}</span>
        </div>
      </header>

      {/* MANIFESTO DE CARGA ATIVO */}
      {entregaAtiva ? (
        <section className="bg-white text-black p-8 rounded-[40px] shadow-2xl animate-in zoom-in duration-300">
          <p className="text-[10px] font-black text-red-600 uppercase mb-2">Carga em Movimento</p>
          <h2 className="text-3xl font-black uppercase leading-none mb-6">{entregaAtiva.clienteNome}</h2>
          
          <div className="bg-zinc-100 p-5 rounded-3xl mb-8 border border-zinc-200">
            <p className="text-[9px] font-bold text-zinc-400 uppercase">Ponto de Entrega (Linha {entregaAtiva.endereco?.linhaId}):</p>
            <p className="font-black italic text-sm">{entregaAtiva.endereco?.bairro}</p>
            <p className="text-xs">{entregaAtiva.endereco?.rua}, {entregaAtiva.endereco?.numero}</p>
          </div>

          <button 
            onClick={() => updateDoc(doc(db, "orders", entregaAtiva.id), { status: "Entregue" })}
            className="w-full bg-black text-white py-6 rounded-3xl font-black uppercase italic text-xs active:scale-95 transition"
          >
            Confirmar Entrega Concluída ✓
          </button>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black uppercase text-zinc-500 italic">Radar de Demandas</h3>
            {perfilOperador.disponibilidade && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                <span className="text-[10px] font-bold uppercase">Escaneando...</span>
              </div>
            )}
          </div>

          {!perfilOperador.disponibilidade ? (
            <div className="py-20 text-center bg-zinc-900/50 rounded-[40px] border border-zinc-800">
              <p className="text-zinc-600 font-black uppercase text-[10px] italic">Terminal Offline</p>
            </div>
          ) : radarPedidos.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-zinc-800 rounded-[40px]">
              <p className="text-zinc-600 font-black uppercase text-[10px] italic tracking-widest">Nenhuma carga pendente nas suas linhas</p>
            </div>
          ) : (
            radarPedidos.map(pedido => (
              <div key={pedido.id} className="bg-zinc-900 p-6 rounded-[30px] border border-zinc-800 flex justify-between items-center transition-all active:scale-95">
                <div>
                  <p className="text-lg font-black uppercase italic leading-none">{pedido.endereco?.bairro}</p>
                  <p className="text-[9px] font-bold text-green-500 uppercase mt-2">Ganhos: R$ {pedido.valores?.taxaEntrega.toFixed(2)}</p>
                </div>
                {perfilOperador.rank !== "Off-Road Root" && (
                  <button 
                    onClick={() => vincularOperador(pedido.id)}
                    className="bg-white text-black px-6 py-3 rounded-2xl font-black uppercase text-[10px] italic"
                  >
                    Coletar
                  </button>
                )}
              </div>
            ))
          )}
        </section>
      )}

      {/* GESTÃO DE EXPEDIENTE */}
      <footer className="mt-12">
        <button 
          onClick={() => updateDoc(doc(db, "operadores", user.uid), { disponibilidade: !perfilOperador.disponibilidade })}
          className={`w-full py-5 rounded-3xl font-black uppercase text-[10px] transition-all italic tracking-widest ${
            perfilOperador.disponibilidade ? "bg-zinc-900 text-red-500 border border-red-900/30" : "bg-red-600 text-white shadow-xl shadow-red-900/20"
          }`}
        >
          {perfilOperador.disponibilidade ? "Desconectar Terminal" : "Entrar em Operação 🚀"}
        </button>
      </footer>
    </main>
  );
}