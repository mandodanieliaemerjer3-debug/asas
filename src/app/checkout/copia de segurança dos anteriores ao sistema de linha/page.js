"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import Bebidas from "./Bebidas";
import Endereco from "./Endereco";

import { carregarCheckout } from "./checkoutLoader";
import {
  prepararPedido,
  salvarPedido,
  limparCarrinho
} from "./pedido";

export default function CheckoutPage() {
  const { user } = useAuth();
  const router = useRouter();

  // ESTADOS ORIGINAIS
  const [cart, setCart] = useState([]);
  const [bebidasCart, setBebidasCart] = useState([]);
  const [docesCart, setDocesCart] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [selectedBairro, setSelectedBairro] = useState(null);
  const [taxaFinal, setTaxaFinal] = useState(0);
  const [address, setAddress] = useState({ rua: "", numero: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const dados = await carregarCheckout(user);
      setCart(dados.cart || []);
      setBebidasCart(dados.bebidasCart || []);
      setDocesCart(dados.docesCart || []);
      setNeighborhoods(dados.neighborhoods || []);
      setAddress(dados.address || { rua: "", numero: "" });
      setSelectedBairro(dados.selectedBairro || null);
      setTaxaFinal(dados.taxaFinal || 0);
      setLoading(false);
    }
    init();
  }, [user]);

  // AGRUPAMENTO INTELIGENTE (CORRIGIDO SEM ERROS DE SINTAXE)
  const agruparItens = (lista, campoNome) => {
    return lista.reduce((acc, item) => {
      const nomeItem = item[campoNome];
      
      if (item.escolhasAjustadas) {
        acc.push({ ...item, qtd: 1 });
        return acc;
      }

      const existente = acc.find(i => i[campoNome] === nomeItem && !i.escolhasAjustadas);
      if (existente) {
        existente.qtd += 1;
      } else {
        acc.push({ ...item, qtd: 1 });
      }
      return acc;
    }, []);
  };

  // VARIÁVEIS PADRONIZADAS
  const pratosAgrupados = agruparItens(cart, "name");
  const bebidasAgrupados = agruparItens(bebidasCart, "nome");
  const docesAgrupados = agruparItens(docesCart, "nome");

  // REMOÇÃO SELETA DE UNIDADES
  const removerUnidadeBebida = (nome) => {
    const index = bebidasCart.findLastIndex(b => b.nome === nome);
    if (index !== -1) {
      const novo = bebidasCart.filter((_, i) => i !== index);
      setBebidasCart(novo);
      localStorage.setItem("bebidasCarrinho", JSON.stringify(novo));
    }
  };

  const removerUnidadePrato = (itemAlvo) => {
    const index = cart.findLastIndex(p => p.name === itemAlvo.name);
    if (index !== -1) {
      const novo = cart.filter((_, i) => i !== index);
      setCart(novo);
      localStorage.setItem("carrinho", JSON.stringify(novo));
    }
  };

  const removerUnidadeDoce = (nome) => {
    const index = docesCart.findLastIndex(d => d.nome === nome);
    if (index !== -1) {
      const novo = docesCart.filter((_, i) => i !== index);
      setDocesCart(novo);
      localStorage.setItem("docesCarrinho", JSON.stringify(novo));
    }
  };

  // FINANCEIRO ORIGINAL
  const subtotalPratos = cart.reduce((acc, i) => acc + (i.price || 0), 0);
  const subtotalBebidas = bebidasCart.reduce((acc, i) => acc + (i.preco || 0), 0);
  const subtotalParaPagamento = subtotalPratos + subtotalBebidas;
  const total = subtotalParaPagamento + taxaFinal;
  const moedasCredito = Math.floor(taxaFinal); 

  const handleFinalizar = async () => {
    if (!selectedBairro) {
      alert("Selecione o bairro para a entrega!");
      return;
    }
    if (!address.rua || !address.numero) {
      alert("Por favor, preencha o número e rua da entrega!");
      return;
    }

    try {
      const pedido = prepararPedido({
        user,
        cart,
        bebidasCart,
        docesCart,
        address,
        selectedBairro,
        subtotal: subtotalParaPagamento,
        taxaFinal,
        total
      });

      const id = await salvarPedido(pedido);
      limparCarrinho();
      router.push(`/pagamento/${id}`);
      
    } catch (err) {
      alert("Erro ao enviar pedido: " + err.message);
    }
  };

  if (loading) return <div className="p-10 text-center font-black italic">CARREGANDO...</div>;

  return (
    <div className="max-w-md mx-auto bg-gray-100 min-h-screen pb-32 p-4 font-sans text-zinc-900">
      <h1 className="text-2xl font-black uppercase italic mb-6 ml-2">Checkout</h1>

      {/* COMPONENTE DE ENDEREÇO */}
      <Endereco 
        address={address} 
        setAddress={setAddress} 
        neighborhoods={neighborhoods}
        selectedBairro={selectedBairro}
        setSelectedBairro={setSelectedBairro}
        setTaxaFinal={setTaxaFinal}
      />

      {/* COMPONENTE DA ADEGA DA BEBIDAS */}
      <Bebidas 
        userId={user?.uid}
        onAdd={(item) => {
          const nova = [...bebidasCart, { ...item, restaurantId: "adega_geral" }];
          setBebidasCart(nova);
          localStorage.setItem("bebidasCarrinho", JSON.stringify(nova));
        }} 
      />

      {/* REVISÃO COMPLETA DOS ELEMENTOS DO CARRINHO */}
      <div className="bg-white rounded-[35px] p-6 shadow-sm mb-4">
        <p className="font-black text-gray-400 text-[10px] uppercase tracking-widest mb-4">Itens Selecionados</p>
        <div className="space-y-4">
          
          {/* PRATOS PRINCIPAIS */}
          {pratosAgrupados.map((item, i) => (
            <div key={`p-${i}`} className="flex justify-between items-center border-b border-gray-50 pb-2">
              <div className="flex flex-col flex-1 pr-2">
                <span className="font-bold text-sm leading-tight">
                  {item.name} {item.qtd > 1 && `(${item.qtd}x)`}
                </span>
                {item.escolhasAjustadas ? (
                  <span className="text-[10px] text-red-500 font-bold uppercase mt-0.5">
                    ✓ {item.escolhasAjustadas.join(", ")}
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Refeição</span>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-black text-sm">R$ {(item.price * item.qtd).toFixed(2)}</span>
                <button onClick={() => removerUnidadePrato(item)} className="text-xs">➖</button>
              </div>
            </div>
          ))}

          {/* ADEGA - BEBIDAS */}
          {bebidasAgrupados.map((item, i) => (
            <div key={`b-${i}`} className="flex justify-between items-center border-b border-gray-50 pb-2 bg-blue-50/20 p-2 rounded-xl">
              <div className="flex flex-col">
                <span className="font-bold text-sm">{item.nome} {item.qtd > 1 && `(${item.qtd}x)`}</span>
                <span className="text-[10px] text-blue-400 font-bold uppercase">Adega Mogu</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-black text-sm">R$ {(item.preco * item.qtd).toFixed(2)}</span>
                <button onClick={() => removerUnidadeBebida(item.nome)} className="text-xs">➖</button>
              </div>
            </div>
          ))}

          {/* DOCES RESGATADOS */}
          {docesAgrupados.map((item, i) => (
            <div key={`d-${i}`} className="flex justify-between items-center border-b border-gray-50 pb-2 bg-pink-50/20 p-2 rounded-xl">
              <div className="flex flex-col">
                <span className="font-bold text-sm text-pink-600 italic">{item.nome} {item.qtd > 1 && `(${item.qtd}x)`}</span>
                <span className="text-[10px] text-pink-400 font-bold uppercase tracking-tighter">Resgate via Moedas 🎁</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-black text-xs text-pink-500 uppercase italic">CORTESIA</span>
                <button onClick={() => removerUnidadeDoce(item.nome)} className="text-xs">➖</button>
              </div>
            </div>
          ))}

        </div>
      </div>

      {/* FRETE EM DOCES */}
      <div className="bg-pink-50 p-6 rounded-[35px] mb-4 text-center border-2 border-pink-100 shadow-sm">
        <p className="font-black text-pink-700 text-sm uppercase italic">Troque seu Frete por Doces!</p>
        <p className="text-[10px] font-bold text-pink-400 uppercase mb-3">Valor para resgate: M$ {moedasCredito}</p>
        <button 
          type="button" 
          onClick={() => router.push(`/doces?credito=${moedasCredito}`)}
          className="w-full bg-pink-500 text-white p-4 rounded-2xl font-black uppercase italic text-xs shadow-lg"
        >
          ESCOLHER SOBREMESA 🍰
        </button>
      </div>

      {/* RESUMO FINANCEIRO */}
      <div className="bg-white p-6 rounded-[35px] shadow-sm mb-24">
        <div className="space-y-3 mb-4 border-b pb-4 border-gray-100 font-bold text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal de Compras</span>
            <span>R$ {subtotalParaPagamento.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between text-zinc-900 italic uppercase tracking-tighter">
            <span>Taxa de Entrega ({selectedBairro?.name || "-- Asia --"})</span>
            <span className="text-orange-600 font-black">R$ {taxaFinal.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex justify-between items-center font-black text-2xl italic uppercase">
          <span>Total a Pagar</span>
          <span className="text-green-600 font-black">R$ {total.toFixed(2)}</span>
        </div>
      </div>

      {/* BOTÃO FINALIZAR FLUTUANTE */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-100 to-transparent">
        <button
          onClick={handleFinalizar}
          className="w-full max-w-md mx-auto block bg-zinc-900 text-white p-5 rounded-[2rem] font-black uppercase italic text-sm shadow-2xl active:scale-95 transition-transform"
        >
          FINALIZAR PEDIDO ➔
        </button>
      </div>
    </div>
  );
}