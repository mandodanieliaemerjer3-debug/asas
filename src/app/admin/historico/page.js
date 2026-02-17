"use client";
import { useState, useEffect } from "react";
import { db } from "../../../lib/firebase";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";

export default function HistoricoGeral() {
  const [pedidos, setPedidos] = useState([]);
  const [filtroNivel, setFiltroNivel] = useState("Todos");
  const [filtroStatus, setFiltroStatus] = useState("Todos");

  useEffect(() => {
    // Escuta todos os pedidos do banco, ordenados pelo mais recente
    const q = query(collection(db, "orders"), orderBy("data", "desc"));
    
    const unsub = onSnapshot(q, (snap) => {
      setPedidos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, []);

  // Lógica de Filtros
  const pedidosFiltrados = pedidos.filter(p => {
    const bateNivel = filtroNivel === "Todos" || p.endereco?.nivelTerreno === filtroNivel;
    const bateStatus = filtroStatus === "Todos" || p.status === filtroStatus;
    return bateNivel && bateStatus;
  });

  return (
    <main className="min-h-screen bg-gray-50 p-6 font-sans max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-black uppercase italic italic tracking-tighter">Histórico de Corridas</h1>
        <p className="text-[10px] font-bold text-gray-400 uppercase">Monitoramento em tempo real do banco de dados</p>
      </header>

      {/* BARRA DE FILTROS */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        <div>
          <p className="text-[8px] font-black uppercase text-gray-400 mb-1">Tipo de Terreno</p>
          <select 
            className="bg-white p-2 rounded-lg text-xs font-bold border-none shadow-sm outline-none"
            onChange={(e) => setFiltroNivel(e.target.value)}
          >
            <option value="Todos">Todos os Níveis</option>
            <option value="Asfalto Zero">Asfalto Zero</option>
            <option value="Desbravador">Desbravador</option>
            <option value="Off-Road Root">Off-Road Root</option>
          </select>
        </div>

        <div>
          <p className="text-[8px] font-black uppercase text-gray-400 mb-1">Status</p>
          <select 
            className="bg-white p-2 rounded-lg text-xs font-bold border-none shadow-sm outline-none"
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="Todos">Todos os Status</option>
            <option value="Em Produção">Em Produção</option>
            <option value="Aguardando Entregador">Aguardando Entregador</option>
            <option value="Pendente">Pendente</option>
            <option value="Em Rota">Em Rota</option>
            <option value="Entregue">Entregue</option>
          </select>
        </div>
      </div>

      {/* TABELA DE DADOS */}
      <div className="bg-white rounded-[30px] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-900 text-white text-[10px] uppercase font-black italic">
              <th className="p-4">ID</th>
              <th className="p-4">Bairro / Nível</th>
              <th className="p-4">Valor</th>
              <th className="p-4">Status</th>
              <th className="p-4">Entregador</th>
            </tr>
          </thead>
          <tbody className="text-[11px] font-bold">
            {pedidosFiltrados.map((p) => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                <td className="p-4 text-gray-300">#{p.id.slice(-5)}</td>
                <td className="p-4">
                  <p className="uppercase">{p.endereco?.bairro}</p>
                  <span className={`text-[8px] px-2 py-0.5 rounded-full ${
                    p.endereco?.nivelTerreno === 'Off-Road Root' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {p.endereco?.nivelTerreno}
                  </span>
                </td>
                <td className="p-4">R$ {p.valores?.total?.toFixed(2)}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-md text-[9px] uppercase font-black ${
                    p.status === 'Entregue' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="p-4 text-gray-500 italic">
                  {p.entregadorNome || "Sem dono"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pedidosFiltrados.length === 0 && (
          <div className="p-20 text-center opacity-20 font-black uppercase italic">Nenhum dado encontrado para este filtro</div>
        )}
      </div>
    </main>
  );
}