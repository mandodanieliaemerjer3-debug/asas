"use client";
import { useState } from "react";
import { db } from "../../../lib/firebase"; 
import { doc, getDoc, collection, addDoc, Timestamp } from "firebase/firestore";

export default function AreaFinanceiraDono() {
  const [senhaDono, setSenhaDono] = useState("");
  const [autorizado, setAutorizado] = useState(false);
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [arquivo, setArquivo] = useState(null);

  const validarEEntrar = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const restRef = doc(db, "restaurants", "rest_1"); 
      const snap = await getDoc(restRef);
      if (snap.exists() && snap.data().codigoFinanceiro === senhaDono) {
        const res = await fetch("/api/fechamento", {
          method: "POST",
          body: JSON.stringify({ restauranteId: "rest_1" }),
          headers: { "Content-Type": "application/json" }
        });
        const resultado = await res.json();
        if (res.ok) { setDados(resultado); setAutorizado(true); }
      } else { alert("Senha Incorreta!"); }
    } catch (err) { alert("Erro de conexão"); }
    finally { setLoading(false); }
  };

  const registrarPagamento = async () => {
    if (!dados || dados.totalPagar <= 0) return;
    if (!arquivo) { alert("Por favor, anexe a foto do comprovante antes de enviar."); return; }
    
    setEnviando(true);
    try {
      // 🚀 Registro do Fechamento (O campo comprovanteUrl fica como 'Pendente de Storage')
      await addDoc(collection(db, "fechamentos_pendentes"), {
        restauranteId: "rest_1",
        valorPago: dados.totalPagar,
        dataEnvio: Timestamp.now(),
        status: "Em Análise",
        pedidosIds: dados.pedidosRelacionados.map(p => p.id),
        nomeArquivoOriginal: arquivo.name, // Guarda o nome do arquivo enviado
        comprovanteUrl: "upload_local_pendente" 
      });

      alert("🚀 Comprovante enviado com sucesso! O ADM irá validar o pagamento.");
      setAutorizado(false);
      setArquivo(null);
    } catch (e) {
      alert("Erro ao enviar: " + e.message);
    } finally { setEnviando(false); }
  };

  if (autorizado && dados) {
    return (
      <main className="min-h-screen bg-zinc-50 p-6 flex flex-col items-center">
        <div className="w-full max-w-sm bg-white p-8 rounded-[45px] shadow-2xl mt-10 text-black">
          <h1 className="text-xl font-black uppercase italic mb-8 text-center tracking-tighter">FECHAMENTO</h1>
          
          <div className="text-center mb-8">
            <p className="text-[8px] font-black uppercase opacity-30 mb-1">Total para quitação</p>
            <h2 className="text-5xl font-black italic text-red-600 tracking-tighter">
              R$ {dados.totalPagar.toFixed(2)}
            </h2>
          </div>

          {/* 📤 CAMPO DE UPLOAD DE COMPROVANTE */}
          <div className="mb-6">
            <label className="block w-full border-4 border-dashed border-zinc-100 rounded-[35px] p-6 text-center cursor-pointer hover:bg-zinc-50 transition relative overflow-hidden">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => setArquivo(e.target.files[0])}
              />
              {arquivo ? (
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black text-emerald-600 uppercase">✅ Arquivo Selecionado</span>
                    <span className="text-[8px] font-bold opacity-40 truncate max-w-[200px]">{arquivo.name}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                    <span className="text-2xl mb-2">📸</span>
                    <span className="text-[9px] font-black uppercase opacity-40">Anexar Comprovante PIX</span>
                </div>
              )}
            </label>
          </div>

          <div className="bg-zinc-100 p-6 rounded-[35px] mb-6 text-center">
            <p className="text-[10px] font-bold uppercase mb-2 opacity-30">Chave PIX para Depósito</p>
            <p className="text-xs font-black select-all tracking-tight">000.000.000-00</p>
          </div>

          <button 
            onClick={registrarPagamento}
            disabled={enviando}
            className={`w-full py-6 rounded-3xl font-black uppercase italic text-sm shadow-lg transition ${arquivo ? 'bg-emerald-600 text-white' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'}`}
          >
            {enviando ? "ENVIANDO..." : "CONFIRMAR PAGAMENTO ➔"}
          </button>
        </div>

        <div className="w-full max-w-sm mt-10 space-y-3 pb-20">
            <h3 className="text-[10px] font-black uppercase opacity-30 ml-6 italic">Detalhamento da Dívida</h3>
            {dados.pedidosRelacionados.map((p, idx) => (
                <div key={idx} className="bg-white p-5 rounded-[30px] flex justify-between items-center shadow-sm border border-zinc-100 text-black">
                    <p className="text-[10px] font-black uppercase">{p.clienteNome}</p>
                    <p className="text-xs font-black italic">R$ {p.totalPedido.toFixed(2)}</p>
                </div>
            ))}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-black">
      <form onSubmit={validarEEntrar} className="bg-white p-12 rounded-[50px] w-full max-w-sm text-center shadow-2xl">
        <h2 className="text-2xl font-black uppercase italic mb-8 tracking-tighter">Financeiro</h2>
        <input 
          type="password" placeholder="SENHA" value={senhaDono}
          onChange={(e) => setSenhaDono(e.target.value)}
          className="w-full bg-zinc-100 p-6 rounded-[30px] text-center text-3xl font-black outline-none mb-6 border-4 border-transparent focus:border-red-600 transition"
        />
        <button className="w-full bg-red-600 text-white py-6 rounded-[30px] font-black uppercase italic">Abrir Caixa</button>
      </form>
    </main>
  );
}