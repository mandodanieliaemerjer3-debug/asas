"use client";
import { useState } from "react";
import { db } from "../../../lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function AdminDoces() {
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [descricao, setDescricao] = useState("");
  const [imagem, setImagem] = useState("");
  const [loading, setLoading] = useState(false);

  const salvarDoce = async () => {
    if (!nome || !preco) {
      alert("Preencha nome e preço");
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, "doces"), {
        nome,
        preco: Number(preco),
        descricao,
        imagem,
        ativo: true,
        tipo: "doce",
        criadoEm: new Date().toISOString()
      });

      alert("Doce cadastrado!");
      setNome("");
      setPreco("");
      setDescricao("");
      setImagem("");
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">Cadastrar Doce</h1>

      <input
        placeholder="Nome"
        value={nome}
        onChange={e => setNome(e.target.value)}
        className="w-full p-3 mb-2 border rounded"
      />

      <input
        placeholder="Preço"
        value={preco}
        onChange={e => setPreco(e.target.value)}
        className="w-full p-3 mb-2 border rounded"
      />

      <input
        placeholder="Imagem URL"
        value={imagem}
        onChange={e => setImagem(e.target.value)}
        className="w-full p-3 mb-2 border rounded"
      />

      <textarea
        placeholder="Descrição"
        value={descricao}
        onChange={e => setDescricao(e.target.value)}
        className="w-full p-3 mb-2 border rounded"
      />

      <button
        onClick={salvarDoce}
        disabled={loading}
        className="w-full bg-black text-white p-3 rounded"
      >
        {loading ? "Salvando..." : "Salvar Doce"}
      </button>
    </div>
  );
}