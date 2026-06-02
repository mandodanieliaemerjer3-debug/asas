"use client";

import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";

import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc
} from "firebase/firestore";

import { useRouter } from "next/navigation";

export default function PainelCozinha() {
  const [pedidos, setPedidos] = useState([]);
  const [nomeRestaurante, setNomeRestaurante] = useState("");
  const [pedidoConfirmacao, setPedidoConfirmacao] = useState(null);

  const router = useRouter();

  useEffect(() => {
    // 🔥 PEGA DADOS DA SESSÃO
    const idSessao = sessionStorage.getItem("restauranteId");
    const nomeSessao = sessionStorage.getItem("nomeRestaurante");

    // 🔒 SEM LOGIN
    if (!idSessao) {
      router.push("/login-cozinha");
      return;
    }

    // ✅ EVITA HYDRATION ERROR
    setNomeRestaurante(nomeSessao || "Cozinha");

    // 🔥 BUSCA PEDIDOS
    const q = query(
      collection(db, "orders"),
      where("restaurantId", "==", idSessao),
      where("status", "in", [
        "Pendente",
        "Preparando",
        "Aguardando Entregador"
      ])
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const lista = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));

        const ordenados = lista.sort(
          (a, b) =>
            (a.confirmadoEm?.seconds || 0) -
            (b.confirmadoEm?.seconds || 0)
        );

        setPedidos(ordenados);
      },
      (error) => {
        console.error(error);
      }
    );

    return () => unsubscribe();

  }, [router]);

  // 🔥 ALTERAR STATUS
  const mudarStatus = async (pedido) => {

    // PENDENTE → PREPARANDO
    if (pedido.status === "Pendente") {

      try {
        await updateDoc(doc(db, "orders", pedido.id), {
          status: "Preparando"
        });

      } catch (err) {
        alert("Erro ao atualizar pedido");
      }

      return;
    }

    // PREPARANDO → POPUP
    if (pedido.status === "Preparando") {
      setPedidoConfirmacao(pedido);
    }
  };

  // 🔥 CONFIRMAR MOTOboy
  const confirmarMotoboy = async () => {

    if (!pedidoConfirmacao) return;

    try {

      await updateDoc(
        doc(db, "orders", pedidoConfirmacao.id),
        {
          status: "Aguardando Entregador"
        }
      );

      setPedidoConfirmacao(null);

    } catch (err) {
      alert("Erro ao chamar motoboy");
    }
  };

  // 🔥 DESFAZER
  const desfazerPedido = async (pedido) => {

    try {

      await updateDoc(doc(db, "orders", pedido.id), {
        status: "Preparando"
      });

    } catch (err) {
      alert("Erro ao desfazer");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-6 font-sans">

      {/* 🔥 POPUP CONFIRMAÇÃO */}
      {pedidoConfirmacao && (

        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">

          <div className="bg-zinc-900 border border-white/10 rounded-[40px] p-8 w-full max-w-md">

            <h2 className="text-3xl font-black italic uppercase text-orange-500 mb-4">
              Pedido pronto?
            </h2>

            <p className="text-white/60 font-bold uppercase text-sm mb-8">
              O motoboy será chamado.
            </p>

            <div className="flex gap-4">

              <button
                onClick={() => setPedidoConfirmacao(null)}
                className="flex-1 bg-zinc-800 p-5 rounded-2xl font-black uppercase"
              >
                Cancelar
              </button>

              <button
                onClick={confirmarMotoboy}
                className="flex-1 bg-orange-500 text-black p-5 rounded-2xl font-black uppercase italic"
              >
                Chamar Motoboy
              </button>

            </div>

          </div>

        </div>

      )}

      {/* 🔥 HEADER */}
      <header className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">

        <div>

          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-orange-500">
            {nomeRestaurante}
          </h1>

          <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
            Painel de Produção Real-Time
          </p>

        </div>

        <div className="bg-zinc-900 px-6 py-3 rounded-full border border-white/5">

          <span className="text-xl font-black">
            {pedidos.length}
          </span>

          <span className="ml-2 text-[10px] font-bold opacity-50 uppercase">
            Pedidos na fila
          </span>

        </div>

      </header>

      {/* 🔥 GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

        {pedidos.map((pedido) => (

          <div
            key={pedido.id}
            onClick={() => mudarStatus(pedido)}
            className={`
              p-6 rounded-[45px] border-2 transition-all active:scale-95 cursor-pointer flex flex-col justify-between min-h-[350px]

              ${
                pedido.status === "Pendente"
                  ? "bg-zinc-900 border-white/10"

                  : pedido.status === "Preparando"
                  ? "bg-orange-500/10 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.2)]"

                  : "bg-blue-500/10 border-blue-500"
              }
            `}
          >

            <div>

              <div className="flex justify-between items-start mb-6">

                <span className="text-3xl font-black italic">
                  #{pedido.id.slice(-4).toUpperCase()}
                </span>

                <span
                  className={`
                    text-[9px] font-black px-3 py-1 rounded-full uppercase

                    ${
                      pedido.status === "Pendente"
                        ? "bg-white/10 text-white"
                        : "bg-white text-black"
                    }
                  `}
                >
                  {pedido.status}
                </span>

              </div>

              {/* 🔥 ITENS */}
              <div className="space-y-4">

                {pedido.itens?.map((item, i) => (

                  <div key={i} className="flex items-center gap-3">

                    <span className="bg-orange-500 text-black w-7 h-7 flex items-center justify-center rounded-xl font-black text-xs">
                      1
                    </span>

                    <span className="font-bold text-lg leading-tight uppercase italic">
                      {item.name}
                    </span>

                  </div>

                ))}

              </div>

            </div>

            {/* 🔥 FOOTER */}
            <div className="mt-8 pt-6 border-t border-white/5">

              {pedido.status === "Pendente" && (

                <p className="text-[10px] font-black opacity-30 uppercase text-center">
                  Toque para iniciar
                </p>

              )}

              {pedido.status === "Preparando" && (

                <p className="text-[10px] font-black opacity-30 uppercase text-center">
                  Toque para finalizar
                </p>

              )}

              {pedido.status === "Aguardando Entregador" && (

                <div className="space-y-4">

                  <p className="text-[10px] font-black opacity-30 uppercase text-center">
                    Motoboy chamado
                  </p>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      desfazerPedido(pedido);
                    }}
                    className="w-full bg-zinc-800 p-3 rounded-2xl text-[10px] font-black uppercase"
                  >
                    ↩ Voltar para Preparando
                  </button>

                </div>

              )}

            </div>

          </div>

        ))}

      </div>

      {/* 🔥 VAZIO */}
      {pedidos.length === 0 && (

        <div className="flex flex-col items-center justify-center h-[60vh] opacity-20">

          <div className="text-6xl mb-4">
            🍳
          </div>

          <p className="font-black italic uppercase">
            Cozinha em espera...
          </p>

        </div>

      )}

    </main>
  );
}