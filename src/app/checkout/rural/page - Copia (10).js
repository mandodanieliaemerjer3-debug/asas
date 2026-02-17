"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../lib/firebase";
import { 
  collection, addDoc, getDocs, doc, 
  updateDoc, getDoc, deleteDoc 
} from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";

export default function CheckoutPage() {
  const { user } = useAuth();
  const router = useRouter();

  // ESTADOS
  const [cart, setCart] = useState([]);
  const [bairrosDisponiveis, setBairrosDisponiveis] = useState([]);
  const [bairroSelecionado, setBairroSelecionado] = useState(null);
  const [nomeCliente, setNomeCliente] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [pagamento, setPagamento] = useState("Pix");
  const [loading, setLoading] = useState(true);

  // =========================================================
  // 1. BUSCA DADOS DO FIREBASE
  // =========================================================
  useEffect(() => {
    const savedCart = localStorage.getItem("carrinho");
    if (savedCart) setCart(JSON.parse(savedCart));

    if (user?.displayName) setNomeCliente(user.displayName);

    const fetchData = async () => {
      try {
        const bSnap = await getDocs(collection(db, "neighborhoods"));
        const bList = bSnap.docs.map(d => ({ 
          id: d.id, 
          nome: d.data().name, 
          taxa: d.data().fee,
          level: d.data().level || "Asfalto Zero",
          linha: d.data().linha || 0
        })).sort((a,b) => a.nome.localeCompare(b.nome));
        
        setBairrosDisponiveis(bList);
        if (bList.length > 0) setBairroSelecionado(bList[0]);
      } catch (e) {
        console.error("Erro ao carregar bairros:", e);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // =========================================================
  // 2. FUNÇÃO DE CORREÇÃO (LIMPA E CADASTRA NÍVEIS CERTOS)
  // =========================================================
  const corrigirBancoDeDados = async () => {
    const listaCorreta = [
      { name: "Centro", fee: 6, level: "Asfalto Zero", linha: 0 },
      { name: "Jardim Silos", fee: 8, level: "Asfalto Zero", linha: 1 },
      { name: "Limoeiro", fee: 10, level: "Desbravador", linha: 1 },
      { name: "Vila Rural", fee: 15, level: "Desbravador", linha: 2 },
      { name: "Sítio Alto", fee: 25, level: "Off-Road Root", linha: 3 },
      { name: "Morro do Sabão", fee: 30, level: "Off-Road Root", linha: 3 },
      { name: "Fazenda Velha", fee: 35, level: "Off-Road Root", linha: 4 }
    ];

    try {
      const confirmacao = window.confirm("Deseja apagar os bairros antigos e instalar os níveis Off-Road e Desbravador?");
      if (!confirmacao) return;

      setLoading(true);

      // Limpa os bairros que aparecem na sua foto (Asfalto Zero)
      const snap = await getDocs(collection(db, "neighborhoods"));
      for (const d of snap.docs) {
        await deleteDoc(doc(db, "neighborhoods", d.id));
      }

      // Adiciona os novos com as categorias corretas
      for (const bairro of listaCorreta) {
        await addDoc(collection(db, "neighborhoods"), bairro);
      }

      alert("✅ SUCESSO! Banco atualizado com Off-Road e Desbravador.");
      window.location.reload();
    } catch (e) {
      alert("ERRO NO FIREBASE: " + e.message);
      setLoading(false);
    }
  };

  // =========================================================
  // 3. ENVIO DO PEDIDO
  // =========================================================
  const finalizarCompra = async () => {
    if (!nomeCliente || !rua || !numero) return alert("Preencha o endereço!");

    try {
      setLoading(true);
      await addDoc(collection(db, "orders"), {
        cliente: { nome: nomeCliente, uid: user?.uid || "anonimo" },
        endereco: { 
          bairro: bairroSelecionado?.nome, 
          rua, 
          numero,
          nivelTerreno: bairroSelecionado?.level,
          linhaId: bairroSelecionado?.linha 
        },
        itens: cart,
        valores: { 
          subtotal: cart.reduce((acc, i) => acc + i.price, 0),
          taxaEntrega: bairroSelecionado?.taxa, 
          total: cart.reduce((acc, i) => acc + i.price, 0) + bairroSelecionado?.taxa 
        },
        status: "Em Produção",
        data: new Date()
      });

      alert("🚀 Pedido enviado com sucesso!");
      localStorage.removeItem("carrinho");
      router.push("/");
    } catch (e) {
      alert("Erro ao enviar: " + e.message);
      setLoading(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse">ATUALIZANDO...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-32 max-w-md mx-auto font-sans border-x border-gray-100 relative">
      <header className="mb-6 flex items-center gap-2">
        <button onClick={() => router.back()} className="text-gray-400 text-xl font-black">←</button>
        <h1 className="text-xl font-black italic uppercase tracking-tighter text-gray-800">Finalizar Pedido</h1>
      </header>

      <div className="space-y-4">
        {/* SELETOR DE BAIRRO COM HIERARQUIA */}
        <div className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-100">
          <p className="text-[10px] font-black text-gray-400 uppercase mb-2 italic">Selecione o Local de Entrega</p>
          <select 
            className="w-full bg-gray-50 p-4 rounded-2xl outline-none font-black text-sm uppercase italic"
            onChange={(e) => setBairroSelecionado(bairrosDisponiveis.find(b => b.nome === e.target.value))}
            value={bairroSelecionado?.nome || ""}
          >
            {bairrosDisponiveis.map(b => (
              <option key={b.id} value={b.nome}>
                📍 {b.nome} ({b.level})
              </option>
            ))}
          </select>
        </div>

        {/* INPUTS DE ENDEREÇO */}
        <div className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-100 space-y-3">
          <input placeholder="Seu Nome" className="w-full bg-gray-50 p-4 rounded-2xl outline-none font-bold text-sm" value={nomeCliente} onChange={e => setNomeCliente(e.target.value)} />
          <div className="flex gap-2">
            <input placeholder="Rua" className="flex-1 bg-gray-50 p-4 rounded-2xl outline-none font-bold text-sm" value={rua} onChange={e => setRua(e.target.value)} />
            <input placeholder="Nº" className="w-20 bg-gray-50 p-4 rounded-2xl outline-none font-bold text-sm text-center" value={numero} onChange={e => setNumero(e.target.value)} />
          </div>
        </div>

        {/* BOTÃO DE COMPRA */}
        <button 
          onClick={finalizarCompra} 
          className="w-full bg-red-600 text-white py-6 rounded-[30px] font-black text-xl shadow-xl active:scale-95 uppercase italic tracking-widest"
        >
          Confirmar Compra 🚀
        </button>

        {/* BOTÃO DE CORREÇÃO DO BANCO */}
        <div className="mt-20 p-6 bg-yellow-50 rounded-[35px] border-2 border-dashed border-yellow-300 text-center">
          <p className="text-[9px] font-black text-yellow-600 uppercase mb-4 tracking-widest">Painel de Configuração</p>
          <button 
            onClick={corrigirBancoDeDados}
            className="w-full bg-yellow-500 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg active:scale-95 transition"
          >
            🚀 Corrigir Bairros e Níveis
          </button>
          <p className="text-[8px] text-yellow-400 font-bold mt-2 uppercase">Clique uma vez para habilitar Off-Road</p>
        </div>
      </div>
    </div>
  );
}