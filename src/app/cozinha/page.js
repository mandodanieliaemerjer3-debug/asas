// src/app/cozinha/page.js

"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

import { db } from "../../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

import { VozCozinha } from "./voz-cozinha";
import { usePedidos } from "./use-pedidos";
import { CardPedido } from "./CardPedido";
import { AudioVisualizer } from "./AudioVisualizer";

import soundManager from "../../lib/sounds";

export default function PainelCozinhaCompleto() {
  const { pedidos, restaurante } = usePedidos();

  const [pedidoConfirmacao, setPedidoConfirmacao] = useState(null);

  const [statusVoz, setStatusVoz] = useState(
    "AGUARDANDO 'MOGU MOGU'..."
  );

  // DEBUG VISUAL
  const [debugTexto, setDebugTexto] = useState("");

  const [vozAtiva, setVozAtiva] = useState(false);

  const vozRef = useRef(null);
  const iniciouRef = useRef(false);

  // CRIA APENAS UMA VEZ
  useEffect(() => {
    vozRef.current = new VozCozinha(

      // WAKE WORD
      () => {
        console.log("🔥 Wake word");

        soundManager.play("click");

        setStatusVoz("OUVINDO...");
      },

      // COMANDO
      (comando) => {
        console.log("📦 Comando recebido:", comando);

        setStatusVoz(`COMANDO: ${comando}`);

        // MOSTRA NA TELA
        setDebugTexto(comando);

        // FUTURO GEMINI
        // enviarPerguntaGemini(comando)
      }
    );

    return () => {
      if (vozRef.current) {
        vozRef.current.parar();
      }
    };
  }, []);

  // CONTROLA VOZ
  useEffect(() => {
    if (!vozRef.current) return;

    // DESLIGA
    if (!vozAtiva) {
      vozRef.current.parar();

      setStatusVoz("MOGU DORMINDO");

      iniciouRef.current = false;

      return;
    }

    // INICIA APÓS TOQUE
    const iniciarAudio = async () => {
      if (iniciouRef.current) return;

      iniciouRef.current = true;

      try {
        // LIBERA MICROFONE
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        console.log("🎤 Microfone liberado");

        vozRef.current.iniciar();

        setStatusVoz("AGUARDANDO 'MOGU MOGU'...");
      } catch (e) {
        console.log("❌ Microfone bloqueado:", e);

        setStatusVoz("MICROFONE BLOQUEADO");
      }
    };

    window.addEventListener("click", iniciarAudio);

    return () => {
      window.removeEventListener("click", iniciarAudio);
    };
  }, [vozAtiva]);

  // ALTERAR STATUS
  const mudarStatus = async (pedido) => {
    if (pedido.status === "Pendente") {
      await updateDoc(
        doc(db, "orders", pedido.id),
        {
          status: "Preparando",
        }
      );
    } else {
      setPedidoConfirmacao(pedido);
    }
  };

  // CONFIRMAR MOTOBOY
  const confirmarMotoboy = async () => {
    await updateDoc(
      doc(db, "orders", pedidoConfirmacao.id),
      {
        status: "Aguardando Entregador",
      }
    );

    soundManager.play("pedidoPronto");

    setPedidoConfirmacao(null);
  };

  return (
    <main className="h-screen bg-white flex flex-col overflow-hidden font-sans">

      {/* HEADER */}
      <header
        className={`h-16 flex items-center px-6 justify-between border-b-2 shadow-md ${
          vozAtiva
            ? "bg-gray-900 border-orange-500"
            : "bg-gray-50 border-gray-200"
        }`}
      >
        <div className="flex items-center gap-4">

          {/* MOGU */}
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 bg-white">
            <Image
              src={
                vozAtiva
                  ? "/images/mogu-acordado.png"
                  : "/images/mogu-dormindo.png"
              }
              alt="Mogu"
              fill
              className="object-contain"
            />
          </div>

          {/* STATUS */}
          <div className="flex flex-col">

            <span
              className={`text-[11px] font-black italic uppercase ${
                vozAtiva
                  ? "text-white"
                  : "text-gray-500"
              }`}
            >
              {statusVoz}
            </span>

            {/* VISUALIZADOR */}
            {vozAtiva && (
              <AudioVisualizer ativo={vozAtiva} />
            )}

            {/* DEBUG TEXTO */}
            <div className="text-xs text-orange-400 font-bold mt-1">
              {debugTexto}
            </div>

          </div>
        </div>

        {/* BOTÃO */}
        <button
          onClick={() => {
            setVozAtiva((v) => !v);
          }}
          className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase ${
            vozAtiva
              ? "bg-red-600 text-white"
              : "bg-green-600 text-white"
          }`}
        >
          {vozAtiva
            ? "Dormir Mogu"
            : "Acordar Mogu"}
        </button>
      </header>

      {/* FILA */}
      <section className="h-[80%] p-6 overflow-y-auto bg-white">

        <h1 className="text-4xl font-black italic uppercase mb-6">
          {restaurante.nome}
        </h1>

        <div className="flex flex-col gap-4">

          {pedidos
            .filter(
              (p) =>
                p.status !==
                "Aguardando Entregador"
            )
            .map((p) => (
              <CardPedido
                key={p.id}
                pedido={p}
                onClick={mudarStatus}
              />
            ))}
        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="h-[10%] bg-[#064E3B] flex items-center gap-4 px-6 overflow-x-auto">

        <span className="text-[#10B981] font-black italic text-xs border-r pr-4 border-green-900">
          PRONTOS
        </span>

        {pedidos
          .filter(
            (p) =>
              p.status ===
              "Aguardando Entregador"
          )
          .map((p) => (
            <div
              key={p.id}
              className="min-w-[200px] bg-[#065F46] border-2 border-[#10B981] rounded-xl px-4 py-2 flex justify-between items-center"
            >
              <span className="text-white font-black italic">
                #
                {p.id
                  .slice(-4)
                  .toUpperCase()}
              </span>

              <div className="w-2 h-2 bg-[#10B981] rounded-full animate-ping"></div>
            </div>
          ))}
      </footer>

      {/* POPUP */}
      {pedidoConfirmacao && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4">

          <div className="bg-white border-[6px] border-orange-500 rounded-[40px] p-10 w-full max-w-sm text-center">

            <h2 className="text-3xl font-black italic text-orange-500">
              PRONTO?
            </h2>

            <div className="flex gap-4 mt-8">

              <button
                onClick={() =>
                  setPedidoConfirmacao(null)
                }
                className="flex-1 bg-gray-200 p-4 rounded-xl font-black"
              >
                NÃO
              </button>

              <button
                onClick={confirmarMotoboy}
                className="flex-1 bg-orange-500 text-white p-4 rounded-xl font-black italic"
              >
                SIM
              </button>

            </div>
          </div>
        </div>
      )}
    </main>
  );
}