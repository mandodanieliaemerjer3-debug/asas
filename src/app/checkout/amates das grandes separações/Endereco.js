"use client";

import { useState } from "react";

export default function Endereco({
  address,
  setAddress,
  neighborhoods,
  selectedBairro,
  setSelectedBairro,
  setTaxaFinal,
  taxasDoRestaurante
}) {
  const [editando, setEditando] = useState(false);
  const [mostrarBairros, setMostrarBairros] = useState(false);

  return (
    <div className="bg-white p-5 rounded-3xl mb-4 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <p className="font-black text-gray-800">📍 Onde entregar?</p>
        <button onClick={() => setEditando(!editando)} className="text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full">
          {editando ? "FECHAR" : "ALTERAR"}
        </button>
      </div>

      {editando ? (
        <div className="space-y-2">
          <input value={address.rua} onChange={(e) => setAddress({ ...address, rua: e.target.value })} placeholder="Rua" className="w-full border-2 border-gray-100 p-3 rounded-xl" />
          <input value={address.numero} onChange={(e) => setAddress({ ...address, numero: e.target.value })} placeholder="Número" className="w-full border-2 border-gray-100 p-3 rounded-xl" />

          <button onClick={() => setMostrarBairros(!mostrarBairros)} className="w-full bg-gray-50 border-2 border-dashed border-gray-200 p-3 rounded-xl font-bold text-gray-600">
            {selectedBairro ? `Bairro: ${selectedBairro.name}` : "Selecionar bairro"}
          </button>

          {mostrarBairros && (
            <div className="max-h-40 overflow-auto border-2 border-gray-100 rounded-xl divide-y">
              {neighborhoods.map((b) => {
                // 1. Identifica a linha do bairro com segurança
                const chaveLinha = String(b.linhaId || b.linha);
                
                // 2. Busca o preço EXCLUSIVAMENTE do restaurante
                const config = taxasDoRestaurante ? taxasDoRestaurante[chaveLinha] : null;
                
                // 3. Se não tem configuração no restaurante, a entrega fica indisponível!
                const disponivel = config ? config.ativo === true : false;
                const precoFrete = config ? Number(config.preco) : 0;

                return (
                  <div
                    key={b.id}
                    onClick={() => {
                      if (!disponivel) {
                        alert("Este restaurante não está entregando nesta região no momento (Somente Retirada)!");
                        return;
                      }
                      setSelectedBairro(b);
                      setTaxaFinal(precoFrete);
                      setMostrarBairros(false);
                    }}
                    className={`p-3 cursor-pointer flex justify-between ${!disponivel ? 'opacity-40 bg-gray-50' : ''}`}
                  >
                    <span className="font-bold text-sm">
                      {b.name} {!disponivel && <span className="text-red-500 text-xs ml-1">(Indisponível)</span>}
                    </span>
                    <span className="text-xs text-green-600 font-bold">
                      {disponivel ? `R$ ${precoFrete.toFixed(2)}` : "---"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 p-3 rounded-2xl">
          <p className="text-sm font-bold">{address.rua || "Defina sua rua"}, {address.numero || "nº"}</p>
          <p className="text-xs text-gray-400">{selectedBairro?.name || "Bairro não selecionado"}</p>
        </div>
      )}
    </div>
  );
}