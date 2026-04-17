"use client";
import { useState, useEffect } from "react";
import { db } from "../../../lib/firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  getDocs, 
  Timestamp, 
  increment 
} from "firebase/firestore";

export default function PainelUrbana({ perfil }) {
  const [pedidoSugerido, setPedidoSugerido] = useState(null);
  const [pedidoAtivo, setPedidoAtivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bairrosDB, setBairrosDB] = useState([]);

  // 1. CARREGA LISTA DE BAIRROS (NECESSÁRIO PARA O CÁLCULO)
  useEffect(() => {
    const carregarBairros = async () => {
      try {
        const snap = await getDocs(collection(db, "neighborhoods"));
        const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setBairrosDB(lista);
      } catch (err) {
        console.error("Erro ao carregar bairros:", err);
      }
    };
    carregarBairros();
  }, []);

  // 2. MONITOR DE ESTADOS (RADAR VS ENTREGA ATIVA)
  useEffect(() => {
    if (!perfil?.uid || bairrosDB.length === 0) return;

    // Monitoramos todos os pedidos relevantes para este entregador
    const q = query(collection(db, "orders"), where("status", "in", ["Aguardando Entregador", "Em Rota"]));

    const unsub = onSnapshot(q, (snap) => {
      const todos = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // VERIFICAÇÃO 1: Eu já tenho um pedido que aceitei?
      const emCurso = todos.find(p => p.entregadorId === perfil.uid && p.status === "Em Rota");
      
      if (emCurso) {
        setPedidoAtivo(emCurso);
        setPedidoSugerido(null); // Desliga o radar se estou ocupado
        setLoading(false);
        return;
      }

      // VERIFICAÇÃO 2: Se estou livre, busca pedidos disponíveis do meu nível
      setPedidoAtivo(null);
      const disponiveis = todos.filter(p => p.status === "Aguardando Entregador" && p.level === perfil.level);

      if (disponiveis.length === 0) {
        setPedidoSugerido(null);
        setLoading(false);
        return;
      }

      // Lógica de Proximidade (O "Imã")
      const meuBairroData = bairrosDB.find(b => b.name === (perfil.ultimaLocalizacao || "Centro"));
      const meuNumRef = meuBairroData?.numero || 1;

      const ordenados = disponiveis.sort((a, b) => {
        const nA = bairrosDB.find(n => n.name === a.endereco?.bairro)?.numero || 999;
        const nB = bairrosDB.find(n => n.name === b.endereco?.bairro)?.numero || 999;
        return Math.abs(nA - meuNumRef) - Math.abs(nB - meuNumRef);
      });

      setPedidoSugerido(ordenados[0]);
      setLoading(false);
    });

    return () => unsub();
  }, [perfil?.uid, perfil?.level, perfil?.ultimaLocalizacao, bairrosDB]);

  // 3. ACEITAR CORRIDA
  const aceitarCorrida = async () => {
    if (!pedidoSugerido) return;
    try {
      // Vincula meu ID ao pedido e muda o status para "Em Rota"
      await updateDoc(doc(db, "orders", pedidoSugerido.id), {
        status: "Em Rota",
        entregadorId: perfil.uid,
        aceitoEm: Timestamp.now()
      });
    } catch (e) {
      console.error("Erro ao aceitar:", e);
    }
  };

  // 4. FINALIZAR ENTREGA
  const finalizarEntrega = async () => {
    if (!pedidoAtivo) return;
    const taxa = pedidoAtivo.valores?.taxaEntrega || 0;

    try {
      // 1. Finaliza o pedido
      await updateDoc(doc(db, "orders", pedidoAtivo.id), {
        status: "Finalizado",
        finalizadoEm: Timestamp.now()
      });

      // 2. Atualiza o perfil (Saldo e Localização atual)
      await updateDoc(doc(db, "users", perfil.uid), {
        moedas: increment(taxa), // Usa o campo do seu banco
        ultimaLocalizacao: pedidoAtivo.endereco?.bairro || "Centro"
      });

      setPedidoAtivo(null); // Volta para o modo radar
      alert(`R$ ${taxa.toFixed(2)} recebidos!`);
    } catch (e) {
      console.error("Erro ao finalizar:", e);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
       <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
       <p className="font-black italic animate-pulse">SINCRO RADAR...</p>
    </div>
  );

  // TELA 1: FOCO NA ENTREGA (Bloqueia o radar enquanto não terminar)
  if (pedidoAtivo) {
    return (
      <main className="min-h-screen bg-zinc-950 p-6 text-white flex flex-col justify-between font-sans">
        <div className="text-center mt-6">
          <span className="bg-green-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase italic animate-pulse">Entrega Ativa</span>
          <h1 className="text-5xl font-black uppercase italic mt-6 leading-none tracking-tighter">{pedidoAtivo.endereco?.bairro}</h1>
        </div>

        <div className="bg-white text-black p-8 rounded-[45px] shadow-2xl">
          <p className="text-[10px] font-black uppercase text-zinc-400 mb-2">Ponto de Entrega</p>
          <p className="text-2xl font-black uppercase italic leading-tight mb-6">
            {pedidoAtivo.endereco?.rua}, {pedidoAtivo.endereco?.numero}
          </p>
          <div className="border-t border-zinc-100 pt-6">
             <p className="text-[10px] font-black uppercase text-zinc-400 mb-1">Destinatário</p>
             <p className="font-bold text-lg">{pedidoAtivo.clienteNome}</p>
          </div>
        </div>

        <button 
          onClick={finalizarEntrega}
          className="w-full bg-white text-black py-8 rounded-[35px] font-black uppercase italic text-lg shadow-xl active:scale-95 transition"
        >
          Concluir Serviço ✅
        </button>
      </main>
    );
  }

  // TELA 2: RADAR DE BUSCA
  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-white text-center">
      {!pedidoSugerido ? (
        <div className="opacity-20 flex flex-col items-center">
          <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mb-6"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.5em]">Rastreando Cargas {perfil.level}...</p>
        </div>
      ) : (
        <div className="w-full bg-white text-black p-8 rounded-[45px] shadow-2xl animate-in zoom-in duration-300">
          <div className="flex justify-between items-center mb-6">
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase italic">Nova Carga</span>
            <p className="font-black text-2xl italic text-zinc-900">R$ {pedidoSugerido.valores?.taxaEntrega?.toFixed(2)}</p>
          </div>

          <h2 className="text-4xl font-black uppercase italic leading-none mb-2 text-zinc-900">{pedidoSugerido.endereco?.bairro}</h2>
          <p className="text-[10px] font-bold text-zinc-400 uppercase mb-8 italic">{pedidoSugerido.endereco?.rua}, {pedidoSugerido.endereco?.numero}</p>

          <button 
            onClick={aceitarCorrida}
            className="w-full bg-green-600 text-white py-6 rounded-[32px] font-black uppercase italic text-sm shadow-xl active:scale-95 transition"
          >
            Aceitar Corrida
          </button>
        </div>
      )}
    </main>
  );
}