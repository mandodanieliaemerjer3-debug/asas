"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../../lib/firebase";

export default function VerificandoPagamento() {
  const { id } = useParams();
  const router = useRouter();

  useEffect(() => {
    if (!id) return;

    const ref = doc(db, "orders", id);

    const unsubscribe = onSnapshot(ref, (docSnap) => {
      if (!docSnap.exists()) return;

      const data = docSnap.data();

      if (data.pago === true || data.status === "Pago") {
        router.push(`/agradecimento/${id}`);
      }

      if (data.status === "Rejeitado") {
        router.push(`/pagamento-erro/${id}`);
      }
    });

    return () => unsubscribe();
  }, [id]);

  return (
    <div className="min-h-screen flex items-center justify-center text-center p-10">
      <div>
        <h1 className="text-2xl font-black mb-4">Processando pagamento...</h1>
        <p className="text-gray-500">Aguarde alguns segundos</p>
      </div>
    </div>
  );
}