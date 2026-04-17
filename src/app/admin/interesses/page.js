"use client";

import { useEffect, useState } from "react";
// Corrigido: subindo 3 níveis para sair de app/admin/interesses e chegar na raiz da src
import { db } from "../../../lib/firebase"; 
import {
  collection,
  getDocs,
  doc,
  updateDoc
} from "firebase/firestore";

export default function GerenciarInteresses() {
  const [users, setUsers] = useState([]);
  const [novaTag, setNovaTag] = useState("");

  useEffect(() => {
    const buscar = async () => {
      const snap = await getDocs(collection(db, "users"));
      const lista = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(lista);
    };

    buscar();
  }, []);

  // ➕ adicionar interesse
  const addInteresse = async (userId, interesses = []) => {
    if (!novaTag) return;

    const novaLista = [...new Set([...interesses, novaTag.toLowerCase()])];

    await updateDoc(doc(db, "users", userId), {
      interesses: novaLista
    });

    atualizarLocal(userId, novaLista);
    setNovaTag("");
  };

  // ❌ remover interesse
  const removerInteresse = async (userId, interesses, tag) => {
    const novaLista = interesses.filter(t => t !== tag);

    await updateDoc(doc(db, "users", userId), {
      interesses: novaLista
    });

    atualizarLocal(userId, novaLista);
  };

  // 🔄 atualiza na tela sem recarregar
  const atualizarLocal = (userId, novaLista) => {
    setUsers(prev =>
      prev.map(u =>
        u.id === userId ? { ...u, interesses: novaLista } : u
      )
    );
  };

  return (
    <div className="p-6 text-white bg-zinc-900 min-h-screen">
      <h1 className="text-xl font-bold mb-4">Interesses dos Usuários</h1>

      <input
        value={novaTag}
        onChange={e => setNovaTag(e.target.value)}
        placeholder="Nova tag (ex: cocacola)"
        className="p-2 mb-4 w-full bg-zinc-800 rounded"
      />

      {users.map(user => (
        <div key={user.id} className="bg-zinc-800 p-4 rounded mb-3">
          <p className="font-bold">{user.nome}</p>

          <div className="flex flex-wrap gap-2 mt-2">
            {(user.interesses || []).map(tag => (
              <span
                key={tag}
                onClick={() =>
                  removerInteresse(user.id, user.interesses, tag)
                }
                className="bg-green-600 px-2 py-1 rounded text-xs cursor-pointer"
              >
                #{tag} ✕
              </span>
            ))}
          </div>

          <button
            onClick={() => addInteresse(user.id, user.interesses)}
            className="mt-2 bg-blue-500 px-3 py-1 rounded text-sm"
          >
            Adicionar interesse
          </button>
        </div>
      ))}
    </div>
  );
}