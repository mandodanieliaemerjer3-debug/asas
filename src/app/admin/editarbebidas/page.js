"use client";

import { useEffect, useState } from "react";
import { db } from "../../../lib/firebase"; 
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

export default function EditarBebidas() {
  const [bebidas, setBebidas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);

  // 🏷️ GAVETAS DE TAGS PARA ATRIBUIR
  const gavetasTags = {
    marketing: ["fitness", "doce", "churrasco", "infantil", "premium", "promocao", "novidade"],
    tecnicas: ["gelado", "natural", "lata", "garrafa", "600ml", "1litro", "2litros", "3litros", "zero", "sem_acucar"],
    publico: ["familia", "amigos", "individual", "kids", "rural", "viajante"]
  };

  useEffect(() => {
    carregarBebidas();
  }, []);

  const carregarBebidas = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "bebidas"));
      const itens = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setBebidas(itens);
    } catch (e) {
      console.error("Erro ao carregar:", e);
    } finally {
      setLoading(false);
    }
  };

  const salvarEdicao = async () => {
    if (!editando) return;
    try {
      const ref = doc(db, "bebidas", editando.id);
      await updateDoc(ref, {
        nome: editando.nome || "",
        preco: Number(editando.preco || 0),
        imagem: editando.imagem || "", 
        tags: editando.tags || []
      });
      alert("✅ Dados da Adega atualizados!");
      setEditando(null);
      carregarBebidas();
    } catch (e) {
      alert("Erro ao atualizar: " + e.message);
    }
  };

  const toggleTag = (tag) => {
    const listaAtual = editando.tags || [];
    const novasTags = listaAtual.includes(tag)
      ? listaAtual.filter(t => t !== tag)
      : [...listaAtual, tag];
    setEditando({ ...editando, tags: novasTags });
  };

  if (loading) return <div className="p-10 text-white font-black italic text-center uppercase">Sincronizando Adega Mogu...</div>;

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-4 pb-20 font-sans">
      <header className="mb-8 ml-2">
        <h1 className="text-3xl font-black uppercase italic text-green-500 leading-none">Editor de Bebidas</h1>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Gestão de Tags e URLs Manuais</p>
      </header>

      {/* LISTA DE BEBIDAS */}
      <div className="grid gap-4">
        {bebidas.map(b => (
          <div key={b.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded-[2.5rem] flex items-center gap-5 shadow-2xl">
            <div className="w-20 h-20 bg-white rounded-3xl p-2 flex items-center justify-center">
              <img src={b.imagem} className="max-w-full max-h-full object-contain" alt="" />
            </div>
            
            <div className="flex-1">
              <p className="font-black text-sm uppercase italic leading-tight">{b.nome}</p>
              <p className="text-green-500 font-black text-sm mt-1">R$ {b.preco?.toFixed(2)}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {b.tags?.map(t => (
                  <span key={t} className="text-[8px] font-bold bg-zinc-800 text-green-400 px-2 py-0.5 rounded-full border border-green-900/30 uppercase">#{t}</span>
                ))}
              </div>
            </div>

            <button 
              onClick={() => setEditando(b)}
              className="bg-zinc-800 hover:bg-green-600 w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90"
            >
              ✏️
            </button>
          </div>
        ))}
      </div>

      {/* MODAL DE EDIÇÃO */}
      {editando && (
        <div className="fixed inset-0 bg-black/95 flex justify-center items-center p-4 z-50 backdrop-blur-md">
          <div className="bg-zinc-900 w-full max-w-md p-8 rounded-[3rem] border border-zinc-700 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto scrollbar-hide">
            <h2 className="text-xl font-black uppercase italic text-green-500 border-b border-zinc-800 pb-4">Ajustar Produto</h2>
            
            <div className="space-y-4">
              {/* INPUT NOME - PROTEGIDO COM || "" */}
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-zinc-500 uppercase ml-4">Identificação</p>
                <input 
                  value={editando.nome || ""} 
                  onChange={e => setEditando({...editando, nome: e.target.value})}
                  className="w-full p-4 bg-zinc-800 rounded-2xl outline-none border border-zinc-700 focus:border-green-500 font-bold"
                />
              </div>
              
              {/* INPUT PREÇO - CORRIGIDO DE UNDEFINED PARA CONTROLADO */}
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-zinc-500 uppercase ml-4">Preço de Venda</p>
                <input 
                  value={editando.preco ?? ""} 
                  type="number"
                  step="0.01"
                  onChange={e => setEditando({...editando, preco: e.target.value})}
                  className="w-full p-4 bg-zinc-800 rounded-2xl outline-none border border-zinc-700 focus:border-green-500 font-black text-green-500"
                />
              </div>

              {/* TEXTAREA IMAGEM - PROTEGIDO COM || "" */}
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-zinc-500 uppercase ml-4">URL do Firebase Storage</p>
                <textarea 
                  value={editando.imagem || ""} 
                  onChange={e => setEditando({...editando, imagem: e.target.value})}
                  className="w-full p-4 bg-zinc-800 rounded-2xl text-[10px] text-blue-400 outline-none h-24 border border-zinc-700"
                  placeholder="Cole aqui o token de download do Storage..."
                />
              </div>

              {/* SELEÇÃO DE TAGS */}
              <div className="space-y-4 pt-2">
                {Object.keys(gavetasTags).map(categoria => (
                  <div key={categoria}>
                    <p className="text-[9px] font-black uppercase text-zinc-600 mb-2 ml-2 tracking-widest">{categoria}</p>
                    <div className="flex flex-wrap gap-2">
                      {gavetasTags[categoria].map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${
                            editando.tags?.includes(tag) 
                            ? "bg-green-600 border-green-400 text-white shadow-lg" 
                            : "bg-zinc-800 border-zinc-700 text-zinc-500"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <button 
                onClick={() => setEditando(null)}
                className="flex-1 bg-zinc-800 p-5 rounded-3xl font-black text-[10px] uppercase tracking-widest text-zinc-400"
              >
                Cancelar
              </button>
              <button 
                onClick={salvarEdicao}
                className="flex-1 bg-green-500 text-zinc-950 p-5 rounded-3xl font-black text-[10px] uppercase italic shadow-xl shadow-green-900/20"
              >
                Confirmar ✅
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}