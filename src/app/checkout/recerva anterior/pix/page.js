"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { db } from "../../../lib/firebase";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

import { useAuth } from "../../../contexts/AuthContext";

export default function PixPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderId = searchParams.get("orderId");

  const [loading, setLoading] = useState(false);

  const handleEnviarComprovante = async (e) => {
    const file = e.target.files[0];
    if (!file || !user || !orderId) return;

    setLoading(true);

    const reader = new FileReader();

    reader.onloadend = async () => {
      try {
        const storage = getStorage();

        const filePath = `comprovantes/${orderId}.jpg`;

        const storageRef = ref(storage, filePath);

        await uploadString(storageRef, reader.result, "data_url");

        const urlComprovante = await getDownloadURL(storageRef);

        const pedidoRef = doc(db, "orders", orderId);

        await updateDoc(pedidoRef, {
          comprovantePixUrl: urlComprovante,
          status: "em_analise",
          dataEnvioComprovante: serverTimestamp()
        });

        router.push(`/checkout/inspecao-pix?orderId=${orderId}`);

      } catch (err) {
        console.error("Erro ao enviar comprovante:", err);
        alert("Erro ao enviar comprovante.");
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <main className="min-h-screen max-w-md mx-auto p-6 flex flex-col gap-6">
      <h1 className="text-xl font-black uppercase italic">
        Enviar comprovante PIX
      </h1>

      {!orderId && (
        <p className="text-red-600 font-bold text-sm">
          Pedido não encontrado.
        </p>
      )}

      <input
        type="file"
        accept="image/*"
        onChange={handleEnviarComprovante}
        disabled={loading || !orderId}
      />

      {loading && (
        <p className="text-sm font-bold text-zinc-400">
          Enviando comprovante...
        </p>
      )}
    </main>
  );
}