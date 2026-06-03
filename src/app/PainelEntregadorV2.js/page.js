"use client";

import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";

export default function MaestroEntregador() {
  const { user } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const ref = doc(db, "users", user.uid);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const dados = snap.data();
          setPerfil({ uid: user.uid, ...dados });
        } else {
          setPerfil(null);
        }

        setLoading(false);
      },
      (error) => {
        console.error("Erro ao ler perfil:", error);
        setErro("Falha ao carregar perfil");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Verificando perfil...
      </div>
    );
  }

  if (erro) {
    return (
      <div className="p-10 text-center">
        {erro}
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="p-10 text-center">
        Perfil não encontrado.
      </div>
    );
  }

  if (perfil.role !== "entregador") {
    return (
      <div className="p-10 text-center">
        Acesso restrito para entregadores.
      </div>
    );
  }

  return (
    <div className="p-10">
      <h1>Painel do Entregador</h1>

      <pre
        style={{
          background: "#f5f5f5",
          padding: "15px",
          borderRadius: "8px",
          overflow: "auto",
        }}
      >
        {JSON.stringify(perfil, null, 2)}
      </pre>
    </div>
  );
}