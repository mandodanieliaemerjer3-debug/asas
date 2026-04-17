"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, Timestamp } from "firebase/firestore";

export default function PainelDaChapaSegura() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const idSessao = sessionStorage.getItem("restauranteId");
    if (!idSessao) { router.push("/restaurante/login"); return; }

    const q = query(
      collection(db, "orders"),
      where("restaurantId", "==", idSessao),
      where("status", "in", ["Pendente", "Preparando", "Aguardando Entregador"])
    );

    const unsub = onSnapshot(q, (snap) => {
      setPedidos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const avancarEstagio = async (pedido) => {
    const pedidoRef = doc(db, "orders", pedido.id);
    let novosDados = {};

    if (pedido.status === "Pendente") {
      novosDados = { status: "Preparando" };
    } 
    else if (pedido.status === "Preparando") {
      // Gera um código de 4 dígitos para o motoboy provar quem é
      const tokenSeguranca = Math.floor(1000 + Math.random() * 9000); 
      novosDados = { 
        status: "Aguardando Entregador",
        tokenRetirada: tokenSeguranca 
      };
    } 
    else if (pedido.status === "Aguardando Entregador") {
      novosDados = { status: "Em Entrega" };
    }

    if (Object.keys(novosDados).length > 0) {
      await updateDoc(pedidoRef, { 
        ...novosDados,
        ultimaAtualizacao: Timestamp.now()
      });
    }
  };

  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center font-black italic text-white animate-pulse">CARREGANDO SEGURANÇA...</div>;

  return (
    <main className="min-h-screen bg-zinc-50 p-6 font-sans">
      <header className="bg-white p-8 rounded-[40px] shadow-sm mb-10 flex justify-between items-center border border-zinc-100">
        <h1 className="font-black italic text-2xl uppercase tracking-tighter">Painel de Retirada</h1>
        <p className="text-[10px] font-bold opacity-30 uppercase italic">Mogu Mogu Security</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pedidos.map((pedido) => (
          <div key={pedido.id} className="bg-white rounded-[45px] p-10 shadow-xl border border-zinc-100 relative overflow-hidden">
            
            <div className="flex justify-between items-start mb-6">
              <span className="bg-zinc-100 px-4 py-1.5 rounded-full text-[9px] font-black uppercase italic text-zinc-500">
                {pedido.status}
              </span>
              
              {/* EXIBIÇÃO DO CÓDIGO PARA O DONO CONFERIR */}
              {pedido.tokenRetirada && (
                <div className="bg-orange-500 text-white px-4 py-1.5 rounded-full animate-bounce">
                  <p className="text-[10px] font-black italic uppercase">CÓDIGO: {pedido.tokenRetirada}</p>
                </div>
              )}
            </div>

            <h2 className="font-black text-2xl uppercase italic mb-1 tracking-tighter text-zinc-900">{pedido.clienteNome}</h2>
            <p className="text-[10px] font-bold text-zinc-400 uppercase mb-8">{pedido.endereco?.bairro}</p>

            <div className="flex-1 border-t border-dashed border-zinc-100 pt-6 mb-8">
              {pedido.itens?.map((item, idx) => (
                <p key={idx} className="text-[11px] font-bold text-zinc-500 uppercase italic">1x {item.name}</p>
              ))}
            </div>

            {/* AVISO DE CONFERÊNCIA */}
            {pedido.status === "Aguardando Entregador" && (
              <p className="text-[9px] font-black text-orange-600 uppercase italic text-center mb-4">
                ⚠️ CONFIRA O CÓDIGO {pedido.tokenRetirada} COM O MOTOBOY
              </p>
            )}

            <button 
              onClick={() => avancarEstagio(pedido)}
              className={`w-full py-6 rounded-[28px] font-black uppercase italic text-xs transition-all active:scale-95 ${
                pedido.status === "Aguardando Entregador" ? "bg-orange-500 text-white shadow-orange-200 shadow-lg" : "bg-zinc-900 text-white"
              }`}
            >
              {pedido.status === "Aguardando Entregador" ? "CONFIRMAR RETIRADA ➔" : "AVANÇAR PEDIDO ➔"}
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}