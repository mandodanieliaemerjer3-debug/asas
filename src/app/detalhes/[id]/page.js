"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, storage } from "../../../lib/firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";

import { useAuth } from "../../../contexts/AuthContext";
import soundManager from "../../../lib/sounds";

// 🧩 COMPONENTES NOVOS
import UploadImagem from "./components/UploadImagem";
import Comentarios from "./components/Comentarios";

export default function DetalhesProduto() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [produto, setProduto] = useState(null);
  const [loading, setLoading] = useState(true);

  const [comentarios, setComentarios] = useState([]);
  const [novoComentario, setNovoComentario] = useState("");
  const [imagem, setImagem] = useState(null);

  // 🔄 BUSCAR PRODUTO
  useEffect(() => {
    async function fetchProduto() {
      const refDoc = doc(db, "products", id);
      const snap = await getDoc(refDoc);

      if (snap.exists()) {
        setProduto({ id: snap.id, ...snap.data() });
      }

      setLoading(false);
    }

    fetchProduto();
  }, [id]);

  // 💬 LISTENER COMENTÁRIOS
  useEffect(() => {
    const q = query(
      collection(db, "products", id, "comentarios"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const lista = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setComentarios(lista);
    });

    return () => unsub();
  }, [id]);

  // 📝 ENVIAR COMENTÁRIO
  const enviarComentario = async () => {
    if (!novoComentario.trim() && !imagem) return;

    if (!user) {
      alert("Faça login para comentar");
      return;
    }

    let imageUrl = null;

    // 📸 upload imagem (já comprimida pelo componente)
    if (imagem) {
      const nomeArquivo = `${user.uid}_${Date.now()}`;

      const storageRef = ref(
        storage,
        `comentarios/${id}/${nomeArquivo}`
      );

      await uploadBytes(storageRef, imagem);
      imageUrl = await getDownloadURL(storageRef);
    }

    await addDoc(collection(db, "products", id, "comentarios"), {
      texto: novoComentario,
      userName: user.displayName || "Usuário",
      userId: user.uid,
      createdAt: serverTimestamp(),
      likes: 0,
      imageUrl: imageUrl
    });

    soundManager.play("success");

    setNovoComentario("");
    setImagem(null);
  };

  // 🛒 ADICIONAR AO CARRINHO
  const adicionarCarrinho = () => {
    let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

    carrinho.push(produto);

    localStorage.setItem("carrinho", JSON.stringify(carrinho));

    soundManager.play("add");
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center font-black">
        Carregando...
      </div>
    );
  }

  if (!produto) {
    return <div>Produto não encontrado</div>;
  }

  return (
    <main className="min-h-screen bg-white pb-40 max-w-md mx-auto">

      {/* HEADER */}
      <div className="p-4 flex items-center gap-4">
        <button
          onClick={() => {
            soundManager.play("click");
            router.back();
          }}
          className="text-2xl"
        >
          ←
        </button>

        <h1 className="font-black">Detalhes</h1>
      </div>

      {/* IMAGEM */}
      <img
        src={produto.image}
        className="w-full h-72 object-cover"
      />

      {/* INFO */}
      <div className="p-4">

        <h2 className="text-2xl font-black">
          {produto.name}
        </h2>

        <p className="text-gray-500 mt-2">
          {produto.description}
        </p>

        <p className="text-2xl font-black text-green-600 mt-4">
          R$ {produto.price.toFixed(2)}
        </p>

        <button
          onClick={adicionarCarrinho}
          className="w-full mt-6 bg-red-600 text-white py-4 rounded-2xl font-black"
        >
          Adicionar ao carrinho
        </button>

      </div>

      {/* 💬 COMENTÁRIOS (COMPONENTE) */}
      <Comentarios
        comentarios={comentarios}
        novoComentario={novoComentario}
        setNovoComentario={setNovoComentario}
        enviarComentario={enviarComentario}
        UploadComponent={UploadImagem}
        setImagem={setImagem}
      />

    </main>
  );
}