"use client";
import { useState, useEffect } from "react";
import { db } from "../../../lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs, Timestamp, increment } from "firebase/firestore";

export default function PainelUrbana({ perfil }) {
  const [pedidoSugerido, setPedidoSugerido] = useState(null);
  const [pedidoAtivo, setPedidoAtivo] = useState(null); // Novo: Controla a entrega atual
  const [loading, setLoading] = useState(true);
  const [bairrosDB, setBairrosDB] = useState([]);

  useEffect(() => {
    const carregarBairros = async () => {
      const snap = await getDocs(collection(db, "neighborhoods"));
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setBairrosDB(lista);
    };
    carregarBairros();
  }, []);

  useEffect(() => {
    if (!perfil || bairrosDB.length === 0) return;

    // Monitora tanto pedidos disponíveis quanto o pedido que eu já aceitei
    const q = query(
      collection(db, "orders"),
      where("status", "in", ["Aguardando Entregador", "Em Rota"])
    );

    const unsub = onSnapshot(q, (snap) => {
      const todosPedidos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Verifica se eu já tenho uma entrega em curso
      const emCurso = todosPedidos.find(p => p.entregadorId === perfil.uid && p.status === "Em Rota");
      if (emCurso) {
        setPedidoAtivo(emCurso);
        setLoading(false);
        return;
      }

      setPedidoAtivo(null); // Se não tem em curso, volta para o modo radar

      const disponiveis = todosPedidos.filter(p => p.status === "Aguardando Entregador");
      if (disponiveis.length === 0) {
        setPedidoSugerido(null);
        setLoading(false);
        return;
      }

      const meuBairroInfo = bairrosDB.find(n => n.name === (perfil.ultimaLocalizacao || "Centro"));
      const meuNumero = meuBairroInfo?.numero || 1;

      const ordenados = disponiveis.sort((pa, pb) => {
        const infoA = bairrosDB.find(n => n.name === pa.endereco?.bairro);
        const infoB = bairrosDB.find(n => n.name === pb.endereco?.bairro);
        const numA = infoA?.numero || 999;
        const numB = infoB?.numero || 999;
        return Math.abs(numA - meuNumero) - Math.abs(numB - meuNumero);
      });

      setPedidoSugerido(ordenados[0]);
      setLoading(false);
    });

    return () => unsub();
  }, [perfil, bairrosDB]);

  const aceitarCorrida = async () => {
    if (!pedidoSugerido) return;
    await updateDoc(doc(db, "orders", pedidoSugerido.id), {
      status: "Em Rota",
      entregadorId: perfil.uid,
      aceitoEm: Timestamp.now()
    });
  };

  const finalizarEntrega = async () => {
    if (!pedidoAtivo) return;
    const taxa = pedidoAtivo.valores?.taxaEntrega || 0;

    // 1. Finaliza o pedido
    await updateDoc(doc(db, "orders", pedidoAtivo.id), {
      status: "Finalizado",
      entregueEm: Timestamp.now()
    });

    // 2. Sobe o dinheiro para o saldo do entregador
    await updateDoc(doc(db, "users", perfil.uid), {
      saldoHoje: increment(taxa),
      ultimaLocalizacao: pedidoAtivo.endereco?.bairro || "Centro"
    });

    alert(`R$ ${taxa.toFixed(2)} adicionados ao seu saldo!`);
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-10 text-white font-black italic">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="animate-pulse">RASTREANDO CARGA PRÓXIMA...</p>
    </div>
  );

  // TELA 1: ENTREGA EM CURSO (O que ele vê depois de aceitar)
  if (pedidoAtivo) {
    return (
      <main className="min-h-screen bg-black p-6 text-white font-sans flex flex-col">
        <header className="mb-10 text-center">
          <span className="bg-green-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase italic animate-pulse">Entrega Ativa</span>
          <h1 className="text-4xl font-black uppercase italic mt-4">{pedidoAtivo.endereco?.bairro}</h1>
        </header>

        <div className="flex-1 space-y-6">
          <div className="bg-zinc-900 p-8 rounded-[40px] border border-white/5">
            <p className="text-zinc-500 text-[10px] font-black uppercase mb-1">Destino</p>
            <p className="text-xl font-bold">{pedidoAtivo.endereco?.rua}, {pedidoAtivo.endereco?.numero}</p>
            <p className="text-zinc-500 text-xs mt-4 uppercase font-bold">Cliente: {pedidoAtivo.clienteNome}</p>
          </div>

          <a 
            href={`https://wa.me/55${pedidoAtivo.clienteTelefone}`} 
            className="block w-full bg-zinc-800 text-center py-5 rounded-3xl font-black uppercase text-xs tracking-widest"
          >
            💬 Chamar no WhatsApp
          </a>
        </div>

        <button 
          onClick={finalizarEntrega}
          className="w-full bg-white text-black py-8 rounded-[35px] font-black uppercase italic text-lg shadow-2xl active:scale-95 transition mt-6"
        >
          Finalizar Entrega ✅
        </button>
      </main>
    );
  }

  // TELA 2: RADAR (O que ele vê procurando pedido)
  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-white font-sans">
      {!pedidoSugerido ? (
        <div className="text-center opacity-30">
          <p className="text-[10px] font-black uppercase tracking-[0.5em]">Sem pedidos por perto</p>
        </div>
      ) : (
        <div className="w-full bg-white text-black p-8 rounded-[45px] shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase italic">Sorteio de Proximidade</span>
            <p className="font-black text-2xl italic text-gray-900">R$ {pedidoSugerido.valores?.taxaEntrega?.toFixed(2)}</p>
          </div>
          <h2 className="text-4xl font-black uppercase italic leading-none mb-1 text-gray-900">{pedidoSugerido.endereco?.bairro}</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-8 border-b pb-4 border-gray-100 italic">{pedidoSugerido.endereco?.rua}, {pedidoSugerido.endereco?.numero}</p>
          <button onClick={aceitarCorrida} className="w-full bg-green-600 text-white py-6 rounded-[30px] font-black uppercase italic text-sm shadow-xl active:scale-95 transition">Aceitar Pedido</button>
        </div>
      )}
    </main>
  );
}