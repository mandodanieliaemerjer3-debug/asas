"use client";
import { useState, useEffect } from "react";
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
  const restauranteId = "rest_1"; // ID que vimos no seu Firebase

  useEffect(() => {
    // Busca pedidos Pendentes ou em Preparo para esta loja
    const q = query(
      collection(db, "orders"),
      where("restaurantId", "==", restauranteId),
      where("status", "in", ["Pendente", "Preparando"])
    );

    const unsub = onSnapshot(q, (snap) => {
      const dados = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPedidos(dados);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const alterarStatus = async (id, novoStatus) => {
    const pedidoRef = doc(db, "orders", id);
    await updateDoc(pedidoRef, { 
      status: novoStatus,
      atualizadoEm: Timestamp.now()
    });
  };

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center font-black italic animate-pulse">AQUECENDO A CHAPA...</div>;

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-10 font-sans">
      <header className="flex justify-between items-center mb-10 bg-white p-6 rounded-[35px] shadow-sm">
        <div>
          <h1 className="font-black italic text-2xl uppercase tracking-tighter">Burger Master</h1>
          <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.3em]">Guapiara Operation</p>
        </div>
        <div className="text-right">
          <span className="bg-green-100 text-green-600 px-4 py-1 rounded-full text-[10px] font-black uppercase italic">Loja Aberta</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pedidos.map((pedido) => (
          <div key={pedido.id} className="bg-white rounded-[45px] p-8 shadow-xl border border-gray-100 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <span className={`px-4 py-1 rounded-full text-[8px] font-black uppercase italic ${pedido.status === 'Pendente' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                {pedido.status}
              </span>
              <p className="text-[10px] font-bold text-gray-300">#{pedido.id.slice(-5).toUpperCase()}</p>
            </div>

            <h2 className="font-black text-xl uppercase italic mb-1">{pedido.clienteNome}</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-6">{pedido.endereco?.bairro} - {pedido.endereco?.rua}, {pedido.endereco?.numero}</p>

            {/* ALERTA DE SEGURANÇA DO PIX/TROCO */}
            {pedido.metodoPagamento === 'dinheiro' && (
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-3xl mb-6">
                <p className="text-[9px] font-black text-amber-700 uppercase italic mb-1">Aviso de Recebimento 💵</p>
                <p className="text-[11px] font-bold text-amber-900 leading-tight">
                  {pedido.aceitaTrocoViaPix 
                    ? "✓ CLIENTE ACEITA PIX CASO NÃO HAJA TROCO" 
                    : "⚠️ EXIGE TROCO EM ESPÉCIE"}
                </p>
                {pedido.detalhesTroco?.precisa && (
                  <p className="mt-2 text-[10px] font-black text-amber-600 uppercase italic">Levar troco para: R$ {pedido.detalhesTroco.levarPara.toFixed(2)}</p>
                )}
              </div>
            )}

            <div className="flex-1 border-t border-dashed border-gray-100 pt-6 mb-8">
              {pedido.itens?.map((item, idx) => (
                <div key={idx} className="flex justify-between mb-2">
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-tighter">{item.name} x1</p>
                  <p className="text-xs font-black italic">R$ {item.price.toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              {pedido.status === 'Pendente' ? (
                <button 
                  onClick={() => alterarStatus(pedido.id, "Preparando")}
                  className="flex-1 bg-zinc-900 text-white py-5 rounded-3xl font-black uppercase italic text-[10px] shadow-lg shadow-zinc-200"
                >Aceitar Pedido</button>
              ) : (
                <button 
                  onClick={() => alterarStatus(pedido.id, "Aguardando Entregador")}
                  className="flex-1 bg-blue-600 text-white py-5 rounded-3xl font-black uppercase italic text-[10px] shadow-lg shadow-blue-200"
                >Chamar Entregador ➔</button>
              )}
            </div>
          </div>
        ))}

        {pedidos.length === 0 && (
          <div className="col-span-full py-40 text-center opacity-10 border-4 border-dashed border-gray-200 rounded-[60px]">
            <p className="font-black italic uppercase text-2xl">Sem pedidos na chapa...</p>
          </div>
        )}
      </div>
    </main>
  );
}