"use client";
import { useState, useEffect } from "react";

export default function Cronometro({ aoAcabar }) {
  const [timeLeft, setTimeLeft] = useState(15); // Inicia em 15 segundos

  useEffect(() => {
    // Cria um motor que roda a cada 1 segundo (1000ms)
    const motor = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(motor);
          aoAcabar(); // Avisa o sistema para rejeitar o pedido
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Para o motor se o entregador aceitar ou recusar antes do tempo
    return () => clearInterval(motor);
  }, [aoAcabar]);

  return (
    <div className="bg-black text-white w-14 h-14 rounded-full flex flex-col items-center justify-center font-black shadow-xl border-4 border-red-600 animate-pulse">
      <span className="text-[8px] uppercase leading-none mb-1 text-red-400">Tempo</span>
      <span className="text-xl leading-none">{timeLeft}s</span>
    </div>
  );
}