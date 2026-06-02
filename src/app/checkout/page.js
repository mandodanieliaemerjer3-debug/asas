"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../lib/firebase"; 
import { doc, onSnapshot, collection } from "firebase/firestore"; 
import { useAuth } from "../../contexts/AuthContext"; 

import { carregarCheckout } from "./checkoutLoader"; 
import Endereco from "./Endereco";
import Bebidas from "./Bebidas"; 
import soundManager from "../../lib/sounds";

import {
  prepararPedido,
  salvarPedido,
  limparCarrinho
} from "./pedido";

export default function CheckoutPage() {
  const { user } = useAuth();
  const router = useRouter();

  // =========================
  // ESTADOS DO CHECKOUT
  // =========================
  const [cart, setCart] = useState([]);
  const [bebidasCart, setBebidasCart] = useState([]);
  const [docesCart, setDocesCart] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [selectedBairro, setSelectedBairro] = useState(null);
  const [taxaFinal, setTaxaFinal] = useState(0);
  const [address, setAddress] = useState({ rua: "", numero: "" });
  const [loading, setLoading] = useState(true);
  const [taxasRestaurante, setTaxasRestaurante] = useState({});
  const [entregaDisponivel, setEntregaDisponivel] = useState(false);
  const [carregandoPedido, setCarregandoPedido] = useState(false);

  // =========================
  // CARREGAMENTO DOS DADOS (LOADER)
  // =========================
  useEffect(() => {
    async function inicializarDados() {
      try {
        setLoading(true);
        const dados = await carregarCheckout(user);

        setCart(dados.cart || []);
        setBebidasCart(dados.bebidasCart || []);
        setDocesCart(dados.docesCart || []);
        setNeighborhoods(dados.neighborhoods || []);
        
        // 🛠️ ALINHAMENTO: Mapeia corretamente independente de vir como taxasRestaurante ou taxasDoRestaurante
        const mapasTaxas = dados.taxasRestaurante || dados.taxasDoRestaurante || {};
        setTaxasRestaurante(mapasTaxas);

        if (dados.address?.rua) {
          setAddress(dados.address);
          setSelectedBairro(dados.selectedBairro);
          
          const vFrete = Number(dados.taxaFinal) || 0;
          setTaxaFinal(vFrete);
          
          if (vFrete > 0) {
            setEntregaDisponivel(true);
          }
        }
      } catch (error) {
        console.error("Erro ao montar checkout:", error);
      } finally {
        setLoading(false);
      }
    }

    inicializarDados();
  }, [user]);

  // Sincroniza quando o bairro muda
  useEffect(() => {
    if (!selectedBairro || !taxasRestaurante || Object.keys(taxasRestaurante).length === 0) return;
    
    const chaveLinha = String(selectedBairro.linhaId || selectedBairro.linha);
    const config = taxasRestaurante[chaveLinha];
    
    if (config) {
      setEntregaDisponivel(config.ativo === true);
      setTaxaFinal(Number(config.preco) || 0);
    }
  }, [selectedBairro, taxasRestaurante]);

  // =========================
  // LÓGICA DE AGRUPAMENTO (Ex: Água 4x)
  // =========================
  const agruparItens = (lista, campoNome, campoPreco) => {
    const agrupado = {};
    lista.forEach((item) => {
      const nome = item[campoNome];
      const preco = Number(item[campoPreco] || 0);
      if (agrupado[nome]) {
        agrupado[nome].quantidade += 1;
        agrupado[nome].precoTotal += preco;
      } else {
        agrupado[nome] = {
          ...item,
          quantidade: 1,
          precoUnitario: preco,
          precoTotal: preco
        };
      }
    });
    return Object.values(agrupado);
  };

  const pratosAgrupados = agruparItens(cart, "name", "price");
  const bebidasAgrupadas = agruparItens(bebidasCart, "nome", "preco");

  // =========================
  // FUNÇÕES DE REMOÇÃO DIRETA
  // =========================
  const removerPratoUnitario = (nomeAlvo) => {
    soundManager.play("remove");
    const index = cart.findIndex(item => item.name === nomeAlvo);
    if (index !== -1) {
      const novoCart = cart.filter((_, i) => i !== index);
      setCart(novoCart);
      localStorage.setItem("carrinho", JSON.stringify(novoCart));
    }
  };

  const removerBebidaUnitaria = (nomeAlvo) => {
    soundManager.play("remove");
    const index = bebidasCart.findIndex(item => item.nome === nomeAlvo);
    if (index !== -1) {
      const novaBebidaCart = bebidasCart.filter((_, i) => i !== index);
      setBebidasCart(novaBebidaCart);
      localStorage.setItem("bebidasCarrinho", JSON.stringify(novaBebidaCart));
    }
  };

  const adicionarBebidaExtra = (novaBebida) => {
    soundManager.play("add");
    const updated = [...bebidasCart, novaBebida];
    setBebidasCart(updated);
    localStorage.setItem("bebidasCarrinho", JSON.stringify(updated));
  };

  // =========================
  // CÁLCULOS DE TOTAIS (DIRETO E REAL)
  // =========================
  const subtotal = 
    cart.reduce((acc, item) => acc + (Number(item.price) || 0), 0) +
    bebidasCart.reduce((acc, item) => acc + (Number(item.preco) || 0), 0) +
    docesCart.reduce((acc, item) => acc + (Number(item.preco) || 0), 0);

  // 🛠️ SOMA MATEMÁTICA REAL: Soma o valor do frete direto se houver bairro selecionado
  const total = subtotal + (selectedBairro ? Number(taxaFinal) : 0);

  const handleFinalizarEIrParaPagamento = async () => {
    if (cart.length === 0 && bebidasCart.length === 0 && docesCart.length === 0) {
      alert("Sua sacola está vazia!");
      return;
    }

    if (!address.rua || !address.numero || !selectedBairro) {
      alert("Por favor, selecione um endereço de entrega válido!");
      return;
    }

    try {
      setCarregandoPedido(true);
      soundManager.play("click");

      const pacotePedido = prepararPedido({
        user,
        cart,
        bebidasCart,
        docesCart,
        address,
        selectedBairro,
        subtotal,
        taxaFinal: Number(taxaFinal) || 0,
        total,
        dadosTroco: { precisa: false, valorInput: 0 }
      });

      const pedidoId = await salvarPedido(pacotePedido);
      limparCarrinho();

      router.push(`/pagamento/${pedidoId}`);

    } catch (err) {
      console.error("Erro ao salvar pedido para a página de pagamento:", err);
      alert("Erro ao inicializar o fechamento do pedido.");
    } finally {
      setCarregandoPedido(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center font-black text-zinc-900 italic uppercase text-xs tracking-widest animate-pulse">
        Carregando Sacola...
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-28 text-zinc-900 font-sans antialiased p-4 max-w-md mx-auto">
      
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6 pt-2">
        <button onClick={() => router.push("/")} className="text-black text-xl bg-white w-10 h-10 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform">
          ←
        </button>
        <h1 className="font-black text-zinc-900 text-xl uppercase italic tracking-tighter">
          Fechar Pedido
        </h1>
      </div>

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

      {/* PRODUTOS */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm mb-4">
        <h2 className="text-xs font-black uppercase italic mb-3 text-black">
          📋 Seus Pratos
        </h2>
        {pratosAgrupados.length === 0 ? (
          <p className="text-xs text-gray-400 italic mb-2">Nenhum prato principal.</p>
        ) : (
          <div className="space-y-3 mb-4">
            {pratosAgrupados.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs border-b border-gray-50 pb-2">
                <div className="flex-1 pr-2">
                  <p className="font-extrabold text-zinc-800">
                    {item.name} {item.quantidade > 1 && <span className="text-orange-500 font-black ml-1">({item.quantidade}x)</span>}
                  </p>
                  {item.escolhasAjustadas && (
                    <p className="text-[10px] text-gray-400">✓ {item.escolhasAjustadas.join(", ")}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-zinc-600">R$ {item.precoTotal.toFixed(2)}</span>
                  <button 
                    onClick={() => removerPratoUnitario(item.name)}
                    className="w-5 h-5 bg-red-50 text-red-500 rounded-md flex items-center justify-center text-[10px] font-bold active:scale-90 transition-transform"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* BEBIDAS */}
        {bebidasAgrupadas.length > 0 && (
          <div className="border-t border-gray-100 pt-3 mt-2">
            <h2 className="text-xs font-black uppercase italic mb-3 text-orange-500">
              🧊 Bebidas da Adega
            </h2>
            <div className="space-y-3">
              {bebidasAgrupadas.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs border-b border-gray-50 pb-2">
                  <p className="font-extrabold text-zinc-800 uppercase">
                    {item.nome} {item.quantidade > 1 && <span className="text-orange-500 font-black ml-1">({item.quantidade}x)</span>}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-zinc-600">R$ {item.precoTotal.toFixed(2)}</span>
                    <button 
                      onClick={() => removerBebidaUnitaria(item.nome)}
                      className="w-5 h-5 bg-red-50 text-red-500 rounded-md flex items-center justify-center text-[10px] font-bold active:scale-90 transition-transform"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* UPSELL */}
      <Bebidas onAdd={adicionarBebidaExtra} />

      {/* RESUMO VALORES */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm mb-6 space-y-4">
        <div className="space-y-2 text-xs">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span>
            <span>R$ {subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-zinc-900 italic uppercase tracking-tighter">
            <span>Taxa de Entrega ({selectedBairro?.name || "--"})</span>
            <span className="text-orange-600 font-black">
              R$ {taxaFinal.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center font-black text-2xl italic uppercase border-t border-gray-100 pt-3">
          <span>Total</span>
          <span className="text-green-600 font-black">
            R$ {total.toFixed(2)}
          </span>
        </div>
      </div>

      {/* BOTÃO MASTER */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-100 to-transparent z-40">
        <button
          onClick={handleFinalizarEIrParaPagamento}
          disabled={carregandoPedido}
          className={`w-full max-w-md mx-auto block text-white p-5 rounded-[2rem] font-black uppercase italic text-sm shadow-2xl active:scale-95 transition-transform ${
            (entregaDisponivel || taxaFinal > 0) && !carregandoPedido
              ? "bg-zinc-900"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {carregandoPedido ? "Processando..." : (entregaDisponivel || taxaFinal > 0) ? "Ir para o Pagamento ➔" : "Somente Retirada"}
        </button>
      </div>

    </div>
  );
}