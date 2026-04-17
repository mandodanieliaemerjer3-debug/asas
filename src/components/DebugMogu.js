"use client";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function DebugMogu({ pedidoId, valorTotal }) {
  const { user } = useAuth();
  const [relatorio, setRelatorio] = useState(null);

  const scanApp = async () => {
    const report = {
      timestamp: new Date().toISOString(),
      url_atual: window.location.href,
      contexto_usuario: {
        logado: !!user,
        uid: user?.uid || "Nulo",
        tem_cpf: !!user?.cpf,
        is_admin: user?.isAdmin || false,
      },
      contexto_pedido: {
        id_na_url: pedidoId,
        valor_carregado: valorTotal,
        tipo_valor: typeof valorTotal,
      },
      verificacao_env: {
        public_key_presente: !!process.env.NEXT_PUBLIC_MP_PUBLIC_KEY,
        public_key_correta: process.env.NEXT_PUBLIC_MP_PUBLIC_KEY?.startsWith("TEST-"),
      },
      erros_console: "Verificar F12 (Console)",
    };

    setRelatorio(JSON.stringify(report, null, 2));
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      <button 
        onClick={scanApp}
        className="bg-red-600 text-white p-3 rounded-full font-black text-xs shadow-2xl border-2 border-white animate-bounce"
      >
        MOGU DEBUG 🛠️
      </button>

      {relatorio && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl w-full max-w-lg">
            <h2 className="font-black uppercase mb-4">Relatório de Erro</h2>
            <textarea 
              readOnly 
              value={relatorio}
              className="w-full h-64 p-4 bg-gray-100 font-mono text-[10px] rounded-xl mb-4"
            />
            <button 
              onClick={() => {
                navigator.clipboard.writeText(relatorio);
                alert("Copiado! Agora cole no chat.");
                setRelatorio(null);
              }}
              className="w-full bg-green-500 text-white p-4 rounded-2xl font-black uppercase"
            >
              Copiar Relatório para o Gemini
            </button>
            <button 
              onClick={() => setRelatorio(null)}
              className="w-full mt-2 text-gray-400 font-bold uppercase text-xs"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}