"use client";

import { useEffect, useState } from "react";

export default function GerenciadorFilas({ products = [], userProfile, router }) {

  const [periodoAtual, setPeriodoAtual] = useState(null);
  const [filaParaVoce, setFilaParaVoce] = useState([]);

  // =============================
  // DETECTAR PERÍODO DO DIA
  // =============================
  useEffect(() => {

    const hora = new Date().getHours();

    if (hora >= 6 && hora < 11) setPeriodoAtual("#manha");
    else if (hora >= 11 && hora < 15) setPeriodoAtual("#almoco");
    else if (hora >= 15 && hora < 18) setPeriodoAtual("#tarde");
    else if (hora >= 18 && hora < 23) setPeriodoAtual("#noite");
    else setPeriodoAtual("#madrugada");

  }, []);

  // =============================
  // GERAR FILA "PARA VOCÊ"
  // =============================
  useEffect(() => {

    if (!userProfile?.preferencias) return;
    if (!periodoAtual) return;

    const prefs = userProfile.preferencias;

    const filtrados = products.filter((p) => {

      if (!p.tags) return false;

      const tags = p.tags;

      const temPreferencia = prefs.some((pref) => tags.includes(pref));
      const temPeriodo = tags.includes(periodoAtual);

      return temPreferencia && temPeriodo;

    });

    setFilaParaVoce(filtrados);

  }, [products, userProfile, periodoAtual]);

  // se não tiver preferências não mostra nada
  if (!userProfile?.preferencias || userProfile.preferencias.length === 0) {
    return null;
  }

  if (filaParaVoce.length === 0) {
    return null;
  }

  return (
    <section className="mt-6">

      <div className="px-4 mb-2">
        <h2 className="text-xs font-black uppercase italic">
          🍔 Para você
        </h2>
      </div>

      {/* FILA DE PRODUTOS */}
      <div className="flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">

        {filaParaVoce.map((p) => (

          <div
            key={p.id}
            onClick={() => router.push(`/produto/${p.id}`)}
            className="min-w-[120px] bg-white rounded-2xl shadow-sm border border-gray-100 cursor-pointer active:scale-95 transition"
          >

            <img
              src={p.image}
              className="w-full h-24 object-cover rounded-t-2xl"
              alt={p.name}
            />

            <div className="p-2">

              <p className="text-[9px] font-black uppercase line-clamp-2">
                {p.name}
              </p>

              <p className="text-[10px] font-black text-red-600 mt-1">
                R$ {p.price}
              </p>

            </div>

          </div>

        ))}

      </div>

      {/* BOTÃO GRANDE PARA VER TODOS */}
      <div className="px-4 mt-4">

        <button
          onClick={() => router.push(`/ver-todos?tag=${userProfile.preferencias[0]}`)}
          className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase text-lg shadow-xl active:scale-95 transition"
        >
          VER MAIS OPÇÕES
        </button>

      </div>

    </section>
  );
}