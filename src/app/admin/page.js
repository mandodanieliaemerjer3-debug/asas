"use client";
import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, getDocs, addDoc, setDoc, doc, deleteDoc } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";

export default function AdminMaster() {
  const { user } = useAuth();
  const [tab, setTab] = useState("bairros");
  const [bairros, setBairros] = useState([]);
  const [restaurantes, setRestaurantes] = useState([]);

  // Estados para Bairros
  const [nomeBairro, setNomeBairro] = useState("");
  const [taxaEntrega, setTaxaEntrega] = useState("");
  const [ganhoEntregador, setGanhoEntregador] = useState("");
  const [moedasBairro, setMoedasBairro] = useState("");

  // Estados para Restaurantes
  const [nomeRest, setNomeRest] = useState("");
  const [imgRest, setImgRest] = useState("");
  const [emailDono, setEmailDono] = useState("");
  const [catRest, setCatRest] = useState("");
  const [abre, setAbre] = useState("18:00");
  const [fecha, setFecha] = useState("23:59");

  const EMAIL_MASTER = "danieliaemer3@gmail.com";

  useEffect(() => {
    if (user?.email === EMAIL_MASTER) {
      fetchBairros();
      fetchRestaurantes();
    }
  }, [user]);

  const fetchBairros = async () => {
    const bSnap = await getDocs(collection(db, "neighborhoods"));
    setBairros(bSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const fetchRestaurantes = async () => {
    const rSnap = await getDocs(collection(db, "restaurants"));
    setRestaurantes(rSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const salvarBairro = async () => {
    if (!nomeBairro || !taxaEntrega) return alert("Preencha os dados do bairro!");
    await addDoc(collection(db, "neighborhoods"), {
      name: nomeBairro,
      fee: Number(taxaEntrega),
      deliveryProfit: Number(ganhoEntregador),
      bonusCoins: Number(moedasBairro)
    });
    alert("📍 Bairro cadastrado!");
    setNomeBairro(""); setTaxaEntrega(""); setGanhoEntregador(""); setMoedasBairro("");
    fetchBairros();
  };

  const salvarRestaurante = async () => {
    if (!nomeRest || !imgRest) return alert("Preencha Nome e Foto!");
    const idGerado = "rest_" + Date.now();
    await setDoc(doc(db, "restaurants", idGerado), {
      id: idGerado,
      name: nomeRest,
      image: imgRest,
      ownerEmail: emailDono,
      category: catRest,
      openTime: abre,
      closeTime: fecha
    });
    alert("🏪 Restaurante cadastrado!");
    setNomeRest(""); setImgRest(""); setEmailDono(""); fetchRestaurantes();
  };

  const excluirBairro = async (id) => {
    if (confirm("Excluir este bairro?")) {
      await deleteDoc(doc(db, "neighborhoods", id));
      fetchBairros();
    }
  };

  if (!user || user.email !== EMAIL_MASTER) {
    return (
      <div className="p-20 text-center font-bold text-red-600">
        🛑 ACESSO NEGADO: {user?.email || "Deslogado"}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 font-sans">
      <h1 className="text-2xl font-black mb-6 italic">👑 PAINEL MASTER - {user.displayName}</h1>
      
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        <button onClick={() => setTab("bairros")} className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap ${tab === 'bairros' ? 'bg-black text-white shadow-lg' : 'bg-white'}`}>📍 Bairros e Taxas</button>
        <button onClick={() => setTab("lojas")} className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap ${tab === 'lojas' ? 'bg-black text-white shadow-lg' : 'bg-white'}`}>🏪 Novo Restaurante</button>
        <button onClick={() => setTab("banners")} className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap ${tab === 'banners' ? 'bg-black text-white shadow-lg' : 'bg-white'}`}>🖼️ Banners e Selos</button>
      </div>

      {/* ABA DE BAIRROS E TAXAS */}
      {tab === "bairros" && (
        <div className="max-w-2xl space-y-6 animate-slide-up">
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 space-y-4">
            <h2 className="font-bold text-gray-800 italic">Cadastrar Região de Entrega</h2>
            <input placeholder="Nome do Bairro" className="w-full p-4 bg-gray-50 rounded-2xl outline-none" value={nomeBairro} onChange={e => setNomeBairro(e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
               <input type="number" placeholder="Taxa Cliente (R$)" className="w-full p-4 bg-gray-50 rounded-2xl outline-none" value={taxaEntrega} onChange={e => setTaxaEntrega(e.target.value)} />
               <input type="number" placeholder="Ganho Motoboy (R$)" className="w-full p-4 bg-gray-50 rounded-2xl outline-none" value={ganhoEntregador} onChange={e => setGanhoEntregador(e.target.value)} />
            </div>
            <input type="number" placeholder="Moedas Bônus por pedido" className="w-full p-4 bg-gray-50 rounded-2xl outline-none" value={moedasBairro} onChange={e => setMoedasBairro(e.target.value)} />
            <button onClick={salvarBairro} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-red-100">CADASTRAR BAIRRO ✅</button>
          </div>

          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
            <h2 className="font-bold mb-4">Bairros Ativos</h2>
            <div className="space-y-3">
              {bairros.map(b => (
                <div key={b.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                  <div>
                    <p className="font-bold">{b.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold">TAXA: R$ {b.fee} | MOTOBOY: R$ {b.deliveryProfit} | 🪙 {b.bonusCoins}</p>
                  </div>
                  <button onClick={() => excluirBairro(b.id)} className="text-red-500 font-bold text-xs bg-red-50 p-2 rounded-lg">Excluir</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ABA DE RESTAURANTES */}
      {tab === "lojas" && (
        <div className="max-w-2xl space-y-6 animate-slide-up">
          <div className="bg-white p-6 rounded-[32px] shadow-sm space-y-4">
            <h2 className="font-bold italic">Cadastrar Novo Restaurante</h2>
            <input placeholder="Nome da Loja" className="w-full p-4 bg-gray-50 rounded-2xl outline-none" value={nomeRest} onChange={e => setNomeRest(e.target.value)} />
            <input placeholder="Link da Imagem/Logo" className="w-full p-4 bg-gray-50 rounded-2xl outline-none" value={imgRest} onChange={e => setImgRest(e.target.value)} />
            <input placeholder="E-mail do Dono (Login Google)" className="w-full p-4 bg-gray-50 rounded-2xl outline-none border-2 border-blue-50" value={emailDono} onChange={e => setEmailDono(e.target.value)} />
            
            <select className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" value={catRest} onChange={e => setCatRest(e.target.value)}>
               <option value="">Selecione a Categoria</option>
               <option value="Lanches">🍔 Lanches</option>
               <option value="Pizza">🍕 Pizza</option>
               <option value="Sobremesas">🍰 Sobremesas</option>
               <option value="Fitness">🥗 Fitness (Especial)</option>
               <option value="Alta Gastronomia">👨‍🍳 Alta Gastronomia</option>
            </select>

            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="text-[10px] font-black ml-2 uppercase">Abre às</label>
                 <input type="time" className="w-full p-4 bg-gray-50 rounded-2xl outline-none" value={abre} onChange={e => setAbre(e.target.value)} />
               </div>
               <div>
                 <label className="text-[10px] font-black ml-2 uppercase">Fecha às</label>
                 <input type="time" className="w-full p-4 bg-gray-50 rounded-2xl outline-none" value={fecha} onChange={e => setFecha(e.target.value)} />
               </div>
            </div>
            <button onClick={salvarRestaurante} className="w-full bg-green-600 text-white py-4 rounded-2xl font-black shadow-lg">CADASTRAR LOJA 🏪</button>
          </div>
        </div>
      )}
    </main>
  );
}