"use client";

import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { 
  collection, 
  addDoc, 
  serverTimestamp,
  getDocs 
} from "firebase/firestore";

export default function PainelAnuncios() {
  const [youtubeId, setYoutubeId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tags, setTags] = useState("");
  const [tipoAcao, setTipoAcao] = useState("carrinho");

  const [produtoId, setProdutoId] = useState("");
  const [empresaId, setEmpresaId] = useState("");

  const [empresas, setEmpresas] = useState([]);

  const [limiteViews, setLimiteViews] = useState(1000);
  const [loading, setLoading] = useState(false);

  // 🔥 carregar empresas
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

      // reset
      setYoutubeId("");
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

        {/* vídeo */}
        <input
          value={youtubeId}
          onChange={(e) => setYoutubeId(e.target.value)}
          placeholder="ID do vídeo"
          className="w-full p-3 rounded bg-zinc-700"
        />

        {/* descrição */}
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descrição"
          className="w-full p-3 rounded bg-zinc-700"
        />

        {/* empresa */}
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

        {/* tags */}
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags (sushi, pizza...)"
          className="w-full p-3 rounded bg-zinc-700"
        />

        {/* ação */}
        <select
          value={tipoAcao}
          onChange={(e) => setTipoAcao(e.target.value)}
          className="w-full p-3 rounded bg-zinc-700"
        >
          <option value="carrinho">Carrinho</option>
          <option value="whatsapp">WhatsApp</option>
        </select>

        {/* produto */}
        {tipoAcao === "carrinho" && (
          <input
            value={produtoId}
            onChange={(e) => setProdutoId(e.target.value)}
            placeholder="ID do produto"
            className="w-full p-3 rounded bg-zinc-700"
          />
        )}

        {/* limite */}
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