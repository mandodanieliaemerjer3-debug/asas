"use client";

import { useState, useEffect } from "react";
import { db, storage } from "../../../lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

export default function CadastroNotas() {
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [notasExistentes, setNotasExistentes] = useState([]);

  // Carrega as notas já cadastradas para você poder excluir se precisar
  const carregarNotas = async () => {
    const querySnapshot = await getDocs(collection(db, "notas_anuncios"));
    const lista = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    setNotasExistentes(lista);
  };

  useEffect(() => {
    carregarNotas();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const salvarNota = async (e) => {
    e.preventDefault();
    if (!imagePreview) return alert("Selecione uma imagem primeiro!");
    setLoading(true);

    try {
      // 1. Sobe a imagem para o Storage
      const storageRef = ref(storage, `notas/${Date.now()}.jpg`);
      await uploadString(storageRef, imagePreview, "data_url");
      const urlFinal = await getDownloadURL(storageRef);

      // 2. Salva na coleção correta que o seu page.js está lendo
      await addDoc(collection(db, "notas_anuncios"), {
        imagemUrl: urlFinal,
        createdAt: new Date().toISOString()
      });

      alert("Anúncio cadastrado com sucesso! 🚀");
      setImagePreview(null);
      carregarNotas();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar nota");
    } finally {
      setLoading(false);
    }
  };

  const excluirNota = async (id) => {
    if (confirm("Deseja remover este anúncio?")) {
      await deleteDoc(doc(db, "notas_anuncios", id));
      carregarNotas();
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 max-w-md mx-auto font-sans pb-24">
      <header className="mb-6">
        <h1 className="font-black text-2xl italic uppercase text-gray-800 leading-none">
          Portal <span className="text-blue-600">Ads Wide</span>
        </h1>
        <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Formato 3:1 (Largo e Baixo)</p>
      </header>

      <form onSubmit={salvarNota} className="space-y-4">
        <div className="bg-white p-5 rounded-[35px] shadow-sm border-2 border-blue-50">
          <label className="h-32 border-2 border-dashed border-gray-100 rounded-[30px] flex items-center justify-center cursor-pointer bg-gray-50 overflow-hidden relative">
            {imagePreview ? (
              <img src={imagePreview} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <span className="text-[10px] font-black text-gray-400 uppercase">📸 Selecionar Banner Wide</span>
                <p className="text-[8px] text-gray-300">Recomendado: 900x300px</p>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>
        </div>

        <button 
          disabled={loading} 
          className="w-full bg-blue-600 text-white p-5 rounded-[30px] font-black uppercase italic shadow-xl active:scale-95 transition"
        >
          {loading ? "Subindo..." : "Publicar Anúncio"}
        </button>
      </form>

      <div className="mt-10">
        <h2 className="text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest">Anúncios Ativos</h2>
        <div className="space-y-4">
          {notasExistentes.map((nota) => (
            <div key={nota.id} className="relative bg-white p-2 rounded-[25px] shadow-sm border border-gray-100">
              <img src={nota.imagemUrl} className="w-full h-20 object-cover rounded-[20px]" />
              <button 
                onClick={() => excluirNota(nota.id)}
                className="absolute -top-2 -right-2 bg-red-600 text-white w-8 h-8 rounded-full font-bold shadow-lg"
              >
                X
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}