"use client";

import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function Bebidas({ onAdd }) {
  const [bebidas, setBebidas] = useState([]);

  useEffect(() => {
    const buscar = async () => {
      const snap = await getDocs(collection(db, "bebidas"));

      const lista = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // 🧠 INTERESSES DO USUÁRIO (por enquanto fixo)
      const interessesUsuario = ["sem_acucar", "cocacola", "natural"];

      // 🔥 ORDENAÇÃO INTELIGENTE
      const listaOrdenada = lista.sort((a, b) => {
        const scoreA =
          a.tags?.filter(tag => interessesUsuario.includes(tag)).length || 0;

        const scoreB =
          b.tags?.filter(tag => interessesUsuario.includes(tag)).length || 0;

        // se nenhum dos dois tem interesse → embaralha
        if (scoreA === 0 && scoreB === 0) {
          return Math.random() - 0.5;
        }

        return scoreB - scoreA;
      });

      setBebidas(listaOrdenada);
    };

    buscar();
  }, []);

  return (
    <div className="mb-4">
      <p className="font-bold mb-2">🥤 Bebidas</p>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {bebidas.map(b => (
          <div key={b.id} className="min-w-[120px] bg-white p-2 rounded-xl shadow-sm">

            {b.imagem ? (
              <img
                src={b.imagem}
                className="w-full h-20 object-contain rounded-xl bg-white"
              />
            ) : (
              <div className="w-full h-20 bg-gray-200 rounded-xl flex items-center justify-center text-xs text-gray-500">
                sem imagem
              </div>
            )}

            <p className="text-sm font-bold mt-1">{b.nome}</p>
            <p className="text-xs">R$ {b.preco}</p>

            <button
              onClick={() => onAdd(b)}
              className="mt-1 w-full bg-green-500 text-white text-xs p-1 rounded-lg"
            >
              Adicionar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}