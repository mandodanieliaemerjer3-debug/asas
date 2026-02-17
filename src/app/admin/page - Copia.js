"use client";
import { useState, useEffect } from "react";
import { db } from "../../lib/firebase"; // Caminho corrigido
import { collection, getDocs, addDoc, setDoc, doc } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext"; // Caminho corrigido

export default function AdminMaster() {
  const { user } = useAuth();
  const [tab, setTab] = useState("bairros");
  const [bairros, setBairros] = useState([]);
  const [restaurantes, setRestaurantes] = useState([]);

  // Estados para Bairros
  const [nomeBairro, setNomeBairro] = useState("");
  const [taxaEntrega, setTaxaEntrega] = useState("");
  const [ganhoEntregador, setGanhoEntregador] = useState("");

  // Estados para Restaurantes
  const [nomeRest, setNomeRest] = useState("");
  const [imgRest, setImgRest] = useState("");
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

  const salvarRestaurante = async () => {
    if (!nomeRest || !imgRest) return alert("Preencha Nome e Foto!");
    const idGerado = "rest_" + Date.now();
    await setDoc(doc(db, "restaurants", idGerado), {
      id: idGerado,
      name: nomeRest,
      image: imgRest,
      category: catRest,
      openTime: abre,
      closeTime: fecha
    });
    alert("🏪 Restaurante cadastrado!");
    setNomeRest(""); setImgRest(""); fetchRestaurantes();
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
      <h1 className="text-2xl font-black mb-6">👑 PAINEL MASTER - {user.displayName}</h1>
      
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        <button onClick={() => setTab("bairros")} className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap ${tab === 'bairros' ? 'bg-black text-white' : 'bg-white'}`}>📍 Bairros e Taxas</button>
        <button onClick={() => setTab("lojas")} className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap ${tab === 'lojas' ? 'bg-black text-white' : 'bg-white'}`}>🏪 Novo Restaurante</button>
        <button onClick={() => setTab("banners")} className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap ${tab === 'banners' ? 'bg-black text-white' : 'bg-white'}`}>🖼️ Banners e Selos</button>
      </div>

      {/* ABA DE RESTAURANTES */}
      {tab === "lojas" && (
        <div className="max-w-2xl space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm space-y-4">
            <h2 className="font-bold">Cadastrar Estabelecimento</h2>
            <input placeholder="Nome da Loja" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={nomeRest} onChange={e => setNomeRest(e.target.value)} />
            <input placeholder="URL da Foto (Logo)" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={imgRest} onChange={e => setImgRest(e.target.value)} />
            <select className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={catRest} onChange={e => setCatRest(e.target.value)}>
               <option value="">Selecione a Categoria</option>
               <option value="Lanches">🍔 Lanches</option>
               <option value="Pizza">🍕 Pizza</option>
               <option value="Japonesa">🍣 Japonesa</option>
               <option value="Sobremesas">🍰 Sobremesas</option>
               <option value="Fitness">🥗 Fitness (Especial)</option>
               <option value="Alta Gastronomia">👨‍🍳 Alta Gastronomia</option>
            </select>
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="text-[10px] font-bold">ABRE ÀS</label>
                 <input type="time" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={abre} onChange={e => setAbre(e.target.value)} />
               </div>
               <div>
                 <label className="text-[10px] font-bold">FECHA ÀS</label>
                 <input type="time" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={fecha} onChange={e => setFecha(e.target.value)} />
               </div>
            </div>
            <button onClick={salvarRestaurante} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold">CADASTRAR LOJA</button>
          </div>
        </div>
      )}

      {/* ABA DE BAIRROS (Continua aqui...) */}
      {tab === "bairros" && (
        <div className="max-w-2xl bg-white p-6 rounded-3xl shadow-sm">
           <h2 className="font-bold mb-4">Lista de Bairros e Ganhos</h2>
           {/* Aqui entra a tabela de bairros que criamos antes */}
           <p className="text-sm text-gray-500 italic">Configure as taxas de entrega para os motoboys e clientes.</p>
        </div>
      )}
    </main>
  );
}