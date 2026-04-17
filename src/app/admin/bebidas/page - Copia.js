"use client";

import { useState } from "react";
import { db } from "../../../lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function CadastroBebidas() {
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [imagem, setImagem] = useState("");
  const [loading, setLoading] = useState(false);

  const salvar = async (e) => {
    e.preventDefault();

    if (!nome || !preco) return alert("Preencha tudo");

    setLoading(true);

    try {
      await addDoc(collection(db, "bebidas"), {
        nome,
        preco: Number(preco),
        imagem,
        ativo: true
      });

      alert("Bebida cadastrada!");

      setNome("");
      setPreco("");
      setImagem("");

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
          value={imagem}
          onChange={e => setImagem(e.target.value)}
          placeholder="URL da imagem"
          className="w-full p-3 bg-zinc-700 rounded"
        />

        <button className="w-full bg-green-500 p-3 rounded font-bold">
          {loading ? "Salvando..." : "Salvar"}
        </button>
      </form>
    </main>
  );
}