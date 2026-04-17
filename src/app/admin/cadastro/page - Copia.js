"use client";
import { useState } from "react";
import { db, storage } from "../../../lib/firebase"; 
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import restaurantesLocais from "../../../data/restaurantes.json";

export default function CadastroComGavetas() {
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "", price: "", precoInterno: "", coinPrice: "", restaurantId: ""
  });

  // GAVETAS DE TAGS (Você pode adicionar mais aqui depois)
  const gavetas = {
    periodos: ["#manha", "#almoco", "#tarde", "#noite", "#madrugada"],
    paises: ["#brasil", "#japao", "#mexico", "#italia", "#china", "#eua"],
    tipos: ["#marmita", "#sushi", "#pizza", "#lanche", "#doce", "#bebida", "#salgado"],
    selos: ["#fitness", "#altagastronomia", "#bolos", "#festas", "#promocao"]
  };

  const [tagsSelecionadas, setTagsSelecionadas] = useState([]);

  // Função para abrir/fechar tag na gaveta
  const toggleTag = (tag) => {
    if (tagsSelecionadas.includes(tag)) {
      setTagsSelecionadas(tagsSelecionadas.filter(t => t !== tag));
    } else {
      setTagsSelecionadas([...tagsSelecionadas, tag]);
    }
  };

  const salvarProduto = async (e) => {
    e.preventDefault();
    if (!imagePreview || !formData.restaurantId) return alert("Falta foto ou restaurante!");
    setLoading(true);

    try {
      const storageRef = ref(storage, `produtos/${Date.now()}.jpg`);
      await uploadString(storageRef, imagePreview, "data_url");
      const urlFinal = await getDownloadURL(storageRef);

      await addDoc(collection(db, "products"), {
        ...formData,
        price: parseFloat(formData.price),
        precoInterno: parseFloat(formData.precoInterno || 0),
        coinPrice: parseInt(formData.coinPrice || 0),
        image: urlFinal,
        tags: tagsSelecionadas.join(''), // Junta tudo em: #almoco#brasil#marmita
        createdAt: new Date().toISOString()
      });

      alert("Produto salvo com todas as tags! 🚀");
      location.reload(); // Limpa tudo
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  // ... (Sua função handleImageChange com compressor aqui)

  return (
    <main className="min-h-screen bg-gray-50 p-4 max-w-md mx-auto font-sans pb-24">
      <h1 className="font-black text-xl italic uppercase text-gray-800 mb-4">Novo Item (Gavetas)</h1>

      <form onSubmit={salvarProduto} className="space-y-4">
        
        {/* FOTO E INFO BÁSICA */}
        <div className="bg-white p-4 rounded-[30px] shadow-sm space-y-3">
          <label className="h-40 border-2 border-dashed border-gray-100 rounded-[25px] flex items-center justify-center cursor-pointer bg-gray-50 overflow-hidden">
            {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" /> : <span className="text-[10px] font-black text-gray-400 uppercase">📸 Foto do Lanche</span>}
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>
          
          <input type="text" required placeholder="Nome do Produto" className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-none"
            onChange={(e) => setFormData({...formData, name: e.target.value})} />

          <select required className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-none text-xs"
            onChange={(e) => setFormData({...formData, restaurantId: e.target.value})}>
            <option value="">Selecione o Restaurante</option>
            {restaurantesLocais.map(res => <option key={res.id} value={res.id}>{res.name}</option>)}
          </select>
        </div>

        {/* GAVETAS DE TAGS */}
        <div className="space-y-4">
          {Object.keys(gavetas).map((nomeGaveta) => (
            <div key={nomeGaveta} className="bg-white p-4 rounded-[30px] shadow-sm">
              <p className="text-[9px] font-black uppercase text-red-600 mb-3 ml-1 tracking-widest">{nomeGaveta}</p>
              <div className="flex flex-wrap gap-2">
                {gavetas[nomeGaveta].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                      tagsSelecionadas.includes(tag) 
                      ? "bg-red-600 text-white shadow-md scale-105" 
                      : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {tag.replace('#', '')}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* TAGS ATUAIS (VISUALIZAÇÃO) */}
        <div className="p-2">
          <p className="text-[8px] font-bold text-gray-400 uppercase italic">Preview das Tags:</p>
          <p className="text-[10px] font-black text-red-600 break-all">{tagsSelecionadas.join('')}</p>
        </div>

        {/* FINANCEIRO */}
        <div className="bg-white p-4 rounded-[30px] shadow-sm grid grid-cols-2 gap-2">
            <input type="number" step="0.01" placeholder="Venda R$" className="p-4 bg-gray-50 rounded-2xl font-bold text-green-600"
              onChange={(e) => setFormData({...formData, price: e.target.value})} />
            <input type="number" step="0.01" placeholder="Custo R$" className="p-4 bg-gray-50 rounded-2xl font-bold text-orange-600"
              onChange={(e) => setFormData({...formData, precoInterno: e.target.value})} />
            <input type="number" placeholder="🪙 Moedas" className="p-4 bg-gray-50 rounded-2xl font-bold text-yellow-600 col-span-2"
              onChange={(e) => setFormData({...formData, coinPrice: e.target.value})} />
        </div>

        <button disabled={loading} className="w-full bg-red-600 text-white p-5 rounded-[25px] font-black uppercase italic shadow-xl shadow-red-100 active:scale-95 transition">
          {loading ? "Processando..." : "Salvar no PapáCash"}
        </button>
      </form>
    </main>
  );
}