"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TermosPage() {
  const router = useRouter();
  const [aceito, setAceito] = useState(false);

  const handleAceitar = () => {
    if (!aceito) return alert("Você precisa aceitar os termos para continuar.");

    // salva aceite no navegador (pode depois salvar no backend)
    localStorage.setItem("mogu_termos_aceito", "true");

    // redireciona usuário
    router.push("/");
  };

  const secoes = [
    {
      titulo: "1. Coleta de Dados",
      conteudo:
        "Coletamos apenas dados essenciais: CPF (fins fiscais e pagamento), endereço (entrega), e informações como sexo e profissão para estatísticas. Seguimos o princípio da minimização de dados conforme a LGPD.",
    },
    {
      titulo: "2. Uso das Informações",
      conteudo:
        "Seus dados são utilizados para processar pedidos, realizar entregas, cumprir obrigações legais e melhorar sua experiência dentro do app.",
    },
    {
      titulo: "3. Personalização e Anúncios",
      conteudo:
        "Utilizamos dados como localização aproximada, preferências, sexo e profissão para recomendar produtos, restaurantes próximos e exibir anúncios internos mais relevantes. Não vendemos seus dados a terceiros.",
    },
    {
      titulo: "4. Geolocalização",
      conteudo:
        "Seu endereço é usado para entrega e pode ser utilizado para recomendações locais. Ele é compartilhado com o entregador apenas durante a rota.",
    },
    {
      titulo: "5. Pagamentos",
      conteudo:
        "Os pagamentos são processados via Mercado Pago. Não armazenamos dados de cartão. O CPF pode ser utilizado para validação e emissão de comprovantes.",
    },
    {
      titulo: "6. Compartilhamento",
      conteudo:
        "Seus dados podem ser compartilhados apenas quando necessário para operação (como entregadores) ou por obrigação legal.",
    },
    {
      titulo: "7. Direitos do Usuário",
      conteudo:
        "Você pode acessar, corrigir ou excluir seus dados a qualquer momento pelo app. Também pode revogar seu consentimento.",
    },
    {
      titulo: "8. Segurança",
      conteudo:
        "Adotamos medidas técnicas para proteger seus dados, incluindo separação de informações e controle de acesso.",
    },
  ];

  return (
    <div className="min-h-screen bg-white p-6 pb-24">
      <div className="max-w-md mx-auto">
        {/* VOLTAR */}
        <button
          onClick={() => router.back()}
          className="mb-6 text-gray-400 text-sm"
        >
          ← Voltar
        </button>

        {/* HEADER */}
        <h1 className="text-3xl font-black mb-2">
          Política de Privacidade
        </h1>
        <p className="text-xs text-gray-400 mb-6">
          Mogu Mogu • LGPD • 2026
        </p>

        {/* TEXTO */}
        <div className="space-y-4">
          {secoes.map((item, index) => (
            <details key={index} className="border-b pb-3">
              <summary className="font-bold cursor-pointer">
                {item.titulo}
              </summary>
              <p className="text-sm text-gray-600 mt-2">
                {item.conteudo}
              </p>
            </details>
          ))}
        </div>

        {/* ACEITE */}
        <div className="mt-10">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={aceito}
              onChange={(e) => setAceito(e.target.checked)}
            />
            Eu li e aceito os termos
          </label>

          <button
            onClick={handleAceitar}
            className="w-full mt-4 bg-red-600 text-white py-3 rounded-xl font-bold"
          >
            Aceitar e continuar
          </button>
        </div>

        {/* RODAPÉ */}
        <div className="mt-10 text-center text-xs text-gray-400">
          Mogu Mogu - Guapiara/SP
        </div>
      </div>
    </div>
  );
}
