"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export default function ModalMarmita({ produto, onClose, onConfirm }) {
  const [mounted, setMounted] = useState(false);

  // =========================
  // DADOS DO FIREBASE
  // =========================
  // Puxa a lista de adicionais (ex: Ovo frito, Carne Extra, Bebida)
  const adicionaisDisponiveis = Array.isArray(produto?.adicionais) ? produto.adicionais : [];

  // =========================
  // ESTADOS
  // =========================
  const [adicionaisSelecionados, setAdicionaisSelecionados] = useState([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // =========================
  // FUNÇÕES DE CLIQUE
  // =========================
  const toggleAdicional = (adicional) => {
    const jaExiste = adicionaisSelecionados.find((a) => a.nome === adicional.nome);
    if (jaExiste) {
      // Remove se já estiver selecionado
      setAdicionaisSelecionados((prev) => prev.filter((a) => a.nome !== adicional.nome));
    } else {
      // Adiciona na lista
      setAdicionaisSelecionados((prev) => [...prev, adicional]);
    }
  };

  // =========================
  // CÁLCULO DE PREÇO
  // =========================
  const precoBase = produto.price || 0;
  const precoAdicionais = adicionaisSelecionados.reduce((total, add) => total + (add.price || 0), 0);
  const precoFinal = precoBase + precoAdicionais;

  // =========================
  // CONFIRMAÇÃO
  // =========================
  const confirmarProduto = () => {
    // Prepara os textos dos adicionais escolhidos
    const addsText = adicionaisSelecionados.map((add) => `+ ${add.nome}`);
    const observacaoMontada = addsText.join(" | ");

    const itemFinal = {
      ...produto,
      price: precoFinal,
      adicionaisSelecionados,
      // Se não escolher nada extra, vai com a observação "Prato Padrão" para a comanda
      observacaoSabores: observacaoMontada || "Prato padrão" 
    };

    onConfirm(itemFinal);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[35px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* ========================= */}
        {/* CABEÇALHO DO PRATO */}
        {/* ========================= */}
        <div className="border-b border-gray-100 pb-5">
          <span className="bg-orange-100 text-orange-600 text-[10px] font-black uppercase px-3 py-1 rounded-md mb-3 inline-block">
            Prato do Dia
          </span>
          <h2 className="font-black text-xl leading-tight">{produto.name}</h2>
          <p className="text-lg font-black text-red-600 mt-1">R$ {precoBase.toFixed(2)}</p>
          <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-sm text-gray-600 italic">
              "{produto.description}"
            </p>
          </div>
        </div>

        {/* ========================= */}
        {/* ADICIONAIS (PAGOS) */}
        {/* ========================= */}
        {adicionaisDisponiveis.length > 0 ? (
          <div className="mt-6">
            <h3 className="font-bold text-sm mb-3">Deseja adicionar algo?</h3>
            <div className="grid gap-3">
              {adicionaisDisponiveis.map((add, idx) => {
                const selecionado = adicionaisSelecionados.find(a => a.nome === add.nome);
                return (
                  <button
                    key={idx}
                    onClick={() => toggleAdicional(add)}
                    className={`flex justify-between items-center p-3 rounded-2xl border transition text-left ${selecionado ? 'border-black bg-black text-white' : 'border-gray-200'}`}
                  >
                    <span className="font-bold text-sm">{add.nome}</span>
                    <span className="font-black text-sm">+ R$ {Number(add.price).toFixed(2)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-6 text-center text-sm text-gray-400">
            Sem adicionais configurados para este prato.
          </div>
        )}

        {/* ========================= */}
        {/* BOTÕES DE AÇÃO */}
        {/* ========================= */}
        <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
          <button onClick={onClose} className="w-1/3 bg-gray-200 py-3 rounded-2xl font-bold text-sm">
            Cancelar
          </button>
          <button onClick={confirmarProduto} className="w-2/3 bg-black text-white py-3 rounded-2xl font-bold text-sm flex justify-between px-5 items-center">
            <span>Adicionar</span>
            <span>R$ {precoFinal.toFixed(2)}</span>
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}