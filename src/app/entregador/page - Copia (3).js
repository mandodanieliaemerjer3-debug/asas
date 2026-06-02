"use client";

import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";

import PainelUrbana from "./components/PainelUrbana";
import PainelOffRoad from "./components/PainelOffRoad";

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
      <div className="min-h-screen flex items-center justify-center bg-white font-black italic animate-pulse">
        VERIFICANDO CREDENCIAIS ELITE...
      </div>
    );
  }

  if (erro) {
    return (
      <div className="p-20 text-center font-black uppercase text-red-600">
        ERRO AO CARREGAR PERFIL
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="p-20 text-center font-black uppercase text-red-600">
        PERFIL NÃO ENCONTRADO
      </div>
    );
  }

  // 1. VERIFICAÇÃO POR NIVEL DE ATUAÇÃO
  if (perfil.nivelAtuacao !== "entregador") {
    return (
      <div className="p-20 text-center font-black uppercase text-red-600">
        ACESSO RESTRITO: APENAS ENTREGADORES
      </div>
    );
  }

  // 2. DIRECIONAMENTO POR RANK
  if (perfil.rank === "Off-Road Root") {
    return <PainelOffRoad perfil={perfil} />;
  }

  // 3. PADRÃO
  return <PainelUrbana perfil={perfil} />;
}