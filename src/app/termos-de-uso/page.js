"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TermosUsoPage() {
  const router = useRouter();
  const [aceito, setAceito] = useState(false);

  const handleAceitar = () => {
    if (!aceito) return alert("Você precisa aceitar os termos para continuar.");

    localStorage.setItem("mogu_termos_uso_aceito", "true");
    router.push("/");
  };

  const secoes = [
    {
      titulo: "1. Natureza da Plataforma",
      conteudo:
        "O Mogu Mogu é uma plataforma de intermediação entre usuários, restaurantes e entregadores. Não produz alimentos nem realiza entregas diretamente (exceto operação própria identificada).",
    },
    {
      titulo: "2. Responsabilidade dos Restaurantes",
      conteudo:
        "Os restaurantes são responsáveis por qualidade, preparo, higiene, ingredientes e alergênicos. O Mogu Mogu não garante ausência de contaminação cruzada nem se responsabiliza pelos alimentos fornecidos por terceiros.",
    },
    {
      titulo: "3. Logística e Entrega",
      conteudo:
        "A responsabilidade da entrega varia entre restaurante e parceiro logístico. Endereço incorreto é responsabilidade do usuário. Entregas em portaria ou local indicado são consideradas concluídas. Problemas como pedido trocado ou não entregue serão analisados.",
    },
    {
      titulo: "4. Conferência no Ato da Entrega",
      conteudo:
        "O usuário deve conferir o pedido no momento da entrega. Lacres violados devem ser recusados ou reportados imediatamente. Reclamações com prova (foto/vídeo) devem ocorrer em até 30 minutos após a entrega.",
    },
    {
      titulo: "5. Temperatura e Condição",
      conteudo:
        "O restaurante deve enviar o produto em condições adequadas, porém o transporte pode afetar temperatura. Casos como alimento frio ou derretido serão analisados conforme distância e tempo.",
    },
    {
      titulo: "6. Loja Própria",
      conteudo:
        "Pedidos identificados como loja própria são de responsabilidade da empresa vinculada ao mesmo CNPJ, operando separadamente dentro da plataforma.",
    },
    {
      titulo: "7. Pagamentos",
      conteudo:
        "Pagamentos são processados via Mercado Pago. Não armazenamos dados de cartão. O Mercado Pago atua como intermediador financeiro independente.",
    },
    {
      titulo: "8. Reembolsos e Cancelamentos",
      conteudo:
        "O prazo de análise é de até 5 dias úteis. Reembolsos não são automáticos e dependem de análise ou obrigação legal. Podem ocorrer em casos de não entrega ou erro comprovado.",
    },
    {
      titulo: "9. Fraudes e Abusos",
      conteudo:
        "É proibido solicitar reembolso de má fé, consumir o produto e pedir estorno ou explorar falhas. Contas podem ser suspensas e benefícios removidos.",
    },
    {
      titulo: "10. Cashback e Benefícios",
      conteudo:
        "Moedas, cupons e cashback podem ser cancelados em caso de uso indevido. Contas suspeitas podem ser bloqueadas.",
    },
    {
      titulo: "11. Erros de Sistema e Preço",
      conteudo:
        "Em caso de erro evidente (como preços incorretos ou cupons bugados), o Mogu Mogu pode cancelar pedidos, corrigir valores ou remover benefícios, mesmo após confirmação.",
    },
    {
      titulo: "12. Problemas Operacionais",
      conteudo:
        "Incluem entregador indisponível, loja aberta indevidamente, pedido trocado ou falhas no sistema. Todos os casos passam por análise antes de qualquer compensação.",
    },
    {
      titulo: "13. Limitação de Responsabilidade",
      conteudo:
        "O Mogu Mogu não se responsabiliza por ações de terceiros nem garante funcionamento contínuo ou entrega perfeita, dentro dos limites legais.",
    },
    {
      titulo: "14. Privacidade",
      conteudo:
        "O tratamento de dados segue a Política de Privacidade (LGPD), disponível separadamente no aplicativo.",
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
        <h1 className="text-3xl font-black mb-2">Termos de Uso</h1>
        <p className="text-xs text-gray-400 mb-6">
          Mogu Mogu • Versão Blindada 2026
        </p>

        {/* SEÇÕES */}
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
            Eu li e aceito os termos de uso e política de privacidade
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