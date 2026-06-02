"use client";
import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function PainelCozinha() {
  const [pedidos, setPedidos] = useState([]);
  const [nomeRestaurante, setNomeRestaurante] = useState("");
  const router = useRouter();

  useEffect(() => {
    // 1. Verifica se há um restaurante logado na sessão
    const idSessao = sessionStorage.getItem("restauranteId");
    const nomeSessao = sessionStorage.getItem("nomeRestaurante");

    if (!idSessao) {
      router.push("/login-cozinha");
      return;
    }

    setNomeRestaurante(nomeSessao);

    // 2. Escuta em tempo real os pedidos DESTE restaurante
    // Filtramos apenas status que interessam à cozinha
    const q = query(
      collection(db, "orders"),
      where("restaurantId", "==", idSessao),
      where("status", "in", ["Pendente", "Preparando", "Aguardando Entregador"])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Ordena manualmente pelos mais antigos primeiro (Fila da Cozinha)
      const ordenados = lista.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
      setPedidos(ordenados);
    }, (error) => {
      console.error("Erro nas regras de segurança:", error);
    });

    return () => unsubscribe();
  }, [router]);

  // Função para mudar o status ao tocar no card
  const mudarStatus = async (pedido) => {
    let proximoStatus = "";
    
    if (pedido.status === "Pendente") proximoStatus = "Preparando";
    else if (pedido.status === "Preparando") proximoStatus = "Aguardando Entregador";
    else return; // Já está pronto

    try {
      await updateDoc(doc(db, "orders", pedido.id), {
        status: proximoStatus
      });
    } catch (err) {
      alert("Erro ao atualizar status. Verifique as permissões do Firebase.");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-6 font-sans">
      <header className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-orange-500">
            {nomeRestaurante || "Cozinha"}
          </h1>
          <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Painel de Produção Real-Time</p>
        </div>
        <div className="bg-zinc-900 px-6 py-3 rounded-full border border-white/5">
          <span className="text-xl font-black">{pedidos.length}</span>
          <span className="ml-2 text-[10px] font-bold opacity-50 uppercase">Pedidos na fila</span>
        </div>
      </header>

      {/* Grid otimizado para TV e Tablet */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {pedidos.map((pedido) => (
          <div 
            key={pedido.id}
            onClick={() => mudarStatus(pedido)}
            className={`p-6 rounded-[45px] border-2 transition-all active:scale-95 cursor-pointer flex flex-col justify-between min-h-[350px] ${
              pedido.status === "Pendente" ? "bg-zinc-900 border-white/10" : 
              pedido.status === "Preparando" ? "bg-orange-500/10 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.2)]" : 
              "bg-blue-500/10 border-blue-500"
            }`}
          >
            <div>
              <div className="flex justify-between items-start mb-6">
                <span className="text-3xl font-black italic">#{pedido.id.slice(-4).toUpperCase()}</span>
                <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${
                  pedido.status === "Pendente" ? "bg-white/10 text-white" : "bg-white text-black"
                }`}>
                  {pedido.status}
                </span>
              </div>

              <div className="space-y-4">
                {pedido.items?.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="bg-orange-500 text-black w-7 h-7 flex items-center justify-center rounded-xl font-black text-xs">
                      {item.quantity}
                    </span>
                    <span className="font-bold text-lg leading-tight uppercase italic">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5">
              <p className="text-[10px] font-black opacity-30 uppercase text-center">
                {pedido.status === "Pendente" ? "Toque para Iniciar" : "Finalizar e Chamar Motoboy"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {pedidos.length === 0 && (
        <div className="flex flex-col items-center justify-center h-[60vh] opacity-20">
          <div className="text-6xl mb-4">🍳</div>
          <p className="font-black italic uppercase">Cozinha em espera...</p>
        </div>
      )}
    </main>
  );
}