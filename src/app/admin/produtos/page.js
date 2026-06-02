"use client";

import { useState, useEffect } from "react";
import { db } from "../../../lib/firebase"; // Caminho corrigido com base nas suas outras páginas
import { collection, onSnapshot, doc, updateDoc, query, where } from "firebase/firestore";

export default function AdminProdutosPage() {
  const [produtos, setProdutos] = useState([]);
  const [restaurantes, setRestaurantes] = useState([]);
  const [restauranteSelecionado, setRestauranteSelecionado] = useState("");
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [jsonTexto, setJsonTexto] = useState("");
  const [erroJson, setErroJson] = useState(null);
  const [carregando, setCarregando] = useState(false);

  // 1. Carrega a lista de restaurantes para o filtro inicial
  useEffect(() => {
    const unsubRes = onSnapshot(collection(db, "restaurants"), (snap) => {
      setRestaurantes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubRes();
  }, []);

  // 2. Carrega os produtos filtrados pelo restaurante escolhido
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

  // 3. Abre o painel do JSON com a lista de opções atual do produto
  const abrirEditorJson = (produto) => {
    setProdutoEditando(produto);
    setErroJson(null);
    // Se o produto já tiver o array listaOpcoes, formata em JSON bonitinho, senão mostra um array vazio
    setJsonTexto(JSON.stringify(produto.listaOpcoes || [], null, 2));
  };

  // 4. Valida o JSON e injeta diretamente no Firestore
  const salvarListaSabores = async () => {
    if (!produtoEditando) return;
    setErroJson(null);
    setCarregando(true);

    try {
      // Tenta converter o texto digitado de volta para um Array
      const listaValidada = JSON.parse(jsonTexto);

      if (!Array.isArray(listaValidada)) {
        throw new Error("O JSON precisa ser obrigatoriamente uma lista de objetos [ ... ]");
      }

      const produtoRef = doc(db, "products", produtoEditando.id);

      // Atualiza o documento injetando o array e marcando o tipo de comportamento do produto
      await updateDoc(produtoRef, {
        forma: "selecao_sabor",
        listaOpcoes: listaValidada
      });

      alert(`Lista de sabores injetada com sucesso no produto: ${produtoEditando.name}!`);
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
            Mogu Mogu · Console ADM
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Injeção Direta de Sabores e Opções via Código Estruturado</p>
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

      {/* GRID PRINCIPAL (LISTA NA ESQUERDA, EDITOR NA DIREITA) */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLUNA ESQUERDA: LISTAGEM DE PRODUTOS */}
        <section className="lg:col-span-7 bg-zinc-900/40 border border-zinc-900 rounded-[35px] p-6 shadow-xl">
          <h2 className="font-black text-xs uppercase italic text-zinc-400 mb-4 tracking-wider">
            Produtos Cadastrados ({produtos.length})
          </h2>

          {!restauranteSelecionado ? (
            <div className="text-center py-20 border border-dashed border-zinc-800 rounded-[25px] text-zinc-500 text-xs font-medium">
              Escolha um restaurante acima para carregar o cardápio.
            </div>
          ) : produtos.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-zinc-800 rounded-[25px] text-zinc-500 text-xs font-medium">
              Nenhum produto encontrado neste restaurante.
            </div>
          ) : (
            <div className="grid gap-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              {produtos.map(item => {
                const temSabores = item.forma === "selecao_sabor" && item.listaOpcoes?.length > 0;
                return (
                  <div 
                    key={item.id} 
                    className={`flex gap-4 p-4 border rounded-[25px] items-center justify-between transition-all ${
                      produtoEditando?.id === item.id 
                        ? "bg-red-500/10 border-red-500/30" 
                        : "bg-zinc-900 border-zinc-800/60 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex gap-4 items-center">
                      <img src={item.image || "/images/placeholder.jpg"} className="w-14 h-14 rounded-2xl object-cover border border-zinc-800" alt={item.name} />
                      <div>
                        <h3 className="font-black text-sm text-zinc-200 flex items-center gap-2">
                          {item.name}
                          {temSabores && (
                            <span className="bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">
                              {item.listaOpcoes.length} Sabores
                            </span>
                          )}
                        </h3>
                        <p className="text-[11px] text-zinc-500 font-mono">ID: {item.id}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => abrirEditorJson(item)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold uppercase text-[10px] px-4 py-2.5 rounded-xl transition-all tracking-wider"
                    >
                      {temSabores ? "📝 Editar Sabores" : "➕ Injetar Lista"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* COLUNA DIREITA: EDITOR JSON FLUTUANTE */}
        <section className="lg:col-span-5 lg:sticky lg:top-6">
          {produtoEditando ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-[35px] p-6 shadow-2xl relative overflow-hidden">
              {/* Detalhe estético */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
              
              <div className="mb-4">
                <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 font-black uppercase tracking-widest px-2 py-0.5 rounded-md">
                  Editando Agora
                </span>
                <h3 className="text-base font-black uppercase italic mt-2 text-zinc-100">
                  {produtoEditando.name}
                </h3>
                <p className="text-[11px] text-zinc-400 mt-1">Insira os sabores usando a estrutura JSON de array de objetos.</p>
              </div>

              {/* AREA DE TEXTO DO CÓDIGO */}
              <div className="relative">
                <textarea
                  value={jsonTexto}
                  onChange={(e) => setJsonTexto(e.target.value)}
                  rows={13}
                  className="w-full bg-black text-green-400 font-mono text-xs p-4 rounded-2xl border border-zinc-800 focus:outline-none focus:border-green-500 transition-all resize-none leading-relaxed shadow-inner"
                  placeholder="[\n  {\n    'nome': 'Sabor Exemplo',\n    'description': 'Descrição do chefe',\n    'price': 0,\n    'ativo': true\n  }\n]"
                />
              </div>

              {/* MENSAGEM DE ERRO SINTÁTICO */}
              {erroJson && (
                <div className="text-red-400 text-xs font-mono mt-3 bg-red-500/5 p-3 rounded-xl border border-red-500/20 whitespace-pre-wrap">
                  ⚠️ {erroJson}
                </div>
              )}

              {/* BOTÕES DE AÇÃO */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <button
                  onClick={() => setProdutoEditando(null)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-black uppercase text-[10px] py-3 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarListaSabores}
                  disabled={carregando}
                  className="col-span-2 bg-green-500 hover:bg-green-400 disabled:opacity-40 text-black font-black uppercase text-[10px] py-3 rounded-xl shadow-lg shadow-green-500/10 transition-all tracking-wider"
                >
                  {carregando ? "Injetando no Banco..." : "💾 Salvar no Firestore"}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/20 border border-dashed border-zinc-800 rounded-[35px] p-12 text-center text-zinc-600 text-xs font-medium">
              Clique em algum produto da lista para abrir o editor JSON avançado de sabores.
            </div>
          )}
        </section>

      </div>
    </main>
  );
}