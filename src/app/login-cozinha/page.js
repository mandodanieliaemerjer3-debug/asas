"use client";
import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function LoginCozinha() {
  const [restaurantes, setRestaurantes] = useState([]);
  const [busca, setBusca] = useState("");
  const [restauranteSel, setRestauranteSel] = useState(null);
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const router = useRouter();

  // Busca todos os restaurantes ao carregar
  useEffect(() => {
    const fetchRestaurantes = async () => {
      const querySnapshot = await getDocs(collection(db, "restaurants"));
      const lista = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRestaurantes(lista);
    };
    fetchRestaurantes();
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!restauranteSel) return setErro("Selecione um restaurante");

    if (codigo === restauranteSel.codigoAcesso) {
      sessionStorage.setItem("restauranteId", restauranteSel.id);
      sessionStorage.setItem("nomeRestaurante", restauranteSel.name);
      router.push("/cozinha");
    } else {
      setErro("Código de acesso incorreto!");
    }
  };

  const filtrados = restaurantes.filter(r => 
    r.name.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-zinc-900 p-8 rounded-[40px] border border-white/10">
        <h1 className="text-3xl font-black italic uppercase text-orange-500 mb-6 text-center">Acesso Cozinha</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Seleção de Restaurante */}
          <div className="relative">
            <input 
              type="text"
              placeholder="Buscar restaurante..."
              className="w-full bg-black border border-white/10 p-4 rounded-2xl outline-none focus:border-orange-500"
              value={busca}
              onChange={(e) => { setBusca(e.target.value); setRestauranteSel(null); }}
            />
            {busca && !restauranteSel && (
              <div className="absolute z-10 w-full bg-zinc-800 mt-2 rounded-2xl max-h-48 overflow-y-auto border border-white/10">
                {filtrados.map(r => (
                  <div 
                    key={r.id}
                    onClick={() => { setRestauranteSel(r); setBusca(r.name); }}
                    className="p-4 hover:bg-orange-500 hover:text-black cursor-pointer font-bold uppercase text-sm"
                  >
                    {r.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Input de Senha (codigoAcesso) */}
          <input 
            type="password"
            placeholder="Código de Acesso"
            className="w-full bg-black border border-white/10 p-4 rounded-2xl outline-none focus:border-orange-500 text-center tracking-[1em]"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
          />

          {erro && <p className="text-red-500 text-center text-xs font-bold uppercase">{erro}</p>}

          <button className="w-full bg-orange-500 text-black p-5 rounded-2xl font-black uppercase italic hover:scale-95 transition-transform">
            Entrar no Painel
          </button>
        </form>
      </div>
    </main>
  );
}