"use client";

import { useEffect, useState } from "react";
import { db } from "../../../lib/firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc
} from "firebase/firestore";

export default function CorrigirProdutos() {
  const [produtos, setProdutos] = useState([]);
  const [restaurantes, setRestaurantes] = useState([]);
  const [filtro, setFiltro] = useState("todos");
  const [selecoes, setSelecoes] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setLoading(true);

      const prodSnap = await getDocs(collection(db, "products"));
      const restSnap = await getDocs(collection(db, "restaurants"));

      const listaProd = prodSnap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      const listaRest = restSnap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      setProdutos(listaProd);
      setRestaurantes(listaRest);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      alert("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  const produtosFiltrados = produtos.filter(p => {
    if (filtro === "sem") return !p.restaurantId;
    if (filtro === "com") return p.restaurantId;
    return true;
  });

  const salvar = async (produtoId) => {
    const restId = selecoes[produtoId];

    if (!restId) {
      alert("Selecione um restaurante");
      return;
    }

    try {
      await updateDoc(doc(db, "products", produtoId), {
        restaurantId: restId
      });

      alert("Produto atualizado!");
      carregarDados();
    } catch (err) {
      console.error("Erro ao atualizar:", err);
      alert("Erro ao salvar");
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center font-black">
        Carregando produtos...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">

      <h1 className="text-2xl font-black mb-6">
        🔧 Corrigir Produtos
      </h1>

      {/* FILTROS */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setFiltro("todos")}
          className="px-3 py-1 bg-gray-200 rounded"
        >
          Todos
        </button>

        <button
          onClick={() => setFiltro("sem")}
          className="px-3 py-1 bg-red-200 rounded"
        >
          Sem restaurante
        </button>

        <button
          onClick={() => setFiltro("com")}
          className="px-3 py-1 bg-green-200 rounded"
        >
          Com restaurante
        </button>
      </div>

      {/* LISTA */}
      <div className="space-y-4">
        {produtosFiltrados.map(p => (
          <div
            key={p.id}
            className="border p-4 rounded-xl flex flex-col gap-3 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <img
                src={p.image}
                className="w-16 h-16 rounded object-cover"
                alt=""
              />

              <div>
                <p className="font-bold">{p.name}</p>
                <p className="text-sm">
                  {p.restaurantId ? (
                    <span className="text-green-600">✅ OK</span>
                  ) : (
                    <span className="text-red-600">❌ Sem restaurante</span>
                  )}
                </p>
              </div>
            </div>

            {/* SELECT */}
            <select
              value={selecoes[p.id] || ""}
              onChange={(e) =>
                setSelecoes({
                  ...selecoes,
                  [p.id]: e.target.value
                })
              }
              className="border p-2 rounded"
            >
              <option value="">Selecionar restaurante</option>

              {restaurantes.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => salvar(p.id)}
              className="bg-black text-white p-2 rounded"
            >
              Salvar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}