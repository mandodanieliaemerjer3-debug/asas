"use client";

import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerTodosClient() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        const snap = await getDocs(collection(db, "produtos")); // 👈 ajuste se sua coleção tiver outro nome
        const lista = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setItens(lista);
        setLoading(false);
      } catch (e) {
        console.error("Erro ao carregar:", e);
        setLoading(false);
      }
    };

    carregar();
  }, []);

  const filtro = searchParams.get("filtro");

  const itensFiltrados = filtro
    ? itens.filter((item) =>
        item.nome?.toLowerCase().includes(filtro.toLowerCase())
      )
    : itens;

  if (loading) {
    return (
      <div className="p-10 text-center font-bold">
        Carregando itens...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto p-4">
      <h1 className="text-2xl font-black mb-4">📦 Ver Todos</h1>

      {filtro && (
        <p className="text-sm mb-4 text-gray-500">
          Filtro: <strong>{filtro}</strong>
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {itensFiltrados.map((item) => (
          <div
            key={item.id}
            className="bg-white p-3 rounded-2xl shadow"
          >
            {item.imagem && (
              <img
                src={item.imagem}
                className="w-full h-24 object-cover rounded-xl mb-2"
              />
            )}

            <h2 className="font-bold text-sm">
              {item.nome}
            </h2>

            <p className="text-xs text-gray-500 mb-2">
              {item.descricao}
            </p>

            <p className="font-black text-green-600">
              R$ {item.preco}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}