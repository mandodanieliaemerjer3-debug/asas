"use client";
import { useState, useEffect } from "react";
import { db } from "../../../lib/firebase";
import { collection, query, where, onSnapshot, doc, writeBatch, Timestamp } from "firebase/firestore";

export default function PainelOffRoad({ perfil }) {
  const [cargaLinha, setCargaLinha] = useState([]);
  const [linhaSelecionada, setLinhaSelecionada] = useState(perfil.linhasConhecidas?.[0] || "1");
  const [conferidos, setConferidos] = useState([]);

  // 1. MONITORAMENTO DA CARGA DA LINHA
  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      where("status", "==", "Aguardando Entregador"),
      where("endereco.linhaId", "==", String(linhaSelecionada))
    );

    const unsub = onSnapshot(q, (snap) => {
      const pedidos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCargaLinha(pedidos);
    });

    return () => unsub();
  }, [linhaSelecionada]);

  // 2. LOGICA DE CONFERENCIA MANUAL (CHECKLIST)
  const alternarConferencia = (id) => {
    setConferidos(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // 3. SAÍDA EM COMBOIO (ATUALIZAÇÃO EM MASSA)
  const iniciarSaidaComboio = async () => {
    if (cargaLinha.length === 0) return;
    
    const batch = writeBatch(db); // Usa batch para atualizar todos de uma vez
    
    cargaLinha.forEach((pedido) => {
      const ref = doc(db, "orders", pedido.id);
      batch.update(ref, {
        status: "Em Rota",
        entregadorId: perfil.uid,
        saidaComboioEm: Timestamp.now()
      });
    });

    try {
      await batch.commit();
      alert(`Comboio Iniciado! ${cargaLinha.length} pedidos em rota para a Linha ${linhaSelecionada}.`);
    } catch (e) {
      console.error("Erro na saída:", e);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 pb-24 font-sans">
      {/* SELETOR DE LINHA ATIVA */}
      <header className="bg-white p-6 rounded-b-[40px] shadow-md border-b-4 border-orange-500">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Carga Programada</p>
        <div className="flex justify-between items-end">
          <div>
            <span className="text-xs font-bold text-gray-400">Linha Atendida:</span>
            <select 
              value={linhaSelecionada} 
              onChange={(e) => setLinhaSelecionada(e.target.value)}
              className="block font-black text-orange-600 bg-transparent border-none text-xl p-0 focus:ring-0 italic"
            >
              {perfil.linhasConhecidas?.map(l => (
                <option key={l} value={l}>LINHA {l}</option>
              ))}
            </select>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-gray-900">{cargaLinha.length}</p>
            <p className="text-[8px] font-black uppercase text-gray-400 leading-none">Pedidos</p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* CHECKLIST DE CARGA */}
        <div className="bg-white rounded-[35px] p-6 shadow-sm border border-orange-100">
          <h2 className="text-[10px] font-black uppercase text-gray-400 mb-4 border-b pb-2">Checklist de Saída (19:00h)</h2>
          
          <div className="space-y-3">
            {cargaLinha.length === 0 && (
              <p className="text-center py-10 text-gray-300 font-bold uppercase text-[10px]">Sem carga para esta linha no momento.</p>
            )}
            
            {cargaLinha.map(p => (
              <div 
                key={p.id} 
                onClick={() => alternarConferencia(p.id)}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${conferidos.includes(p.id) ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-transparent'}`}
              >
                <div className="flex-1">
                  <p className="font-black text-xs text-gray-800 uppercase italic leading-none">{p.clienteNome}</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Bairro: {p.endereco?.bairro}</p>
                </div>
                <div className="text-xl">{conferidos.includes(p.id) ? '✅' : '📦'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* BOTÃO DE SAÍDA COLETIVA */}
        {cargaLinha.length > 0 && (
          <button 
            onClick={iniciarSaidaComboio}
            disabled={conferidos.length < cargaLinha.length}
            className={`w-full py-6 rounded-3xl font-black uppercase italic text-sm shadow-xl transition-all ${conferidos.length === cargaLinha.length ? 'bg-orange-600 text-white active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            {conferidos.length < cargaLinha.length 
              ? `Faltam ${cargaLinha.length - conferidos.length} para conferir` 
              : "Iniciar Saída de Comboio 🚀"
            }
          </button>
        )}
      </div>

      <footer className="p-10 text-center opacity-20">
        <p className="text-[8px] font-black uppercase italic tracking-[0.4em]">Logística Rural Elite</p>
      </footer>
    </div>
  );
}