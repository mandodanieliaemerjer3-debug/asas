"use client";

import { useState } from "react";

// Mantenha os caminhos relativos corretos
import rest1 from "../../../data/cardapios/rest_1.json";
import rest2 from "../../../data/cardapios/rest_2.json";
import restEspecial from "../../../data/cardapios/rest_especial.json";

export default function AtribuidorImagens() {
  const cardapios = { rest_1: rest1, rest_2: rest2, rest_especial: restEspecial };
  const [restauranteSelecionado, setRestauranteSelecionado] = useState("rest_1");
  const [produtosEditados, setProdutosEditados] = useState(cardapios.rest_1.products || []);

  function atualizarNomeImagem(produtoId, novoNome) {
    const novosProdutos = produtosEditados.map((p) =>
      p.id === produtoId ? { ...p, img: novoNome } : p
    );
    setProdutosEditados(novosProdutos);
  }

  function copiarJson() {
    const jsonFinal = { ...cardapios[restauranteSelecionado], products: produtosEditados };
    navigator.clipboard.writeText(JSON.stringify(jsonFinal, null, 2));
    alert("JSON copiado! Cole no seu arquivo .json.");
  }

  return (
    <main className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-black mb-6">Atribuidor de Imagens (Painel Interno)</h1>
        
        <div className="grid gap-4">
          {produtosEditados.map((produto) => (
            <div key={produto.id} className="bg-white p-4 rounded-xl border flex items-center gap-4">
              {/* Se o campo 'img' existir no JSON, tenta carregar da pasta public/imagens/ */}
              <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                {produto.img ? (
                  <img src={`/imagens/${produto.img}`} className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                ) : (
                  <div className="text-[10px] text-gray-400 text-center pt-8">SEM IMG</div>
                )}
              </div>

              <div className="flex-1">
                <h2 className="font-bold">{produto.n}</h2>
                <input
                  type="text"
                  placeholder="Nome do arquivo (ex: pizza.jpg)"
                  defaultValue={produto.img || ""}
                  onChange={(e) => atualizarNomeImagem(produto.id, e.target.value)}
                  className="border p-1 rounded w-full mt-2"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={copiarJson} className="fixed bottom-10 right-10 bg-black text-white p-6 rounded-full font-black shadow-2xl">
        SALVAR JSON
      </button>
    </main>
  );
}