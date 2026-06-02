"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";

import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

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

  // =========================
  // ESTADOS
  // =========================
  const [cart, setCart] = useState([]);
  const [bebidasCart, setBebidasCart] = useState([]);
  const [docesCart, setDocesCart] = useState([]);

  const [neighborhoods, setNeighborhoods] = useState([]);

  const [selectedBairro, setSelectedBairro] = useState(null);

  const [taxaFinal, setTaxaFinal] = useState(0);

  const [address, setAddress] = useState({
    rua: "",
    numero: ""
  });

  const [loading, setLoading] = useState(true);

  // =========================
  // FRETE / ENTREGA
  // =========================
  const [taxasRestaurante, setTaxasRestaurante] = useState({});

  const [entregaDisponivel, setEntregaDisponivel] = useState(true);

  // =========================
  // INIT
  // =========================
  useEffect(() => {
    async function init() {
      const dados = await carregarCheckout(user);

      setCart(dados.cart || []);
      setBebidasCart(dados.bebidasCart || []);
      setDocesCart(dados.docesCart || []);

      setNeighborhoods(dados.neighborhoods || []);

      setAddress(
        dados.address || {
          rua: "",
          numero: ""
        }
      );

      setSelectedBairro(
        dados.selectedBairro || null
      );

      setTaxaFinal(dados.taxaFinal || 0);

      if (dados.entregaDisponivel !== undefined) {
        setEntregaDisponivel(
          dados.entregaDisponivel
        );
      }

      // =====================================
      // PEGA O RESTAURANTE DO PRIMEIRO ITEM
      // =====================================
      const restId =
        dados.cart &&
        dados.cart.length > 0
          ? dados.cart[0].restaurantId
          : null;

      if (restId) {
        const restSnap = await getDoc(
          doc(db, "restaurants", restId)
        );

        if (restSnap.exists()) {
          setTaxasRestaurante(
            restSnap.data().taxasPorLinha || {}
          );
        }
      }

      setLoading(false);
    }

    init();
  }, [user]);

  // =========================
  // AGRUPAR ITENS
  // =========================
  const agruparItens = (lista, campoNome) => {
    return lista.reduce((acc, item) => {
      const nomeItem = item[campoNome];

      if (item.escolhasAjustadas) {
        acc.push({
          ...item,
          qtd: 1
        });

        return acc;
      }

      const existente = acc.find(
        (i) =>
          i[campoNome] === nomeItem &&
          !i.escolhasAjustadas
      );

      if (existente) {
        existente.qtd += 1;
      } else {
        acc.push({
          ...item,
          qtd: 1
        });
      }

      return acc;
    }, []);
  };

  // =========================
  // ITENS AGRUPADOS
  // =========================
  const pratosAgrupados = agruparItens(
    cart,
    "name"
  );

  const bebidasAgrupados = agruparItens(
    bebidasCart,
    "nome"
  );

  const docesAgrupados = agruparItens(
    docesCart,
    "nome"
  );

  // =========================
  // REMOVER BEBIDA
  // =========================
  const removerUnidadeBebida = (nome) => {
    const index = bebidasCart.findLastIndex(
      (b) => b.nome === nome
    );

    if (index !== -1) {
      const novo = bebidasCart.filter(
        (_, i) => i !== index
      );

      setBebidasCart(novo);

      localStorage.setItem(
        "bebidasCarrinho",
        JSON.stringify(novo)
      );
    }
  };

  // =========================
  // REMOVER PRATO
  // =========================
  const removerUnidadePrato = (itemAlvo) => {
    const index = cart.findLastIndex(
      (p) => p.name === itemAlvo.name
    );

    if (index !== -1) {
      const novo = cart.filter(
        (_, i) => i !== index
      );

      setCart(novo);

      localStorage.setItem(
        "carrinho",
        JSON.stringify(novo)
      );
    }
  };

  // =========================
  // REMOVER DOCE
  // =========================
  const removerUnidadeDoce = (nome) => {
    const index = docesCart.findLastIndex(
      (d) => d.nome === nome
    );

    if (index !== -1) {
      const novo = docesCart.filter(
        (_, i) => i !== index
      );

      setDocesCart(novo);

      localStorage.setItem(
        "docesCarrinho",
        JSON.stringify(novo)
      );
    }
  };

  // =========================
  // FINANCEIRO
  // =========================
  const subtotalPratos = cart.reduce(
    (acc, i) => acc + (i.price || 0),
    0
  );

  const subtotalBebidas = bebidasCart.reduce(
    (acc, i) => acc + (i.preco || 0),
    0
  );

  const subtotalParaPagamento =
    subtotalPratos + subtotalBebidas;

  const total =
    subtotalParaPagamento + taxaFinal;

  const moedasCredito =
    Math.floor(taxaFinal);

  // =========================
  // FINALIZAR PEDIDO
  // =========================
  const handleFinalizar = async () => {
    if (!entregaDisponivel) {
      alert(
        "Desculpe, este restaurante não está entregando na sua linha no momento."
      );

      return;
    }

    if (!selectedBairro) {
      alert("Selecione o bairro!");
      return;
    }

    if (!address.rua || !address.numero) {
      alert(
        "Preencha rua e número!"
      );

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

      const id = await salvarPedido(
        pedido
      );

      limparCarrinho();

      router.push(`/pagamento/${id}`);
    } catch (err) {
      alert(
        "Erro ao enviar pedido: " +
          err.message
      );
    }
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className="p-10 text-center font-black italic">
        CARREGANDO...
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-gray-100 min-h-screen pb-32 p-4 font-sans text-zinc-900">

      <h1 className="text-2xl font-black uppercase italic mb-6 ml-2">
        Checkout
      </h1>

      {/* ENDEREÇO */}
      <Endereco
        address={address}
        setAddress={setAddress}
        neighborhoods={neighborhoods}
        selectedBairro={selectedBairro}
        setSelectedBairro={setSelectedBairro}
        setTaxaFinal={setTaxaFinal}
        taxasDoRestaurante={taxasRestaurante}
      />

      {/* BEBIDAS */}
      <Bebidas
        userId={user?.uid}
        onAdd={(item) => {
          const nova = [
            ...bebidasCart,
            {
              ...item,
              restaurantId: "adega_geral"
            }
          ];

          setBebidasCart(nova);

          localStorage.setItem(
            "bebidasCarrinho",
            JSON.stringify(nova)
          );
        }}
      />

      {/* ITENS */}
      <div className="bg-white rounded-[35px] p-6 shadow-sm mb-4">

        <p className="font-black text-gray-400 text-[10px] uppercase tracking-widest mb-4">
          Itens Selecionados
        </p>

        <div className="space-y-4">

          {/* PRATOS */}
          {pratosAgrupados.map((item, i) => (
            <div
              key={`p-${i}`}
              className="flex justify-between items-center border-b border-gray-50 pb-2"
            >
              <div className="flex flex-col flex-1 pr-2">

                <span className="font-bold text-sm leading-tight">
                  {item.name}

                  {item.qtd > 1 &&
                    ` (${item.qtd}x)`}
                </span>

                {item.escolhasAjustadas ? (
                  <span className="text-[10px] text-red-500 font-bold uppercase mt-0.5">
                    ✓ {item.escolhasAjustadas.join(", ")}
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-400 uppercase font-bold">
                    Refeição
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">

                <span className="font-black text-sm">
                  R$ {(item.price * item.qtd).toFixed(2)}
                </span>

                <button
                  onClick={() =>
                    removerUnidadePrato(item)
                  }
                  className="text-xs"
                >
                  ➖
                </button>
              </div>
            </div>
          ))}

        </div>
      </div>

      {/* FRETE */}
      <div className="bg-white p-6 rounded-[35px] shadow-sm mb-24">

        <div className="space-y-3 mb-4 border-b pb-4 border-gray-100 font-bold text-sm">

          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span>

            <span>
              R$ {subtotalParaPagamento.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between text-zinc-900 italic uppercase tracking-tighter">

            <span>
              Taxa de Entrega (
              {selectedBairro?.name || "--"})
            </span>

            <span className="text-orange-600 font-black">
              R$ {taxaFinal.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center font-black text-2xl italic uppercase">

          <span>Total</span>

          <span className="text-green-600 font-black">
            R$ {total.toFixed(2)}
          </span>
        </div>
      </div>

      {/* BOTÃO */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-100 to-transparent">

        <button
          onClick={handleFinalizar}
          className={`w-full max-w-md mx-auto block text-white p-5 rounded-[2rem] font-black uppercase italic text-sm shadow-2xl active:scale-95 transition-transform ${
            entregaDisponivel
              ? "bg-zinc-900"
              : "bg-red-500"
          }`}
        >
          {entregaDisponivel
            ? "FINALIZAR PEDIDO ➔"
            : "ENTREGA INDISPONÍVEL"}
        </button>
      </div>
    </div>
  );
}