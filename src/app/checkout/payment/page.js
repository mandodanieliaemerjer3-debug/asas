"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../../../contexts/AuthContext";

export default function PaymentSelection({ pedidoId, totalReal, totalMoedas, saldoUsuarioMoedas }) {
  const router = useRouter();

  const opcoes = [
    { id: 'pix', nome: 'Pix', icon: '⚡', desc: 'Aprovação imediata' },
    { id: 'mp', nome: 'Mercado Pago', icon: '💳', desc: 'Cartão ou Parcelado' },
    { id: 'dinheiro', nome: 'Dinheiro', icon: '💵', desc: 'Pagar na entrega' },
  ];

  return (
    <div className="p-4 space-y-4">
      <h2 className="font-black uppercase italic text-gray-800">Como deseja pagar?</h2>
      
      {/* OPÇÕES TRADICIONAIS */}
      {opcoes.map((op) => (
        <button
          key={op.id}
          onClick={() => router.push(`/pagamento/${op.id}?id=${pedidoId}`)}
          className="w-full bg-white p-4 rounded-3xl flex items-center justify-between border-2 border-transparent active:border-red-500 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <span className="text-2xl">{op.icon}</span>
            <div className="text-left">
              <p className="font-black text-gray-800 uppercase text-sm">{op.nome}</p>
              <p className="text-[10px] text-gray-400 font-bold">{op.desc}</p>
            </div>
          </div>
          <span className="text-gray-300">❯</span>
        </button>
      ))}

      {/* OPÇÃO MOEDAS (ESPECIAL) */}
      <div className={`mt-6 p-1 rounded-[32px] ${saldoUsuarioMoedas >= totalMoedas ? 'bg-yellow-400' : 'bg-gray-200 opacity-60'}`}>
        <button
          disabled={saldoUsuarioMoedas < totalMoedas}
          onClick={() => router.push(`/pagamento/moedas?id=${pedidoId}`)}
          className="w-full bg-white p-5 rounded-[28px] flex flex-col items-center gap-1"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">🪙</span>
            <span className="font-black uppercase italic">Pagar com Moedas</span>
          </div>
          
          <div className="flex gap-4 mt-2">
            <div className="text-center">
              <p className="text-[9px] uppercase font-black text-gray-400">Custo</p>
              <p className="font-black text-yellow-600">{totalMoedas} 🪙</p>
            </div>
            <div className="border-l border-gray-100 h-8"></div>
            <div className="text-center">
              <p className="text-[9px] uppercase font-black text-gray-400">Seu Saldo</p>
              <p className={`font-black ${saldoUsuarioMoedas >= totalMoedas ? 'text-green-600' : 'text-red-500'}`}>
                {saldoUsuarioMoedas} 🪙
              </p>
            </div>
          </div>

          {saldoUsuarioMoedas < totalMoedas && (
            <p className="text-[8px] font-black text-red-500 uppercase mt-2">Saldo Insuficiente</p>
          )}
        </button>
      </div>
    </div>
  );
}