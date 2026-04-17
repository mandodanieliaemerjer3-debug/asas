"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../lib/firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  Timestamp 
} from "firebase/firestore";

export default function PainelRestaurante() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 1. Pega o ID que o dono usou no login
    const idSessao = sessionStorage.getItem("restauranteId");
    
    if (!idSessao) {
      router.push("/restaurante/login");
      return;
    }

    // 2. FILTRO CORRIGIDO: Usa 'restaurantId' para bater com o banco
    // 3. STATUS AMPLIADO: Inclui 'Aguardando Entregador' para os pedidos aparecerem
    const q = query(
      collection(db, "orders"),
      where("restaurantId", "==", idSessao),
      where("status", "in", ["Pendente", "Preparando", "Aguardando Entregador"])
    );

    const unsub = onSnapshot(q, (snap) => {
      const dados = snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data() 
      }));
      setPedidos(dados);
      setLoading(false);
    }, (error) => {
      console.error("Erro no Firebase:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  const alterarStatus = async (pedidoId, novoStatus) => {
    await updateDoc(doc(db, "orders", pedidoId), { 
      status: novoStatus,
      atualizadoEm: Timestamp.now()
    });
  };

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center font-black italic">Sincronizando Filtros...</div>;

  return (
    <main className="min-h-screen bg-zinc-50 p-6 font-sans">
      <header className="mb-8 flex justify-between items-center bg-white p-6 rounded-[30px] shadow-sm">
        <h1 className="font-black italic uppercase text-xl">Painel da Chapa</h1>
        <button onClick={() => { sessionStorage.clear(); router.push("/restaurante/login"); }} className="text-[10px] font-black opacity-20 uppercase">Sair</button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pedidos.map((pedido) => (
          <div key={pedido.id} className="bg-white rounded-[40px] p-8 shadow-xl border border-zinc-100">
            <div className="flex justify-between mb-4">
              <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[8px] font-black uppercase italic">{pedido.status}</span>
              <p className="text-[9px] font-bold text-zinc-300">ID: {pedido.restaurantId}</p>
            </div>

            <h2 className="font-black text-lg uppercase italic mb-1">{pedido.clienteNome}</h2>
            <p className="text-[10px] font-bold text-zinc-400 uppercase mb-6">{pedido.endereco?.bairro}</p>

            <div className="border-t border-dashed pt-4 mb-6">
              {pedido.itens?.map((item, i) => (
                <p key={i} className="text-[10px] font-bold uppercase text-zinc-500">{item.name} x1</p>
              ))}
            </div>

            <button 
              onClick={() => alterarStatus(pedido.id, pedido.status === 'Pendente' ? 'Preparando' : 'Aguardando Entregador')}
              className="w-full bg-zinc-900 text-white py-5 rounded-2xl font-black uppercase italic text-[10px]"
            >
              Avançar Pedido ➔
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}