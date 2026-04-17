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
      setBebidas(lista);
    };

    buscar();
  }, []);

  return (
    <div className="mb-4">
      <p className="font-bold mb-2">🥤 Bebidas</p>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {bebidas.map(b => (
          <div key={b.id} className="min-w-[120px] bg-white p-2 rounded-xl shadow-sm">

            {/* 🔥 CORREÇÃO AQUI */}
            {b.imagem ? (
              <img
                src={b.imagem}
                className="w-full h-20 object-cover rounded-xl"
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