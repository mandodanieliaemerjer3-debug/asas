"use client";
import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { 
  collection, query, where, onSnapshot, doc, 
  updateDoc, Timestamp, getDoc 
} from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";

export default function PainelEntregadorElite() {
  const { user } = useAuth();
  
  // ESTADOS
  const [perfil, setPerfil] = useState(null);
  const [pedidoAtivo, setPedidoAtivo] = useState(null);
  const [listaBusca, setListaBusca] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState("radar"); // radar, historico, perfil
  const [loading, setLoading] = useState(true);

  // 1. SINCRONIZAÇÃO DO PERFIL E SEGURANÇA
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        const dados = snap.data();
        // Normaliza campos para evitar erros de nomes antigos
        setPerfil({
          uid: user.uid,
          nome: dados.clienteNome || user.displayName,
          rank: dados.rank || dados.nivelAtuacao || "Asfalto Zero",
          linhas: dados.linhasConhecidas || [],
          statusTrabalho: dados.trabalhandoHoje || false,
          saldo: dados.saldoDinheiro || 0
        });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  // 2. RADAR RURAL (ACEITE AUTOMÁTICO E BUSCA MANUAL)
  useEffect(() => {
    if (!perfil || !perfil.statusTrabalho || abaAtiva !== "radar") return;

    // Monitora pedidos aguardando entregador
    const q = query(
      collection(db, "orders"),
      where("status", "==", "Aguardando Entregador")
    );

    const unsubOrders = onSnapshot(q, (snap) => {
      const todosPedidos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Filtra pedidos que batem com as linhas que o entregador faz
      const pedidosNasMinhasLinhas = todosPedidos.filter(p => 
        perfil.linhas.includes(String(p.endereco?.linhaId))
      );

      // LÓGICA OFF-ROAD: Aceite Automático
      if (perfil.rank === "Off-Road Root") {
        const pedidoPrioritario = pedidosNasMinhasLinhas.find(p => p.rankEntrega === "Off-Road Root");
        if (pedidoPrioritario && !pedidoAtivo) {
          aceitarPedido(pedidoPrioritario.id); // Força o aceite
        }
      } 
      
      setListaBusca(pedidosNasMinhasLinhas);
    });

    // Monitora se o entregador já tem um pedido em rota
    const qRota = query(
      collection(db, "orders"),
      where("entregadorId", "==", perfil.uid),
      where("status", "==", "Em Rota")
    );
    const unsubRota = onSnapshot(qRota, (snap) => {
      if (!snap.empty) setPedidoAtivo({ id: snap.docs[0].id, ...snap.docs[0].data() });
      else setPedidoAtivo(null);
    });

    return () => { unsubOrders(); unsubRota(); };
  }, [perfil, abaAtiva, pedidoAtivo]);

  const aceitarPedido = async (id) => {
    await updateDoc(doc(db, "orders", id), {
      status: "Em Rota",
      entregadorId: perfil.uid,
      aceitoEm: Timestamp.now()
    });
  };

  const finalizarEntrega = async (id) => {
    await updateDoc(doc(db, "orders", id), { status: "Entregue" });
    alert("Entrega concluída com sucesso!");
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse">CARREGANDO SISTEMA ELITE...</div>;

  return (
    <main className="min-h-screen bg-gray-50 pb-24 font-sans max-w-md mx-auto text-gray-900">
      
      {/* HEADER DE STATUS */}
      <header className="bg-white p-6 rounded-b-[40px] shadow-sm flex justify-between items-center border-b border-gray-100">
        <div>
          <h1 className="text-xs font-black uppercase text-gray-400 italic">Entregador Log</h1>
          <p className="text-xl font-black text-red-600 uppercase italic tracking-tighter">{perfil?.rank}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase text-green-600">Saldo Hoje</p>
          <p className="text-lg font-black text-gray-900">R$ {perfil?.saldo.toFixed(2)}</p>
        </div>
      </header>

      {/* ROTA ATIVA (SEMPRE NO TOPO SE EXISTIR) */}
      {pedidoAtivo ? (
        <section className="m-4 bg-black text-white p-8 rounded-[40px] shadow-2xl animate-in slide-in-from-top duration-500">
          <span className="bg-red-600 px-3 py-1 rounded-full text-[8px] font-black uppercase italic">Entrega em Curso</span>
          <h2 className="text-3xl font-black uppercase italic mt-4 leading-none">{pedidoAtivo.clienteNome}</h2>
          <div className="mt-6 bg-white/10 p-5 rounded-3xl border border-white/5">
             <p className="text-[10px] font-bold text-gray-400 uppercase">📍 Destino Rural:</p>
             <p className="text-sm font-black italic mt-1">{pedidoAtivo.endereco?.bairro} <br/> {pedidoAtivo.endereco?.rua}, {pedidoAtivo.endereco?.numero}</p>
          </div>
          <button 
            onClick={() => finalizarEntrega(pedidoAtivo.id)}
            className="w-full bg-green-600 py-6 rounded-3xl mt-8 font-black uppercase italic text-xs shadow-lg active:scale-95 transition"
          >
            Finalizar Entrega ✅
          </button>
        </section>
      ) : (
        <div className="p-4 space-y-4">
          {/* BUSCA MANUAL (OCULTA PARA OFF-ROAD POIS JÁ ACEITA AUTO) */}
          {perfil?.rank !== "Off-Road Root" && (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setListaBusca(prev => prev.filter(p => p.rankEntrega === "Asfalto Zero"))} className="bg-blue-600 text-white p-4 rounded-2xl font-black uppercase text-[9px] italic shadow-md">Buscar Asfalto 🏙️</button>
              <button onClick={() => setListaBusca(prev => prev.filter(p => p.rankEntrega === "Desbravador"))} className="bg-orange-500 text-white p-4 rounded-2xl font-black uppercase text-[9px] italic shadow-md">Buscar Terra 🚜</button>
            </div>
          )}

          {/* LISTA DE DISPONÍVEIS NO RADAR */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest text-center mt-6 italic">--- Pedidos Disponíveis na sua Linha ---</p>
            {listaBusca.length === 0 && <p className="text-center p-10 text-gray-300 font-bold uppercase text-[10px]">Nenhuma entrega pendente...</p>}
            
            {listaBusca.map(p => (
              <div key={p.id} className="bg-white p-6 rounded-[35px] shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="font-black uppercase italic text-gray-800">{p.endereco?.bairro}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Ganhos: R$ {p.valores?.taxaEntrega.toFixed(2)}</p>
                </div>
                {perfil?.rank !== "Off-Road Root" && (
                  <button onClick={() => aceitarPedido(p.id)} className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] italic">Aceitar</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MENU INFERIOR (PERFIL / HISTÓRICO) */}
      <nav className="fixed bottom-6 inset-x-6 bg-white/80 backdrop-blur-md border border-gray-100 h-20 rounded-[35px] shadow-2xl flex items-center justify-around px-4 z-50">
        <button onClick={() => setAbaAtiva("radar")} className={`flex flex-col items-center ${abaAtiva === 'radar' ? 'text-blue-600' : 'text-gray-300'}`}>
          <span className="text-xl">📡</span>
          <span className="text-[8px] font-black uppercase">Radar</span>
        </button>
        <button onClick={() => setAbaAtiva("perfil")} className={`flex flex-col items-center ${abaAtiva === 'perfil' ? 'text-blue-600' : 'text-gray-300'}`}>
          <span className="text-xl">⚙️</span>
          <span className="text-[8px] font-black uppercase">Perfil</span>
        </button>
      </nav>

      {/* MODAL DE PERFIL (SIMPLIFICADO) */}
      {abaAtiva === "perfil" && (
        <div className="fixed inset-0 bg-white z-[60] p-8">
          <button onClick={() => setAbaAtiva("radar")} className="font-black text-gray-300 mb-8 uppercase text-xs tracking-tighter">← Voltar para Rota</button>
          <h2 className="text-3xl font-black uppercase italic mb-6">Configurar Perfil</h2>
          
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-3xl">
              <label className="text-[10px] font-black text-gray-400 uppercase">Minhas Linhas Ativas</label>
              <p className="font-black text-lg mt-1">{perfil?.linhas.join(", ") || "Nenhuma cadastrada"}</p>
            </div>
            
            <button 
              onClick={async () => {
                await updateDoc(doc(db, "users", user.uid), { trabalhandoHoje: !perfil.statusTrabalho });
              }}
              className={`w-full py-5 rounded-3xl font-black uppercase italic text-sm transition ${perfil?.statusTrabalho ? 'bg-red-50 text-red-600' : 'bg-green-600 text-white'}`}
            >
              {perfil?.statusTrabalho ? "Encerrar Expediente" : "Iniciar Trabalho Hoje 🚀"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}