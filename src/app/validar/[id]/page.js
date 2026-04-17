"use client";
import { db } from "../../../lib/firebase";
import { addDoc, collection } from "firebase/firestore";
import { useAuth } from "../../../contexts/AuthContext";

export default function PaginaValidar({ params }) {
  const { user } = useAuth();
  const { id } = params; // ID do parceiro vindo da URL

  const confirmarPresenca = async () => {
    if (!user) return alert("Faça login para validar sua presença!");

    try {
      await addDoc(collection(db, "validacoes_semanais"), {
        userId: user.uid,
        parceiroId: id,
        data: new Date().toISOString(),
        semana: "semana_01_março" // Você pode automatizar isso por data
      });
      alert("Presença confirmada! Continue no grupo para receber seu bônus.");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center p-8 text-center">
      <div className="text-5xl mb-6">✅</div>
      <h1 className="font-black uppercase italic text-xl">Confirmar Presença</h1>
      <p className="text-xs text-gray-500 mt-2 uppercase font-bold">
        Clique no botão abaixo para provar que você ainda está no grupo!
      </p>
      <button 
        onClick={confirmarPresenca}
        className="mt-8 px-10 py-5 bg-black text-white rounded-[30px] font-black uppercase italic shadow-2xl"
      >
        Marcar Presença
      </button>
    </div>
  );
}