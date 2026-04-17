"use client";
import { useState, useEffect } from "react";
import { db } from "../../../lib/firebase";
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import restaurantesLocais from "../../../data/restaurantes.json";

export default function GestaoCardapio() {
  const [products, setProducts] = useState([]);
  const [editingItem, setEditingItem] = useState(null); // Item selecionado para o Popup
  const [loading, setLoading] = useState(true);

  // 1. Busca produtos do Firebase
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snap) => {
      const p = [];
      snap.forEach(doc => p.push({ id: doc.id, ...doc.data() }));
      setProducts(p);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 2. Função para Salvar Edição
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const itemRef = doc(db, "products", editingItem.id);
      await updateDoc(itemRef, {
        name: editingItem.name,
        price: parseFloat(editingItem.price),
        precoInterno: parseFloat(editingItem.precoInterno || 0),
        category: editingItem.category
      });
      setEditingItem(null);
      alert("Atualizado com sucesso!");
    } catch (err) {
      alert("Erro ao atualizar.");
    }
  };

  // 3. Função para Excluir
  const handleDelete = async (id) => {
    if (confirm("Tem certeza que deseja apagar este item?")) {
      await deleteDoc(doc(db, "products", id));
    }
  };

  const getRestauranteNome = (id) => {
    const res = restaurantesLocais.find(r => r.id === id);
    return res ? res.name : "Desconhecido";
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 font-sans pb-20 max-w-2xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <h1 className="font-black text-xl uppercase italic text-gray-800">Gestão de Itens</h1>
        <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-[10px] font-black italic uppercase">ADM</span>
      </header>

      {loading ? (
        <p className="text-center py-20 font-bold text-gray-400 animate-pulse uppercase text-xs">Carregando Itens...</p>
      ) : (
        <div className="flex flex-col gap-3">
          {products.map(item => (
            <div 
              key={item.id} 
              className="bg-white p-3 rounded-[24px] border border-gray-100 shadow-sm flex items-center justify-between group active:scale-[0.98] transition"
            >
              <div className="flex items-center gap-3">
                <img src={item.image} className="w-12 h-12 rounded-2xl object-cover bg-gray-100" />
                <div>
                  <p className="text-[8px] font-black text-red-600 uppercase tracking-tighter">{getRestauranteNome(item.restaurantId)}</p>
                  <h3 className="font-bold text-sm text-gray-800 uppercase leading-none">{item.name}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] font-black text-green-600">Venda: R${item.price.toFixed(2)}</span>
                    <span className="text-[10px] font-bold text-gray-400">Int: R${item.precoInterno || 0}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setEditingItem(item)}
                  className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-lg"
                >
                  📝
                </button>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center text-lg"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* POPUP DE EDIÇÃO (MODAL) */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[35px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="font-black text-xl uppercase italic mb-6 text-gray-800">Editar Produto</h2>
            
            <form onSubmit={handleUpdate} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Nome</label>
                <input 
                  className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold"
                  value={editingItem.name}
                  onChange={e => setEditingItem({...editingItem, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Preço Venda (App)</label>
                  <input 
                    type="number" step="0.01"
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-green-600"
                    value={editingItem.price}
                    onChange={e => setEditingItem({...editingItem, price: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Preço Interno (Custo)</label>
                  <input 
                    type="number" step="0.01"
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-orange-600"
                    value={editingItem.precoInterno || ""}
                    onChange={e => setEditingItem({...editingItem, precoInterno: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button 
                  type="button" 
                  onClick={() => setEditingItem(null)}
                  className="flex-1 p-4 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase italic"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-[2] p-4 bg-red-600 text-white rounded-2xl font-black uppercase italic shadow-lg shadow-red-200"
                >
                  Salvar Mudanças
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}