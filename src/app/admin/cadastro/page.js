"use client";

import { useState, useEffect } from "react";
import { db } from "../../../lib/firebase"; 
import { collection, onSnapshot, doc, updateDoc, query, where } from "firebase/firestore";

export default function AdminProdutosPage() {
  const [produtos, setProdutos] = useState([]);
  const [restaurantes, setRestaurantes] = useState([]);
  const [restauranteSelecionado, setRestauranteSelecionado] = useState("");
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [jsonTexto, setJsonTexto] = useState("");
  const [erroJson, setErroJson] = useState(null);
  const [carregando, setCarregando] = useState(false);

  // 1. Carrega a lista de restaurantes
  useEffect(() => {
    const unsubRes = onSnapshot(collection(db, "restaurants"), (snap) => {
      setRestaurantes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubRes();
  }, []);

  // 2. Carrega os produtos filtrados
  useEffect(() => {
    if (!restauranteSelecionado) {
      setProdutos([]);
      return;
    }

    const q = query(collection(db, "products"), where("restaurantId", "==", restauranteSelecionado));
    const unsubProd = onSnapshot(q, (snap) => {
      setProdutos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsubProd();
  }, [restauranteSelecionado]);

  // 3. Abre o painel do JSON
  const abrirEditorJson = (produto) => {
    setProdutoEditando(produto);
    setErroJson(null);
    
    // Monta um objeto com as chaves que nos importam agora
    const infoAtual = {
      category: produto.category || produto.categoria || "",
      forma: produto.forma || "",
      ingredientesPadrao: produto.ingredientesPadrao || [],
      adicionais: produto.adicionais || [],
      listaOpcoes: produto.listaOpcoes || {}
    };

    setJsonTexto(JSON.stringify(infoAtual, null, 2));
  };

  // ==========================================
  // TEMPLATES PRONTOS (MÁGICA ACONTECE AQUI)
  // ==========================================
  const aplicarTemplate = (tipo) => {
    let template = {};

    if (tipo === "lanche") {
      template = {
        category: "lanche",
        forma: "selecao_sabor",
        ingredientesPadrao: ["Pão Brioche", "Hambúrguer 160g", "Queijo Cheddar", "Bacon", "Cebola", "Tomate"],
        adicionais: [
          { nome: "Carne Extra", price: 10 },
          { nome: "Bacon Extra", price: 4 },
          { nome: "Molho Especial", price: 2 }
        ],
        listaOpcoes: {} // Lanche não usa lista de sabores, usa ingredientes/adicionais
      };
    } 
    else if (tipo === "marmita") {
      template = {
        category: "marmita",
        forma: "selecao_sabor",
        ingredientesPadrao: [],
        adicionais: [
          { nome: "Ovo Frito", price: 3 },
          { nome: "Bife Acebolado Extra", price: 12 },
          { nome: "Coca-Cola Lata", price: 6 }
        ],
        listaOpcoes: {}
      };
    }
    else if (tipo === "pizza") {
      template = {
        category: "pizza",
        forma: "selecao_sabor",
        ingredientesPadrao: [],
        adicionais: [],
        listaOpcoes: {
          configuracao: { limiteSabores: 2, permiteMeioAMeio: true },
          bordasDisponiveis: [
            { nome: "Sem Borda", price: 0 },
            { nome: "Cheddar", price: 10 },
            { nome: "Catupiry", price: 10 }
          ],
          listaOpcoes: [
            { nome: "Calabresa", price: 50, ativo: true, ingredientesPadrao: ["Mussarela", "Calabresa", "Cebola"] },
            { nome: "Marguerita", price: 55, ativo: true, ingredientesPadrao: ["Mussarela", "Tomate", "Manjericão"] }
          ]
        }
      };
    }
    else if (tipo === "sorvete") {
      template = {
        category: "sorvete",
        forma: "selecao_sabor",
        ingredientesPadrao: [],
        adicionais: [
          { nome: "Calda de Chocolate", price: 2 },
          { nome: "Nutella", price: 5 },
          { nome: "Granulado", price: 1 }
        ],
        listaOpcoes: {
          configuracao: { limiteSabores: 2, permiteMeioAMeio: false },
          listaOpcoes: [
            { nome: "Morango", price: 0, ativo: true },
            { nome: "Flocos", price: 0, ativo: true },
            { nome: "Chocolate Belga", price: 0, ativo: true }
          ]
        }
      };
    }

    setJsonTexto(JSON.stringify(template, null, 2));
    setErroJson(null);
  };

  // 4. Valida e injeta no Firestore
  const salvarConfiguracao = async () => {
    if (!produtoEditando) return;
    setErroJson(null);
    setCarregando(true);

    try {
      const objetoValidado = JSON.parse(jsonTexto);

      if (typeof objetoValidado !== 'object' || Array.isArray(objetoValidado)) {
        throw new Error("O JSON precisa ser um objeto { ... } contendo as categorias, adicionais, etc.");
      }

      const produtoRef = doc(db, "products", produtoEditando.id);

      // Injeta os dados mesclando com o produto existente
      await updateDoc(produtoRef, {
        ...objetoValidado
      });

      alert(`Produto configurado com sucesso!`);
      setProdutoEditando(null);
      setJsonTexto("");
    } catch (err) {
      setErroJson("Erro no JSON: " + err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6 font-sans">
      
      {/* CABEÇALHO */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-black uppercase italic text-red-500 tracking-wider">
            Mogu Mogu · Super Editor
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Injeção Rápida de Templates (Lanche, Pizza, Marmita)</p>
        </div>

        {/* SELETOR DE RESTAURANTE */}
        <div className="w-full md:w-auto">
          <label className="block text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-2">Filtrar por Estabelecimento</label>
          <select
            value={restauranteSelecionado}
            onChange={(e) => {
              setRestauranteSelecionado(e.target.value);
              setProdutoEditando(null);
            }}
            className="w-full md:w-64 bg-zinc-900 border border-zinc-800 text-white text-xs rounded-xl p-3 font-bold focus:outline-none focus:border-red-500 transition-all cursor-pointer"
          >
            <option value="">Selecione um restaurante...</option>
            {restaurantes.map(res => (
              <option key={res.id} value={res.id}>{res.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLUNA ESQUERDA: LISTAGEM */}
        <section className="lg:col-span-6 bg-zinc-900/40 border border-zinc-900 rounded-[35px] p-6 shadow-xl">
          <h2 className="font-black text-xs uppercase italic text-zinc-400 mb-4 tracking-wider">
            Produtos Cadastrados
          </h2>

          {!restauranteSelecionado ? (
            <div className="text-center py-20 border border-dashed border-zinc-800 rounded-[25px] text-zinc-500 text-xs font-medium">
              Escolha um restaurante acima para carregar.
            </div>
          ) : produtos.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-zinc-800 rounded-[25px] text-zinc-500 text-xs font-medium">
              Nenhum produto encontrado.
            </div>
          ) : (
            <div className="grid gap-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              {produtos.map(item => {
                const configPronta = item.forma === "selecao_sabor";
                return (
                  <div 
                    key={item.id} 
                    className={`flex gap-3 p-3 border rounded-[20px] items-center justify-between transition-all ${
                      produtoEditando?.id === item.id 
                        ? "bg-red-500/10 border-red-500/30" 
                        : "bg-zinc-900 border-zinc-800/60 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex gap-3 items-center overflow-hidden">
                      <img src={item.image || "/images/placeholder.jpg"} className="w-12 h-12 rounded-xl object-cover border border-zinc-800" alt={item.name} />
                      <div className="truncate">
                        <h3 className="font-black text-xs text-zinc-200 truncate">{item.name}</h3>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[9px] text-zinc-500 uppercase">{item.category || "Sem Categoria"}</span>
                          {configPronta && <span className="text-[9px] text-green-400 uppercase font-bold">⚙️ Configurado</span>}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => abrirEditorJson(item)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold uppercase text-[9px] px-3 py-2 rounded-lg transition-all whitespace-nowrap"
                    >
                      ✏️ Editar
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* COLUNA DIREITA: SUPER EDITOR FLUTUANTE */}
        <section className="lg:col-span-6 lg:sticky lg:top-6">
          {produtoEditando ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-[35px] p-6 shadow-2xl relative">
              
              <div className="mb-4">
                <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 font-black uppercase tracking-widest px-2 py-0.5 rounded-md">
                  Editando Produto
                </span>
                <h3 className="text-base font-black uppercase italic mt-2 text-zinc-100">
                  {produtoEditando.name}
                </h3>
              </div>

              {/* BOTÕES DE TEMPLATE */}
              <div className="mb-4">
                <p className="text-[10px] uppercase font-bold text-zinc-500 mb-2">Preenchimento Automático:</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => aplicarTemplate('lanche')} className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-orange-500/30">🍔 Lanche</button>
                  <button onClick={() => aplicarTemplate('marmita')} className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-yellow-500/30">🍱 Marmita</button>
                  <button onClick={() => aplicarTemplate('pizza')} className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-red-500/30">🍕 Pizza</button>
                  <button onClick={() => aplicarTemplate('sorvete')} className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-blue-500/30">🍦 Sorvete</button>
                </div>
              </div>

              {/* AREA DE TEXTO DO CÓDIGO */}
              <div className="relative">
                <textarea
                  value={jsonTexto}
                  onChange={(e) => setJsonTexto(e.target.value)}
                  rows={15}
                  className="w-full bg-black text-green-400 font-mono text-[11px] p-4 rounded-2xl border border-zinc-800 focus:outline-none focus:border-green-500 transition-all resize-none leading-relaxed custom-scrollbar"
                />
              </div>

              {erroJson && (
                <div className="text-red-400 text-xs font-mono mt-3 bg-red-500/5 p-3 rounded-xl border border-red-500/20 whitespace-pre-wrap">
                  ⚠️ {erroJson}
                </div>
              )}

              {/* BOTÕES DE AÇÃO */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <button onClick={() => setProdutoEditando(null)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-black uppercase text-[10px] py-3 rounded-xl transition-all">
                  Cancelar
                </button>
                <button onClick={salvarConfiguracao} disabled={carregando} className="col-span-2 bg-green-500 hover:bg-green-400 disabled:opacity-40 text-black font-black uppercase text-[10px] py-3 rounded-xl shadow-lg shadow-green-500/10 transition-all tracking-wider">
                  {carregando ? "Salvando..." : "💾 Atualizar Produto"}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/20 border border-dashed border-zinc-800 rounded-[35px] p-12 text-center text-zinc-600 text-xs font-medium">
              Clique em algum produto na lista ao lado para configurar seus adicionais, ingredientes ou sabores.
            </div>
          )}
        </section>

      </div>
    </main>
  );
}