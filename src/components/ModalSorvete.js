"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export default function ModalSorvete({ produto, onClose, onConfirm }) {
  const [mounted, setMounted] = useState(false);

  // =========================
  // DADOS DO FIREBASE
  // =========================
  const estrutura = produto?.listaOpcoes || {};
  const configuracao = estrutura?.configuracao || {};
  
  // Lista de sabores de sorvete (ex: Morango, Flocos, Chocolate)
  const listaSabores = Array.isArray(estrutura?.listaOpcoes) ? estrutura.listaOpcoes : [];
  const saboresAtivos = listaSabores.filter((item) => item.ativo !== false);
  
  // Nova lista genérica de adicionais (ex: Calda de Morango, Granulado, Nutella)
  const adicionaisDisponiveis = Array.isArray(produto?.adicionais) ? produto.adicionais : [];

  const limiteSabores = configuracao?.limiteSabores || 1;

  // =========================
  // ESTADOS
  // =========================
  const [saboresSelecionados, setSaboresSelecionados] = useState([]);
  const [adicionaisSelecionados, setAdicionaisSelecionados] = useState([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // =========================
  // FUNÇÕES DE CLIQUE
  // =========================
  const toggleSabor = (sabor) => {
    const jaExiste = saboresSelecionados.find((s) => s.nome === sabor.nome);

    if (jaExiste) {
      setSaboresSelecionados((prev) => prev.filter((s) => s.nome !== sabor.nome));
      return;
    }

    if (saboresSelecionados.length >= limiteSabores) {
      return; 
    }

    setSaboresSelecionados((prev) => [...prev, sabor]);
  };

  const toggleAdicional = (adicional) => {
    const jaExiste = adicionaisSelecionados.find((a) => a.nome === adicional.nome);
    if (jaExiste) {
      setAdicionaisSelecionados((prev) => prev.filter((a) => a.nome !== adicional.nome));
    } else {
      setAdicionaisSelecionados((prev) => [...prev, adicional]);
    }
  };

  // =========================
  // CÁLCULO DE PREÇO
  // =========================
  // Em sorvetes, normalmente o preço base já define o tamanho (ex: Pote 500ml R$ 20).
  // Se os sabores tiverem preço extra, o código abaixo pega o maior (como na pizza). 
  // Se forem gratuitos, basta deixar price: 0 no Firebase.
  const maiorPrecoSabor = saboresSelecionados.length > 0 
    ? Math.max(...saboresSelecionados.map((s) => s.price || 0)) 
    : 0;
  
  const precoBaseProduto = produto.price || 0;
  const precoBaseReal = Math.max(precoBaseProduto, maiorPrecoSabor);

  const precoAdicionais = adicionaisSelecionados.reduce((total, add) => total + (add.price || 0), 0);
  const precoFinal = precoBaseReal + precoAdicionais;

  // =========================
  // CONFIRMAÇÃO
  // =========================
  const confirmarProduto = () => {
    if (saboresSelecionados.length === 0) {
      alert(`Selecione pelo menos 1 sabor de sorvete.`);
      return;
    }

    const textoSabores = saboresSelecionados.map(s => s.nome).join(" / ");
    const addsText = adicionaisSelecionados.map(add => `+ ${add.nome}`);
    
    // Junta Sabores + Adicionais na observação
    const observacaoMontada = addsText.length > 0 
      ? `${textoSabores} | ${addsText.join(" | ")}`
      : textoSabores;

    const itemFinal = {
      ...produto,
      price: precoFinal,
      saboresSelecionados,
      adicionaisSelecionados,
      observacaoSabores: observacaoMontada 
    };

    onConfirm(itemFinal);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[35px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        <div className="border-b border-gray-100 pb-4">
          <span className="bg-blue-100 text-blue-600 text-[10px] font-black uppercase px-2 py-1 rounded-md mb-2 inline-block">
            Sobremesa
          </span>
          <h2 className="font-black text-xl">{produto.name}</h2>
          <p className="text-sm font-bold text-red-600 mt-1">A partir de R$ {precoBaseProduto.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-2">{produto.description}</p>
        </div>

        {/* ========================= */}
        {/* ESCOLHA DE SABORES */}
        {/* ========================= */}
        <div className="mt-6">
          <div className="flex justify-between items-end mb-3">
            <h3 className="font-bold text-sm">Escolha os sabores</h3>
            <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-md font-bold text-gray-500">
              {saboresSelecionados.length} / {limiteSabores}
            </span>
          </div>

          <div className="grid gap-2">
            {saboresAtivos.map((sabor, index) => {
              const ativo = saboresSelecionados.find((s) => s.nome === sabor.nome);
              return (
                <button
                  key={index}
                  onClick={() => toggleSabor(sabor)}
                  className={`flex justify-between items-center p-3 rounded-2xl border transition text-left ${ativo ? 'border-black bg-black text-white' : 'border-gray-200'}`}
                >
                  <span className="font-bold text-sm">{sabor.nome}</span>
                  {sabor.price > 0 && (
                    <span className="font-black text-xs opacity-70">
                      R$ {Number(sabor.price).toFixed(2)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================= */}
        {/* ADICIONAIS E CALDAS (PAGOS) */}
        {/* ========================= */}
        {adicionaisDisponiveis.length > 0 && (
          <div className="mt-8">
            <h3 className="font-bold text-sm mb-3">Adicionar Toppings / Caldas</h3>
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