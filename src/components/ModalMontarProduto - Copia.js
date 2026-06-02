"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export default function ModalMontarProduto({
  produto,
  onClose,
  onConfirm
}) {

  const [mounted, setMounted] = useState(false);

  // =========================
  // NOVA ESTRUTURA FIREBASE
  // =========================
  const estrutura = produto?.listaOpcoes || {};

  const configuracao = estrutura?.configuracao || {};

  const listaSabores = Array.isArray(estrutura?.listaOpcoes)
    ? estrutura.listaOpcoes
    : [];

  const bordasDisponiveis = Array.isArray(estrutura?.bordasDisponiveis)
    ? estrutura.bordasDisponiveis
    : [];

  const saboresAtivos = listaSabores.filter(
    (item) => item.ativo !== false
  );

  // =========================
  // ESTADOS
  // =========================
  const [saboresSelecionados, setSaboresSelecionados] = useState([]);
  const [bordaSelecionada, setBordaSelecionada] = useState(null);

  // =========================
  // CONFIG
  // =========================
  const limiteSabores = configuracao?.limiteSabores || 1;

  const permiteMeioAMeio =
    configuracao?.permiteMeioAMeio || false;

  // =========================
  // MOUNT
  // =========================
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // =========================
  // SELECIONAR SABOR
  // =========================
  const toggleSabor = (sabor) => {

    const jaExiste = saboresSelecionados.find(
      (s) => s.nome === sabor.nome
    );

    if (jaExiste) {

      setSaboresSelecionados((prev) =>
        prev.filter((s) => s.nome !== sabor.nome)
      );

      return;
    }

    if (saboresSelecionados.length >= limiteSabores) {
      return;
    }

    setSaboresSelecionados((prev) => [...prev, sabor]);

  };

  // =========================
  // CONFIRMAR
  // =========================
  const confirmarProduto = () => {

    if (saboresSelecionados.length === 0) {
      alert("Selecione pelo menos um sabor.");
      return;
    }

    // pega o maior preço dos sabores
    const maiorPreco = Math.max(
      ...saboresSelecionados.map((s) => s.price || 0)
    );

    const precoBorda = bordaSelecionada?.price || 0;

    const precoFinal = maiorPreco + precoBorda;

    const itemFinal = {
      ...produto,

      saboresSelecionados,

      bordaSelecionada,

      price: precoFinal,

      observacaoSabores: saboresSelecionados
        .map((s) => s.nome)
        .join(" / ")
    };

    onConfirm(itemFinal);

  };

  return createPortal(

    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">

      <div className="bg-white w-full max-w-md rounded-[35px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* TITULO */}
        <h2 className="font-black text-xl">
          {produto.name}
        </h2>

        <p className="text-xs text-gray-500 mt-1">
          Escolha até {limiteSabores} sabor(es)
        </p>

        {/* ========================= */}
        {/* SABORES */}
        {/* ========================= */}
        <div className="mt-6">

          <h3 className="font-bold text-sm mb-3">
            Sabores
          </h3>

          {saboresAtivos.length === 0 ? (

            <div className="text-red-500 text-sm">
              Configuração de sabores incompleta neste produto.
            </div>

          ) : (

            <div className="grid gap-3">

              {saboresAtivos.map((sabor, index) => {

                const ativo = saboresSelecionados.find(
                  (s) => s.nome === sabor.nome
                );

                return (

                  <button
                    key={index}
                    onClick={() => toggleSabor(sabor)}
                    className={`border rounded-2xl p-3 text-left transition ${
                      ativo
                        ? "border-black bg-black text-white"
                        : "border-gray-200"
                    }`}
                  >

                    <div className="flex justify-between items-center">

                      <div>

                        <div className="font-bold text-sm">
                          {sabor.nome}
                        </div>

                        <div className="text-xs opacity-70">
                          {sabor.description}
                        </div>

                      </div>

                      <div className="font-black text-sm">
                        R$ {Number(sabor.price || 0).toFixed(2)}
                      </div>

                    </div>

                  </button>

                );

              })}

            </div>

          )}

        </div>

        {/* ========================= */}
        {/* BORDAS */}
        {/* ========================= */}
        {bordasDisponiveis.length > 0 && (

          <div className="mt-8">

            <h3 className="font-bold text-sm mb-3">
              Borda Recheada
            </h3>

            <div className="grid gap-3">

              {bordasDisponiveis.map((borda, index) => {

                const ativa =
                  bordaSelecionada?.nome === borda.nome;

                return (

                  <button
                    key={index}
                    onClick={() => setBordaSelecionada(borda)}
                    className={`border rounded-2xl p-3 text-left transition ${
                      ativa
                        ? "border-black bg-black text-white"
                        : "border-gray-200"
                    }`}
                  >

                    <div className="flex justify-between items-center">

                      <div className="font-bold text-sm">
                        {borda.nome}
                      </div>

                      <div className="font-black text-sm">
                        + R$ {Number(borda.price || 0).toFixed(2)}
                      </div>

                    </div>

                  </button>

                );

              })}

            </div>

          </div>

        )}

        {/* ========================= */}
        {/* INFO */}
        {/* ========================= */}
        {permiteMeioAMeio && (

          <div className="mt-6 text-xs text-gray-500">
            Produto permite meio a meio.
          </div>

        )}

        {/* ========================= */}
        {/* BOTÕES */}
        {/* ========================= */}
        <div className="flex gap-3 mt-8">

          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 py-3 rounded-2xl font-bold"
          >
            Cancelar
          </button>

          <button
            onClick={confirmarProduto}
            className="flex-1 bg-black text-white py-3 rounded-2xl font-bold"
          >
            Adicionar
          </button>

        </div>

      </div>

    </div>,

    document.body
  );
}