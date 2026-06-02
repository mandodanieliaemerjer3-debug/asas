"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

export default function ModalBurguer({ produto, onClose, onConfirm }) {
  // Travas de segurança: se vier nulo ou demorar a carregar, assume array vazio e não quebra
  const listaSabores = produto?.listaOpcoes?.listaOpcoes || [];
  const adicionais = produto?.adicionais || [];

  const [saborSelecionado, setSaborSelecionado] = useState(null);
  const [ingredientesAtivos, setIngredientesAtivos] = useState({});
  const [adicionaisEscolhidos, setAdicionaisEscolhidos] = useState([]);

  const selecionarSabor = (sabor) => {
    setSaborSelecionado(sabor);
    const estadoIng = {};
    (sabor.ingredientesPadrao || []).forEach(ing => estadoIng[ing] = true);
    setIngredientesAtivos(estadoIng);
  };

  const toggleIngrediente = (ing) => {
    setIngredientesAtivos(prev => ({ ...prev, [ing]: !prev[ing] }));
  };

  const toggleAdicional = (add) => {
    setAdicionaisEscolhidos(prev =>
      prev.find(a => a.nome === add.nome)
        ? prev.filter(a => a.nome !== add.nome)
        : [...prev, add]
    );
  };

  const confirmar = () => {
    if (!saborSelecionado) return alert("Escolha um sabor!");

    const removidos = (saborSelecionado.ingredientesPadrao || []).filter(ing => !ingredientesAtivos[ing]);
    const precoAdicionais = adicionaisEscolhidos.reduce((acc, curr) => acc + (curr.price || 0), 0);

    onConfirm({
      ...produto,
      name: `${produto.name} (${saborSelecionado.nome})`,
      price: (saborSelecionado.price || 0) + precoAdicionais,
      observacaoSabores: `${saborSelecionado.nome} | Sem: ${removidos.length > 0 ? removidos.join(", ") : "Nada"} | Adds: ${adicionaisEscolhidos.length > 0 ? adicionaisEscolhidos.map(a => a.nome).join(", ") : "Nenhum"}`
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-[35px] shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* FAIXA DO VÍDEO NO TOPO */}
        <div className="w-full h-24 bg-gray-900 overflow-hidden relative">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-80">
            <source src="/video-burguer.mp4" type="video/mp4" />
          </video>
          {/* Sombra interna para dar um visual mais premium na divisão com o branco */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>

        <div className="p-6 overflow-y-auto">
          <h2 className="font-black text-lg">{produto?.name || "Montando Hambúrguer..."}</h2>

          {!saborSelecionado ? (
            <div className="grid gap-2 mt-4">
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Selecione o sabor:</p>
              
              {listaSabores.length > 0 ? (
                listaSabores.map((s, i) => (
                  <button key={i} onClick={() => selecionarSabor(s)} className="p-3 border rounded-2xl text-xs font-bold text-left hover:border-black transition-all">
                    {s.nome} - R$ {Number(s.price || 0).toFixed(2)}
                  </button>
                ))
              ) : (
                <div className="p-4 border border-red-100 bg-red-50 rounded-2xl text-center">
                  <p className="text-xs text-red-500 font-bold">Aguardando dados do banco...</p>
                  <p className="text-[10px] text-red-400 mt-1">Se não carregar, verifique a estrutura do produto no Super Editor.</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400 mt-4 italic">Retirar ingredientes:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {saborSelecionado.ingredientesPadrao?.length > 0 ? (
                  saborSelecionado.ingredientesPadrao.map(ing => (
                    <button key={ing} onClick={() => toggleIngrediente(ing)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${ingredientesAtivos[ing] ? 'bg-black text-white' : 'bg-red-50 text-red-500 line-through'}`}>
                      {ing}
                    </button>
                  ))
                ) : (
                  <span className="text-[10px] text-gray-400">Nenhum ingrediente padrão cadastrado.</span>
                )}
              </div>

              {adicionais.length > 0 && (
                <>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mt-6 italic">Adicionais (Pagos):</p>
                  <div className="grid gap-2 mt-2">
                    {adicionais.map(add => (
                      <button key={add.nome} onClick={() => toggleAdicional(add)} className={`p-3 border rounded-xl flex justify-between items-center text-[10px] font-bold transition-all ${adicionaisEscolhidos.find(a => a.nome === add.nome) ? 'bg-black text-white border-black' : 'border-gray-100 hover:border-gray-300'}`}>
                        <span>{add.nome}</span> 
                        <span className={adicionaisEscolhidos.find(a => a.nome === add.nome) ? 'text-green-300' : 'text-gray-500'}>
                          +R$ {Number(add.price || 0).toFixed(2)}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* BOTÕES DE AÇÃO */}
              <div className="flex gap-2 mt-6 pt-4 border-t border-gray-100">
                <button onClick={() => setSaborSelecionado(null)} className="w-1/3 bg-gray-100 py-4 rounded-2xl font-black text-xs text-gray-600 transition-all active:scale-95">
                  Voltar
                </button>
                <button onClick={confirmar} className="w-2/3 bg-black text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg transition-all active:scale-95">
                  Adicionar (R$ {((saborSelecionado.price || 0) + adicionaisEscolhidos.reduce((acc, curr) => acc + (curr.price || 0), 0)).toFixed(2)})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}