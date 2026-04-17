"use client";
import { useState, useEffect } from "react";

export default function ListaDestaques({ products = [], onAdd, router, restaurants = [] }) {

  const [categoriaAtiva, setCategoriaAtiva] = useState("Destaques");

  // Mantém sua função original de detectar período do dia para definir a categoria inicial
  useEffect(() => {
    const hora = new Date().getHours();

    if (hora >= 5 && hora < 11) setCategoriaAtiva("bolo");
    else if (hora >= 11 && hora < 15) setCategoriaAtiva("marmita");
    else if (hora >= 15 && hora < 18) setCategoriaAtiva("sorvete");
    else setCategoriaAtiva("lanche");

  }, []);

  // Filtra os produtos com base na categoria ativa selecionada nas tags
  const produtosFiltrados = products.filter((p) => {
    if (categoriaAtiva === "Destaques") return true;
    if (!p.tags) return false;

    const tagBusca = "#" + categoriaAtiva.toLowerCase();
    return p.tags.includes(tagBusca);
  });

  // Limita a exibição inicial a 4 itens para incentivar o uso do botão "Ver Tudo"
  const produtosExibidos = produtosFiltrados.slice(0, 4);

  const getNomeRestaurante = (id) => {
    if (!restaurants) return "Restaurante";
    const res = restaurants.find((r) => r.id === id);
    return res ? res.name : "Restaurante";
  };

  return (
    <section className="mt-8 px-4">

      {/* SELETOR DE CATEGORIAS (TAGS) */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
        {["Destaques","marmita","lanche","pizza","sushi","sorvete"].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoriaAtiva(cat)}
            className={`px-5 py-2 rounded-full text-[10px] font-black uppercase transition-all border whitespace-nowrap ${
              categoriaAtiva === cat
                ? "bg-red-600 text-white border-red-600 shadow-md"
                : "bg-gray-50 text-gray-400 border-gray-100"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* GRID DE PRODUTOS (MÁXIMO 4) */}
      <div className="grid grid-cols-2 gap-4">
        {produtosExibidos.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-[28px] border border-gray-100 p-2 shadow-sm flex flex-col active:scale-95 transition-transform"
          >
            <div
              onClick={() => router.push(`/produto/${p.id}`)}
              className="h-32 bg-gray-50 rounded-[22px] overflow-hidden relative cursor-pointer"
            >
              <img
                src={p.image}
                className="w-full h-full object-cover"
                alt={p.name}
              />
              <div className="absolute top-2 right-2 bg-yellow-400 text-[7px] font-black px-2 py-1 rounded-full shadow-sm">
                🪙 CASHBACK
              </div>
            </div>

            <div className="p-2">
              <p className="text-[7px] font-black text-red-600 uppercase mb-1 tracking-tighter truncate">
                🏢 {getNomeRestaurante(p.restaurantId)}
              </p>
              <h4 className="font-bold text-[11px] text-gray-800 line-clamp-1 uppercase italic tracking-tighter leading-tight">
                {p.name}
              </h4>
              <div className="flex justify-between items-center mt-2">
                <span className="font-black text-green-600 text-sm">
                  R$ {Number(p.price).toFixed(2)}
                </span>
                <button
                  onClick={(e) => onAdd(e, p)}
                  className="w-8 h-8 bg-red-600 text-white rounded-xl font-black shadow-lg flex items-center justify-center text-lg"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* BOTÃO ATUALIZADO: AGORA REDIRECIONA PARA O FEED INFINITO */}
      <div className="mt-8">
        <button
          onClick={() => {
            // Se a categoria for "Destaques", enviamos uma tag padrão, senão enviamos a categoria ativa
            const tagParaFiltrar = categoriaAtiva === "Destaques" ? "#marmita" : "#" + categoriaAtiva.toLowerCase();
            router.push(`/ver-todos?tag=${encodeURIComponent(tagParaFiltrar)}`);
          }}
          className="w-full py-5 bg-gray-900 text-white rounded-[25px] font-black uppercase italic text-xs shadow-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          🚀 VER TUDO EM {categoriaAtiva}
        </button>
      </div>

    </section>
  );
}