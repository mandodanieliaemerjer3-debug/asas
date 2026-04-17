"use client";

import { useState } from "react";
import { db } from "../../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function CadastroEmpresa() {
  const [nome, setNome] = useState("");
  const [whatsNumero, setWhatsNumero] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nome || !whatsNumero) {
      return alert("Preencha nome e WhatsApp");
    }

    setLoading(true);

    try {
      await addDoc(collection(db, "empresas"), {
        nome,
        whatsNumero,
        cidade: cidade || null,
        bairro: bairro || null,
        ativo: true,
        dataCriacao: serverTimestamp()
      });

      alert("✅ Empresa cadastrada!");

      // reset
      setNome("");
      setWhatsNumero("");
      setCidade("");
      setBairro("");

    } catch (err) {
      console.error(err);
      alert("Erro ao cadastrar empresa");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-zinc-900 text-white flex justify-center items-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl bg-zinc-800 p-6 rounded-2xl space-y-4 shadow-lg"
      >
        <h1 className="text-xl font-bold">Cadastrar Empresa</h1>

        {/* 🏪 Nome */}
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome da empresa"
          className="w-full p-3 rounded bg-zinc-700"
        />

        {/* 📱 WhatsApp */}
        <input
          value={whatsNumero}
          onChange={(e) => setWhatsNumero(e.target.value)}
          placeholder="WhatsApp (ex: 5511999999999)"
          className="w-full p-3 rounded bg-zinc-700"
        />

        {/* 📍 Localização */}
        <div className="grid grid-cols-2 gap-4">
          <input
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            placeholder="Cidade"
            className="p-3 rounded bg-zinc-700"
          />
          <input
            value={bairro}
            onChange={(e) => setBairro(e.target.value)}
            placeholder="Bairro"
            className="p-3 rounded bg-zinc-700"
          />
        </div>

        {/* 🚀 Botão */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 py-3 rounded font-bold"
        >
          {loading ? "Salvando..." : "Cadastrar empresa"}
        </button>
      </form>
    </main>
  );
}