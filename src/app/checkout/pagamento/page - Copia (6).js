"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../lib/firebase"; 
import { collection, addDoc, doc, updateDoc, getDoc, setDoc, increment } from "firebase/firestore";
import { useAuth } from "../../../contexts/AuthContext";

export default function PagamentoFinalElite() {
  const { user } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [logistica, setLogistica] = useState(null);
  const [formaPagamento, setFormaPagamento] = useState("Pix");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem("carrinho");
    const savedLog = localStorage.getItem("logistica_final");
    if (!savedCart || !savedLog) { router.push("/checkout"); return; }
    setCart(JSON.parse(savedCart));
    setLogistica(JSON.parse(savedLog));
  }, [router]);

  const finalizarPedido = async () => {
    if (!logistica || loading) return;
    setLoading(true);

    try {
      const hoje = new Date().toISOString().split('T')[0];
      const idLinha = String(logistica.bairro.linhaId || "");

      const itensVinculados = cart.map(item => ({
        ...item,
        restaurantId: item.restaurantId || "rest_1" 
      }));

      const dadosPedido = {
        clienteId: user?.uid || "anonimo",
        clienteNome: user?.displayName || "Cliente Guapiara",
        itens: itensVinculados,
        valores: {
          subtotal: itensVinculados.reduce((acc, i) => acc + (Number(i.price) || 0), 0),
          taxaEntrega: logistica.taxaEntrega,
          total: itensVinculados.reduce((acc, i) => acc + (Number(i.price) || 0), 0) + logistica.taxaEntrega
        },
        pesoTotal: Number(logistica.pesoTotal) || 0,
        formaPagamento,
        rankEntrega: logistica.bairro.level || "Off-Road Root",
        endereco: {
          bairro: logistica.bairro.name,
          linhaId: idLinha,
          rua: logistica.rua,
          numero: logistica.numero
        },
        // 🚀 AQUI ESTÁ A MUDANÇA: Aceita o status dinâmico (Pendente ou Aguardando)
        status: logistica.statusInicial || "Aguardando Entregador", 
        repasseConfirmado: false,
        criadoEm: hoje 
      };

      await addDoc(collection(db, "orders"), dadosPedido);

      // Só atualiza a logística de linha se o pedido for realmente do tipo que aguarda entregador
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
      alert("✅ Pedido Confirmado! Verifique o painel do restaurante.");
      router.push("/");
    } catch (e) {
      alert("Erro ao finalizar: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!logistica) return null;

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6 font-sans max-w-md mx-auto flex flex-col justify-center">
      <h1 className="text-xl font-black uppercase italic mb-8 text-center tracking-tighter text-red-600">Finalizar Pedido</h1>
      
      <div className="bg-white text-black p-8 rounded-[40px] mb-8 shadow-2xl">
        <div className="flex justify-between text-3xl font-black italic border-t-2 border-zinc-100 pt-4 mt-2">
          <span>TOTAL</span>
          <span>R$ {(cart.reduce((acc, i) => acc + (Number(i.price) || 0), 0) + logistica.taxaEntrega).toFixed(2)}</span>
        </div>
      </div>

      <button 
        onClick={finalizarPedido} 
        disabled={loading}
        className="w-full bg-red-600 py-6 rounded-[35px] font-black uppercase italic text-sm shadow-2xl active:scale-95 transition disabled:opacity-50"
      >
        {loading ? "REGISTRANDO..." : "CONFIRMAR E PEDIR ➔"}
      </button>
    </main>
  );
}