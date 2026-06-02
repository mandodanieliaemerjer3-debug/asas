"use client";

import { useState } from "react";
import { db } from "../../../lib/firebase"; // Sem necessidade de 'storage' aqui
import { collection, addDoc } from "firebase/firestore";

export default function CadastroBebidasSimplificado() {
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [fotoId, setFotoId] = useState(""); // Ex: 1, 2, 3...
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);

  // URL BASE do seu Storage (Pegue no seu console do Firebase)
  const URL_BASE = "https://firebasestorage.googleapis.com/v0/b/studio-7633049135-6e41d.appspot.com/o/bebidas%2F";

  const salvar = async (e) => {
    e.preventDefault();
    if (!nome || !preco || !fotoId) return alert("Preencha Nome, Preço e o ID da Foto!");

    setLoading(true);
    try {
      // Monta o link da imagem que você subiu manualmente
      const urlFinal = `${URL_BASE}${fotoId}.jpg?alt=media`;

      await addDoc(collection(db, "bebidas"), {
        nome,
        preco: Number(preco),
        imagem: urlFinal,
        tags,
        ativo: true,
        criadoEm: new Date().toISOString()
      });

      alert("✅ Bebida vinculada com sucesso!");
      setNome(""); setPreco(""); setFotoId(""); setTags([]);
    } catch (err) {
      alert("Erro ao salvar no Firestore: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex justify-center items-center bg-zinc-900 text-white p-4">
      <form onSubmit={salvar} className="bg-zinc-800 p-6 rounded-[2rem] w-full max-w-md space-y-4 border border-zinc-700">
        <h1 className="text-xl font-black uppercase italic text-green-500">Cadastro por ID de Foto</h1>
        
        <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome da Bebida" className="w-full p-3 bg-zinc-700 rounded-xl outline-none" />
        <input value={preco} onChange={e => setPreco(e.target.value)} placeholder="Preço" type="number" className="w-full p-3 bg-zinc-700 rounded-xl outline-none" />
        
        <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-600">
          <p className="text-[10px] font-bold text-zinc-400 mb-2 uppercase">Número da Imagem (Subida no Firebase)</p>
          <input 
            value={fotoId} 
            onChange={e => setFotoId(e.target.value)} 
            placeholder="Ex: 1" 
            className="w-full p-2 bg-zinc-800 rounded border border-zinc-600 text-center text-xl font-bold" 
          />
        </div>

        <button disabled={loading} className="w-full bg-green-500 text-zinc-900 p-4 rounded-2xl font-black uppercase italic">
          {loading ? "Salvando..." : "Confirmar Cadastro"}
        </button>
      </form>
    </main>
  );
}