"use client";
import { useState } from "react";
import { db } from "../../../lib/firebase"; 
import { doc, getDoc, collection, addDoc, Timestamp } from "firebase/firestore";

export default function AreaFinanceiraDono() {
  const [restauranteId, setRestauranteId] = useState(""); // Código da Loja
  const [senhaDono, setSenhaDono] = useState("");
  const [autorizado, setAutorizado] = useState(false);
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [arquivo, setArquivo] = useState(null);

  // FUNÇÃO PARA BUSCAR LOJA E VALIDAR SENHA
  const validarEEntrar = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Busca o documento da loja pelo ID digitado
      const restRef = doc(db, "restaurants", restauranteId.toLowerCase().trim()); 
      const snap = await getDoc(restRef);

      if (snap.exists()) {
        const infoLoja = snap.data();
        
        // Valida se a senha bate com o código financeiro daquela loja
        if (infoLoja.codigoFinanceiro === senhaDono) {
          // Aqui simulamos o carregamento dos dados financeiros
          // Em um cenário real, você faria um fetch para sua API de fechamento
          setDados({
            nomeLoja: infoLoja.nome,
            totalPagar: 185.50, // Exemplo de soma: Comissão + Fretes
            moedasGastasNoTotal: 400, // Exemplo: 400 moedas = R$ 2,00 de desconto
            comissaoMogu: 25.00,
            fretesBruto: 160.50
          });
          setAutorizado(true);
        } else {
          alert("Senha Financeira Incorreta!");
        }
      } else {
        alert("Loja não encontrada! Verifique o código da unidade.");
      }
    } catch (err) {
      alert("Erro ao conectar com o banco de dados.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // TELA 1: LOGIN POR CÓDIGO (Caso não esteja autorizado)
  if (!autorizado) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-black">
        <form onSubmit={validarEEntrar} className="bg-white p-10 rounded-[50px] w-full max-w-sm text-center shadow-2xl">
          <div className="mb-8">
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Mogu Financeiro</h2>
            <p className="text-[9px] font-bold opacity-30 uppercase">Acesso Administrativo</p>
          </div>

          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="CÓDIGO DA UNIDADE (Ex: loja01)" 
              value={restauranteId}
              onChange={(e) => setRestauranteId(e.target.value)}
              className="w-full bg-zinc-100 p-5 rounded-3xl text-center font-bold text-sm uppercase border-2 border-transparent focus:border-red-500 outline-none transition"
              required
            />
            <input 
              type="password" 
              placeholder="SENHA FINANCEIRA" 
              value={senhaDono}
              onChange={(e) => setSenhaDono(e.target.value)}
              className="w-full bg-zinc-100 p-5 rounded-3xl text-center font-bold text-sm border-2 border-transparent focus:border-red-500 outline-none transition"
              required
            />
            <button 
              disabled={loading}
              className="w-full bg-red-600 text-white py-5 rounded-3xl font-black uppercase italic text-xs shadow-lg active:scale-95 transition disabled:opacity-50"
            >
              {loading ? "VERIFICANDO..." : "ABRIR FECHAMENTO ➔"}
            </button>
          </div>
        </form>
      </main>
    );
  }

  // TELA 2: EXTRATO (Onde aplicamos a regra das moedas)
  const valorDescontoMoedas = (dados.moedasGastasNoTotal || 0) * 0.005;

  return (
    <main className="min-h-screen bg-zinc-50 p-5 flex flex-col items-center font-sans">
      <div className="w-full max-w-sm bg-white p-8 rounded-[45px] shadow-2xl border border-zinc-100">
        <div className="text-center mb-8">
          <h2 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest leading-none">Unidade: {dados.nomeLoja}</h2>
          <h1 className="text-3xl font-black uppercase italic mt-2">Extrato do Dia</h1>
        </div>

        <div className="space-y-4 border-b pb-6 mb-6">
           <div className="flex justify-between text-[10px] font-black uppercase opacity-40 italic">
              <span>Total em Fretes</span>
              <span className="text-black">R$ {dados.fretesBruto.toFixed(2)}</span>
           </div>
           <div className="flex justify-between text-[10px] font-black uppercase opacity-40 italic">
              <span>Comissão Mogu</span>
              <span className="text-black">R$ {dados.comissaoMogu.toFixed(2)}</span>
           </div>
           <div className="flex justify-between text-[10px] font-black uppercase text-blue-600 bg-blue-50 p-3 rounded-2xl border border-blue-100 italic">
              <span>Abatimento Moedas (🪙 {dados.moedasGastasNoTotal})</span>
              <span>- R$ {valorDescontoMoedas.toFixed(2)}</span>
           </div>
        </div>

        <div className="text-center mb-8">
           <p className="text-[8px] font-black uppercase opacity-30 mb-1">Total para Transferência</p>
           <h3 className="text-5xl font-black italic text-green-600 tracking-tighter">
             R$ {(dados.totalPagar - valorDescontoMoedas).toFixed(2)}
           </h3>
        </div>

        {/* Campo de Comprovante */}
        <label className="block w-full border-2 border-dashed border-zinc-200 rounded-[30px] p-6 text-center cursor-pointer mb-6">
           <input type="file" className="hidden" onChange={(e) => setArquivo(e.target.files[0])} />
           <span className="text-[9px] font-black uppercase opacity-40">{arquivo ? "✅ PRONTO" : "ANEXAR COMPROVANTE PIX"}</span>
        </label>

        <button className="w-full bg-zinc-900 text-white py-6 rounded-3xl font-black uppercase italic text-[10px] shadow-xl">
          Finalizar Repasse Diário
        </button>
      </div>
    </main>
  );
}