"use client";
import { useState, useEffect } from "react";
import { db } from "../../../lib/firebase"; // Caminho corrigido para 3 níveis de pasta
import { 
  collection, query, orderBy, onSnapshot, 
  doc, deleteDoc, updateDoc 
} from "firebase/firestore";

export default function OrdersAdminPage() {
  const [pedidos, setPedidos] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [loading, setLoading] = useState(true);

  // ==========================================
  // 🟢 SINCRONIZAÇÃO EM TEMPO REAL
  // ==========================================
  useEffect(() => {
    // Busca os pedidos do mais novo para o mais velho
    const q = query(collection(db, "orders"), orderBy("criadoEm", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listaPedidos = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setPedidos(listaPedidos);
      setLoading(false);
    }, (error) => {
      console.error("Erro no Snapshot:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ==========================================
  // 🛠️ AÇÕES DO PAINEL
  // ==========================================
  const excluirPedido = async (id) => {
    if (window.confirm("Tem certeza que deseja apagar este pedido?")) {
      await deleteDoc(doc(db, "orders", id));
    }
  };

  const mudarStatus = async (id, novoStatus) => {
    await updateDoc(doc(db, "orders", id), { status: novoStatus });
  };

  const pedidosFiltrados = filtroStatus === "Todos" 
    ? pedidos 
    : pedidos.filter(p => p.status === filtroStatus);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="font-black animate-pulse text-gray-400 uppercase italic">Conectando Central de Pedidos...</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50 p-4 pb-20 font-sans">
      
      {/* HEADER DO PAINEL */}
      <header className="max-w-4xl mx-auto mb-8 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
        <h1 className="text-3xl font-black uppercase italic tracking-tighter text-gray-900">📦 Central de Pedidos</h1>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Logística Guapiara • Monitoramento Ativo</p>
        
        {/* FILTROS DE STATUS */}
        <div className="flex gap-2 mt-6 overflow-x-auto pb-2 no-scrollbar">
          {["Todos", "Aguardando Entregador", "Em Produção", "Saiu para Entrega", "Entregue"].map(status => (
            <button
              key={status}
              onClick={() => setFiltroStatus(status)}
              className={`px-6 py-2 rounded-full text-[10px] font-black uppercase transition-all flex-shrink-0 ${
                filtroStatus === status ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "bg-gray-100 text-gray-400"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </header>

      {/* LISTA DE PEDIDOS */}
      <section className="max-w-4xl mx-auto space-y-4">
        {pedidosFiltrados.length === 0 && (
          <div className="text-center p-20 bg-white rounded-[40px] text-gray-300 font-bold uppercase text-xs italic">
            Nenhum pedido nesta categoria.
          </div>
        )}

        {pedidosFiltrados.map((pedido) => (
          <div key={pedido.id} className="bg-white rounded-[40px] p-7 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 justify-between transition-all hover:shadow-md">
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase italic ${
                  pedido.status === "Aguardando Entregador" ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"
                }`}>
                  {pedido.status}
                </span>
                <span className="text-[10px] font-bold text-gray-300 tracking-widest">ID: {pedido.id.slice(-6).toUpperCase()}</span>
              </div>
              
              <h2 className="text-2xl font-black uppercase italic text-gray-900 leading-none mb-1">{pedido.clienteNome}</h2>
              <p className="text-[11px] font-bold text-blue-600 uppercase tracking-tight">
                📍 {pedido.endereco.bairro} — {pedido.endereco.rua}, {pedido.endereco.numero}
              </p>
              
              {pedido.endereco.linhaId && (
                <div className="mt-3 bg-red-50 inline-block px-3 py-1 rounded-lg">
                  <p className="text-[9px] font-black text-red-600 uppercase italic">🚀 ROTA RURAL: LINHA {pedido.endereco.linhaId}</p>
                </div>
              )}

              <div className="mt-5 pt-4 border-t border-dashed border-gray-100">
                <p className="text-[9px] font-black text-gray-400 uppercase mb-2">Itens do Pedido:</p>
                {pedido.itens?.map((item, idx) => (
                  <div key={idx} className="text-xs font-bold text-gray-600 flex justify-between max-w-xs">
                    <span>• {item.name}</span>
                    <span className="text-gray-400">R$ {item.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* FINANCEIRO E BOTÕES */}
            <div className="md:text-right flex flex-col justify-between border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8 min-w-[200px]">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor Total</p>
                <p className="text-3xl font-black text-gray-900 italic tracking-tighter">R$ {pedido.valores?.total.toFixed(2)}</p>
                <div className="flex md:justify-end gap-2 text-[9px] font-bold text-gray-400 uppercase mt-1">
                   <span>Produtos: R$ {pedido.valores?.subtotal.toFixed(2)}</span>
                   <span>|</span>
                   <span className="text-blue-500">Frete: R$ {pedido.valores?.taxaEntrega.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex md:flex-col gap-2 mt-8">
                <select 
                  className="flex-1 bg-gray-900 text-white p-4 rounded-2xl text-[10px] font-black uppercase outline-none cursor-pointer hover:bg-black transition"
                  value={pedido.status}
                  onChange={(e) => mudarStatus(pedido.id, e.target.value)}
                >
                  <option value="Aguardando Entregador">Aguardando Entregador</option>
                  <option value="Em Produção">Em Produção</option>
                  <option value="Saiu para Entrega">Saiu para Entrega</option>
                  <option value="Entregue">Pedido Concluído</option>
                </select>

                <button 
                  onClick={() => excluirPedido(pedido.id)}
                  className="bg-red-50 text-red-500 px-6 py-4 rounded-2xl text-[10px] font-black uppercase active:scale-95 transition hover:bg-red-100"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}