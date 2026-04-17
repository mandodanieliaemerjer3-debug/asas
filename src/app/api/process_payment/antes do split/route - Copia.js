import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN 
});

function diagnosticar(result, body) {
  const erros = [];

  if (!body.transaction_amount || isNaN(body.transaction_amount)) {
    erros.push("❌ Valor inválido (transaction_amount)");
  }

  if (!body.token) {
    erros.push("❌ Token não gerado");
  }

  if (!body.installments) {
    erros.push("❌ Parcelas ausentes");
  }

  if (!body.payment_method_id) {
    erros.push("❌ Método de pagamento ausente");
  }

  // ❌ REMOVIDO: validação de email test_user

  if (!body.payer?.identification?.number) {
    erros.push("❌ CPF não informado");
  }

  if (result?.status_detail) {
    if (result.status_detail.includes("bad_filled")) {
      erros.push("🚨 Dados incorretos (CPF/email/cartão)");
    }

    if (result.status_detail.includes("card")) {
      erros.push("💳 Problema com cartão");
    }
  }

  return erros;
}

export async function POST(request) {
  try {
    const body = await request.json();

    console.log("📥 BODY RECEBIDO:", body);

    const payment = new Payment(client);

    const valor = Number(body.transaction_amount);

    if (!valor || isNaN(valor)) {
      return NextResponse.json({
        status: "error",
        status_detail: "valor_invalido",
        erro_real: "transaction_amount inválido ou não enviado"
      }, { status: 400 });
    }

    const paymentData = {
      transaction_amount: valor,
      token: body.token,
      description: "Pedido Teste Automatizado",
      installments: Number(body.installments) || 1,
      payment_method_id: body.payment_method_id,
      issuer_id: body.issuer_id ? Number(body.issuer_id) : undefined,
      payer: {
        email: body.payer?.email || "test@test.com", // fallback seguro
        identification: {
          type: "CPF",
          number: body.payer?.identification?.number || "12345678909"
        }
      }
    };

    console.log("📦 ENVIANDO PARA MP:", paymentData);

    const result = await payment.create({ body: paymentData });

    console.log("✅ RESPOSTA MP:", result);

    const diagnostico = diagnosticar(result, paymentData);

    return NextResponse.json({
      status: result.status,
      status_detail: result.status_detail,
      diagnostico,
      enviado: paymentData,
      resposta_mp: result
    });

  } catch (error) {
    console.error("❌ ERRO COMPLETO:", error);

    return NextResponse.json({
      status: "error",
      status_detail: "erro_no_backend",
      erro_real: error.message,
      erro_completo: JSON.stringify(error, null, 2)
    }, { status: 500 });
  }
}