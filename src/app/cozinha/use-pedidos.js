// src/app/cozinha/use-pedidos.js
import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";

export function usePedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [restaurante, setRestaurante] = useState({ id: "", nome: "" });
  const router = useRouter();

  useEffect(() => {
    const idSessao = sessionStorage.getItem("restauranteId");
    const nomeSessao = sessionStorage.getItem("nomeRestaurante");
    if (!idSessao) { router.push("/login-cozinha"); return; }

    setRestaurante({ id: idSessao, nome: nomeSessao });

    const q = query(
      collection(db, "orders"),
      where("restaurantId", "==", idSessao),
      where("status", "in", ["Pendente", "Preparando", "Aguardando Entregador"])
    );

    return onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPedidos(lista.sort((a, b) => (a.confirmadoEm?.seconds || 0) - (b.confirmadoEm?.seconds || 0)));
    });
  }, [router]);

  return { pedidos, restaurante };
}