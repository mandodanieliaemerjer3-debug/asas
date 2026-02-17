"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../lib/firebase"; 
import { collection, addDoc, doc, updateDoc, getDoc, setDoc, increment } from "firebase/firestore";
import { useAuth } from "../../../contexts/AuthContext";

export default function PagamentoMestreMogu() {
  const { user } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [logistica, setLogistica] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem("carrinho");
    const savedLog = localStorage.getItem("logistica_final");
    
    // 🕵️ Captura o Afiliado da URL
    const urlParams = new URLSearchParams(window.location.search);
    const refDoLink = urlParams.get("ref");
    if (refDoLink) { localStorage.setItem("afiliado_origem", refDoLink); }

    if (savedCart && savedLog) {
      setCart(JSON.parse(savedCart));
      setLogistica(JSON.parse(savedLog));
    } else { router.push("/checkout"); }
  }, [router]);

  const finalizarPedido = async () => {
    if (!logistica || loading) return;
    setLoading(true);

    try {
      const hoje = new Date().toISOString().split('T')[0];
      const idAfiliado = localStorage.getItem("afiliado_origem");
      const idLinha = String(logistica.bairro.linhaId || "");

      // 🪙 CÁLCULO DE MOEDAS (Cashback 1% e Bônus Afiliado por item)
      const moedasCashbackCliente = cart.reduce((acc, item) => {
        const comissaoUmPorCento = (Number(item.price) || 0) * 0.01;
        return acc + Math.floor(comissaoUmPorCento * 200); 
      }, 0);

      const moedasParaAfiliado = cart.reduce((acc, item) => {
        return acc + (Number(item.coinAfiliado) || 0);
      }, 0);

      // 📦 MONTAGEM DO PEDIDO COMPLETO (LOGÍSTICA + FINANCEIRO)
      const dadosPedido = {
        clienteId: user?.uid || "anonimo",
        clienteNome: user?.displayName || "Cliente Guapiara",
        itens: cart.map(item => ({
          ...item,
          restaurantId: item.restaurantId || "rest_1"
        })),
        valores: {
          subtotal: cart.reduce((acc, i) => acc + (Number(i.price) || 0), 0),
          taxaEntrega: logistica.taxaEntrega,
          total: cart.reduce((acc, i) => acc + (Number(i.price) || 0), 0) + logistica.taxaEntrega
        },
        // 🛠️ DADOS LOGÍSTICOS RECUPERADOS DO ELITE
        pesoTotal: Number(logistica.pesoTotal) || 0,
        rankEntrega: logistica.bairro.level || "Off-Road Root",
        formaPagamento: "Pix",
        endereco: {
          bairro: logistica.bairro.name,
          linhaId: idLinha,
          rua: logistica.rua,
          numero: logistica.numero
        },
        // 💰 DADOS DE AFILIADO
        afiliadoId: idAfiliado || null,
        recompensa: {
          moedasAfiliado: moedasParaAfiliado,
          moedasCashback: moedasCashbackCliente
        },
        status: logistica.statusInicial || "Aguardando Entregador", 
        repasseConfirmado: false,
        criadoEm: hoje 
      };

      // 1. Grava o pedido no banco
      await addDoc(collection(db, "orders"), dadosPedido);

      // 2. 🚀 CONTROLE DE LINHA (RECUPERADO DO ELITE)
      if (idLinha && logistica.statusInicial === "Aguardando Entregador") {
        const linhaRef = doc(db, "linhas_do_dia", `${hoje}_linha_${idLinha}`);
        const linhaSnap = await getDoc(linhaRef);

        if (linhaSnap.exists()) {
          await updateDoc(linhaRef, {
            pedidosAtivos: increment(1),
            pesoTotal: increment(Number(logistica.pesoTotal) || 0)
          });
        } else {
          await setDoc(linhaRef, {
            data: hoje,
            linhaId: idLinha,
            pedidosAtivos: 1,
            pesoTotal: Number(logistica.pesoTotal) || 0
          });
        }
      }

      localStorage.removeItem("carrinho");
      localStorage.removeItem("logistica_final");
      
      alert("✅ Pedido Confirmado! A logística e suas moedas estão garantidas.");
      router.push("/");
    } catch (e) {
      alert("Erro crítico: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!logistica) return null;

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6 flex flex-col justify-center max-w-md mx-auto">
      <h1 className="text-xl font-black uppercase italic mb-8 text-center text-red-600">Finalizar Pedido</h1>
      <div className="bg-white text-black p-8 rounded-[40px] mb-8 shadow-2xl">
        <div className="flex justify-between text-3xl font-black italic border-t-2 border-zinc-100 pt-4 mt-2">
          <span>TOTAL</span>
          <span>R$ {(cart.reduce((acc, i) => acc + (Number(i.price) || 0), 0) + logistica.taxaEntrega).toFixed(2)}</span>
        </div>
      </div>
      <button onClick={finalizarPedido} disabled={loading} className="w-full bg-red-600 py-6 rounded-[35px] font-black uppercase italic shadow-2xl">
        {loading ? "PROCESSANDO..." : "CONFIRMAR E PEDIR ➔"}
      </button>
    </main>
  );
}