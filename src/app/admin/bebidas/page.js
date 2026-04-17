"use client";

import { useState } from "react";
import { db, storage } from "../../../lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function CadastroBebidas() {
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [imagem, setImagem] = useState(null);
  const [tags, setTags] = useState([]);
  const [inputTag, setInputTag] = useState("");
  const [loading, setLoading] = useState(false);

  // 💡 sugestões prontas (gaveta)
  const sugestoes = [
    "cocacola",
    "sem_acucar",
    "zero",
    "natural",
    "suco",
    "refrigerante",
    "gelado",
    "energetico",
    "alcoolico",
    "premium",
    "barato",
    "lata",
    "garrafa",
    "2l",
    "600ml"
  ];

  const adicionarTag = (tag) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const removerTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  const salvar = async (e) => {
    e.preventDefault();

    if (!nome || !preco || !imagem) {
      return alert("Preencha tudo");
    }

    setLoading(true);

    try {
      const nomeArquivo = `bebidas/${Date.now()}-${imagem.name}`;
      const storageRef = ref(storage, nomeArquivo);

      await uploadBytes(storageRef, imagem);
      const urlImagem = await getDownloadURL(storageRef);

      await addDoc(collection(db, "bebidas"), {
        nome,
        preco: Number(preco),
        imagem: urlImagem,
        tags, // 🔥 salvando tags
        ativo: true
      });

      alert("Bebida cadastrada!");

      setNome("");
      setPreco("");
      setImagem(null);
      setTags([]);
      setInputTag("");

    } catch (err) {
      console.error(err);
      alert("Erro ao salvar");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen flex justify-center items-center bg-zinc-900 text-white">
      <form onSubmit={salvar} className="bg-zinc-800 p-6 rounded-2xl w-full max-w-md space-y-3">
        <h1 className="text-xl font-bold">Cadastrar Bebida</h1>

        <input
          value={nome}
          onChange={e => setNome(e.target.value)}
          placeholder="Nome"
          className="w-full p-3 bg-zinc-700 rounded"
        />

        <input
          value={preco}
          onChange={e => setPreco(e.target.value)}
          placeholder="Preço"
          type="number"
          className="w-full p-3 bg-zinc-700 rounded"
        />

        <input
          type="file"
          accept="image/*"
          onChange={e => setImagem(e.target.files[0])}
          className="w-full p-3 bg-zinc-700 rounded"
        />

        {/* 🏷️ TAGS */}
        <div>
          <p className="text-sm mb-1">Tags de interesse</p>

          {/* input manual */}
          <div className="flex gap-2">
            <input
              value={inputTag}
              onChange={e => setInputTag(e.target.value)}
              placeholder="digitar tag"
              className="flex-1 p-2 bg-zinc-700 rounded"
            />
            <button
              type="button"
              onClick={() => {
                if (inputTag) {
                  adicionarTag(inputTag.toLowerCase());
                  setInputTag("");
                }
              }}
              className="bg-blue-500 px-3 rounded"
            >
              +
            </button>
          </div>

          {/* tags selecionadas */}
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map(tag => (
              <span
                key={tag}
                onClick={() => removerTag(tag)}
                className="bg-green-600 px-2 py-1 rounded text-xs cursor-pointer"
              >
                #{tag} ✕
              </span>
            ))}
          </div>

          {/* sugestões (gaveta) */}
          <div className="flex flex-wrap gap-2 mt-3">
            {sugestoes.map(tag => (
              <button
                type="button"
                key={tag}
                onClick={() => adicionarTag(tag)}
                className="bg-zinc-700 px-2 py-1 rounded text-xs"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        <button
          disabled={loading}
          className="w-full bg-green-500 p-3 rounded font-bold disabled:opacity-50"
        >
          {loading ? "Salvando..." : "Salvar"}
        </button>
      </form>
    </main>
  );
}