import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();

    console.log("📥 BODY RECEBIDO:", body);

    const accessToken = process.env.MP_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json({
        status: "error",
        erro_real: "TOKEN_NAO_CONFIGURADO",
      });
    }

    // 🔍 DESCOBRE DONO DO TOKEN (DEBUG)
    const accRes = await fetch("https://api.mercadopago.com/v1/account", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const account = await accRes.json();
    console.log("👤 DONO DO TOKEN COMPLETO:", account);

    // 🧠 VALIDAÇÕES
    const amount = Number(body.transaction_amount);
    const installments = Number(body.installments);
    const issuerId = Number(body.issuer_id);

    if (!amount || amount <= 0) {
      return NextResponse.json({
        status: "error",
        erro_real: "VALOR_INVALIDO",
        enviado: body,
      });
    }

    if (!installments || installments <= 0) {
      return NextResponse.json({
        status: "error",
        erro_real: "PARCELAS_INVALIDAS",
        enviado: body,
      });
    }

    if (!issuerId) {
      return NextResponse.json({
        status: "error",
        erro_real: "ISSUER_INVALIDO",
        enviado: body,
      });
    }

    // 📦 MONTA PAGAMENTO
    const paymentData = {
      transaction_amount: amount,
      token: body.token,
      description: "Pedido Teste Automatizado",
      installments: installments,
      payment_method_id: body.payment_method_id,
      issuer_id: issuerId,
      payer: {
        email: body.payer?.email || "cliente@teste.com",
        identification: {
          type: "CPF",
          number: body.payer?.identification?.number || "12345678909",
        },
      },
    };

    console.log("📦 ENVIANDO PARA MP:", paymentData);

    // 💳 ENVIA PARA MERCADO PAGO (COM IDPOTENCY KEY)
    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": crypto.randomUUID(), // 🔥 CORREÇÃO AQUI
      },
      body: JSON.stringify(paymentData),
    });

    const result = await mpRes.json();

    console.log("✅ RESPOSTA MP COMPLETA:", result);

    // ✅ SUCESSO
    if (result.status === "approved") {
      return NextResponse.json({
        status: "approved",
        status_detail: result.status_detail,
        pagamento_id: result.id,
        collector_id: result.collector_id,
      });
    }

    // ❌ ERRO CONTROLADO
    return NextResponse.json({
      status: result.status || "erro",
      status_detail: result.status_detail || "desconhecido",
      erro_real: result.message,
      cause: result.cause,
      enviado: paymentData,
    });

  } catch (error) {
    console.error("❌ ERRO GERAL:", error);

    return NextResponse.json({
      status: "error",
      erro_real: error.message,
    });
  }
}