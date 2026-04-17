"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, Timestamp } from "firebase/firestore";

export default function PainelRestaurante() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nomeLoja, setNomeLoja] = useState("");
  const router = useRouter();

  useEffect(() => {
    const idSessao = sessionStorage.getItem("restauranteId");
    const nomeSessao = sessionStorage.getItem("restauranteNome");
    
    if (!idSessao) {
      router.push("/restaurante/login");
      return;
    }
    
    setNomeLoja(nomeSessao || "Minha Loja");

    // BUSCA AMPLIADA: Pega tudo que o dono precisa ver
    const q = query(
      collection(db, "orders"),
      where("restaurantId", "==", idSessao),
      where("status", "in", ["Pendente", "Preparando", "Aguardando Entregador"])
    );

    const unsub = onSnapshot(q, (snap) => {
      const dados = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPedidos(dados);
      setLoading(false);
    }, (error) => {
      console.error("Erro no Snapshot:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  const alterarStatus = async (id, novoStatus) => {
    try {
      await updateDoc(doc(db, "orders", id), { 
        status: novoStatus,
        atualizadoEm: Timestamp.now()
      });
    } catch (e) { alert("Erro ao atualizar!"); }
  };

  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center font-black italic text-white uppercase animate-pulse">Sincronizando Pedidos...</div>;

  return (
    <main className="min-h-screen bg-zinc-50 p-6 font-sans">
      <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-[30px] shadow-sm border border-zinc-100">
        <div>
          <h1 className="font-black italic text-xl uppercase tracking-tighter text-zinc-900">{nomeLoja}</h1>
          <p className="text-[8px] font-bold opacity-30 uppercase tracking-[0.3em]">Painel de Operação</p>
        </div>
        <button onClick={() => { sessionStorage.clear(); router.push("/restaurante/login"); }} className="text-[9px] font-black uppercase opacity-20 hover:opacity-100 transition">Sair</button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pedidos.map((pedido) => (
          <div key={pedido.id} className="bg-white rounded-[40px] p-8 shadow-xl border border-zinc-100 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <span className={`px-4 py-1 rounded-full text-[8px] font-black uppercase italic ${pedido.status === 'Pendente' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>{pedido.status}</span>
              <p className="text-[9px] font-bold text-zinc-300">#{pedido.id.slice(-4).toUpperCase()}</p>
            </div>
            
            <h2 className="font-black text-lg uppercase italic mb-1 text-zinc-900">{pedido.clienteNome}</h2>
            <p className="text-[9px] font-bold text-zinc-400 uppercase mb-6 leading-tight">{pedido.endereco?.bairro} - {pedido.endereco?.rua}</p>

            {pedido.metodoPagamento === 'dinheiro' && (
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-3xl mb-6">
                <p className="text-[10px] font-bold text-amber-900 leading-tight uppercase italic">
                  {pedido.aceitaPixSeSemTroco ? "✓ Aceita Pix se não houver troco" : "⚠️ Exige troco em espécie"}
                </p>
              </div>
            )}

            <div className="flex-1 border-t border-dashed border-zinc-100 pt-6 mb-8 space-y-2">
              {pedido.itens?.map((item, idx) => (
                <div key={idx} className="flex justify-between"><p className="text-[10px] font-bold text-zinc-500 uppercase">{item.name}</p></div>
              ))}
            </div>

            <button 
              onClick={() => alterarStatus(pedido.id, pedido.status === 'Pendente' ? 'Preparando' : 'Aguardando Entregador')}
              className="w-full bg-zinc-900 text-white py-5 rounded-2xl font-black uppercase italic text-[10px]"
            >
              {pedido.status === 'Pendente' ? "Aceitar Pedido" : "Chamar Entregador ➔"}
            </button>
          </div>
        ))}
        
        {pedidos.length === 0 && (
          <div className="col-span-full py-32 text-center opacity-20"><p className="font-black italic uppercase text-xl">Nenhum pedido na chapa</p></div>
        )}
      </div>
    </main>
  );
}