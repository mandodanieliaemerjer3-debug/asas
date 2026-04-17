"use client";

import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs
} from "firebase/firestore";

// 🔥 extrair ID do youtube automaticamente
function extrairYoutubeId(url) {
  if (!url) return "";

  try {
    // shorts
    if (url.includes("shorts/")) {
      return url.split("shorts/")[1].split("?")[0];
    }

    // watch?v=
    if (url.includes("v=")) {
      return url.split("v=")[1].split("&")[0];
    }

    // embed
    if (url.includes("embed/")) {
      return url.split("embed/")[1].split("?")[0];
    }

    // se já for ID
    return url;
  } catch {
    return url;
  }
}

export default function PainelAnuncios() {
  const [videoInput, setVideoInput] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tags, setTags] = useState("");
  const [tipoAcao, setTipoAcao] = useState("whatsapp");

  const [produtoId, setProdutoId] = useState("");
  const [empresaId, setEmpresaId] = useState("");
  const [empresas, setEmpresas] = useState([]);

  const [limiteViews, setLimiteViews] = useState(1000);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function carregarEmpresas() {
      const snap = await getDocs(collection(db, "empresas"));
      const lista = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmpresas(lista);
    }

    carregarEmpresas();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const youtubeId = extrairYoutubeId(videoInput);

    if (!youtubeId || !empresaId) {
      return alert("Preencha vídeo e empresa");
    }

    setLoading(true);

    try {
      await addDoc(collection(db, "ads_mogu"), {
        youtubeId,
        descricao,

        tags: tags
          .split(",")
          .map(t => t.trim().toLowerCase())
          .filter(Boolean),

        tipoAcao,
        produtoId: tipoAcao === "carrinho" ? produtoId : null,

        empresaId,

        views: 0,
        cliques: 0,
        limiteViews: Number(limiteViews),

        ativo: true,
        criadoPor: "admin",
        dataCriacao: serverTimestamp()
      });

      alert("✅ Anúncio criado!");

      setVideoInput("");
      setDescricao("");
      setTags("");
      setProdutoId("");
      setEmpresaId("");

    } catch (err) {
      console.error(err);
      alert("Erro ao criar anúncio");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-zinc-900 text-white flex justify-center items-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl bg-zinc-800 p-6 rounded-2xl space-y-4"
      >
        <h1 className="text-xl font-bold">Criar Anúncio</h1>

        {/* 🔥 aceita link ou ID */}
        <input
          value={videoInput}
          onChange={(e) => setVideoInput(e.target.value)}
          placeholder="Cole o link do YouTube ou ID"
          className="w-full p-3 rounded bg-zinc-700"
        />

        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descrição"
          className="w-full p-3 rounded bg-zinc-700"
        />

        <select
          value={empresaId}
          onChange={(e) => setEmpresaId(e.target.value)}
          className="w-full p-3 rounded bg-zinc-700"
        >
          <option value="">Selecionar empresa</option>
          {empresas.map(emp => (
            <option key={emp.id} value={emp.id}>
              {emp.nome}
            </option>
          ))}
        </select>

        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags (sushi, pizza...)"
          className="w-full p-3 rounded bg-zinc-700"
        />

        <select
          value={tipoAcao}
          onChange={(e) => setTipoAcao(e.target.value)}
          className="w-full p-3 rounded bg-zinc-700"
        >
          <option value="whatsapp">WhatsApp</option>
          <option value="carrinho">Carrinho</option>
        </select>

        {tipoAcao === "carrinho" && (
          <input
            value={produtoId}
            onChange={(e) => setProdutoId(e.target.value)}
            placeholder="ID do produto"
            className="w-full p-3 rounded bg-zinc-700"
          />
        )}

        <input
          type="number"
          value={limiteViews}
          onChange={(e) => setLimiteViews(e.target.value)}
          placeholder="Limite de views"
          className="w-full p-3 rounded bg-zinc-700"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 py-3 rounded font-bold"
        >
          {loading ? "Criando..." : "Criar anúncio"}
        </button>
      </form>
    </main>
  );
}
