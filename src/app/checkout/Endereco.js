"use client";

import { useState } from "react";

export default function Endereco({
  address,
  setAddress,
  neighborhoods,
  selectedBairro,
  setSelectedBairro,
  setTaxaFinal
}) {
  const [editando, setEditando] = useState(false);
  const [mostrarBairros, setMostrarBairros] = useState(false);

  return (
    <div className="bg-white p-5 rounded-3xl mb-4 shadow-sm">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-3">
        <p className="font-black text-gray-800">📍 Onde entregar?</p>

        <button
          onClick={() => setEditando(!editando)}
          className="text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full"
        >
          {editando ? "FECHAR" : "ALTERAR"}
        </button>
      </div>

      {/* MODO EDIÇÃO */}
      {editando ? (
        <div className="space-y-2">

          <input
            value={address.rua}
            onChange={(e) =>
              setAddress({ ...address, rua: e.target.value })
            }
            placeholder="Rua"
            className="w-full border-2 border-gray-100 p-3 rounded-xl"
          />

          <input
            value={address.numero}
            onChange={(e) =>
              setAddress({ ...address, numero: e.target.value })
            }
            placeholder="Número"
            className="w-full border-2 border-gray-100 p-3 rounded-xl"
          />

          {/* BOTÃO BAIRRO */}
          <button
            onClick={() => setMostrarBairros(!mostrarBairros)}
            className="w-full bg-gray-50 border-2 border-dashed border-gray-200 p-3 rounded-xl font-bold text-gray-600"
          >
            {selectedBairro
              ? `Bairro: ${selectedBairro.name}`
              : "Selecionar bairro"}
          </button>

          {/* LISTA DE BAIRROS */}
          {mostrarBairros && (
            <div className="max-h-40 overflow-auto border-2 border-gray-100 rounded-xl divide-y">
              {neighborhoods.map((b) => (
                <div
                  key={b.id}
                  onClick={() => {
                    setSelectedBairro(b);
                    setTaxaFinal(b.fee || 0);
                    setMostrarBairros(false);
                  }}
                  className="p-3 cursor-pointer flex justify-between"
                >
                  <span className="font-bold text-sm">{b.name}</span>
                  <span className="text-xs text-green-600">
                    R$ {b.fee}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* MODO VISUAL (IGUAL APP REAL) */
        <div className="bg-gray-50 p-3 rounded-2xl">
          <p className="text-sm font-bold">
            {address.rua || "Defina sua rua"},{" "}
            {address.numero || "nº"}
          </p>

          <p className="text-xs text-gray-400">
            {selectedBairro?.name || "Bairro não selecionado"}
          </p>
        </div>
      )}
    </div>
  );
}