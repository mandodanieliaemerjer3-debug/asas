import { NextResponse } from "next/server";
import { dbAdmin } from "../../../lib/firebaseAdmin";

export async function POST(req) {
  try {
    const body = await req.json();

    const accessToken = process.env.MP_ACCESS_TOKEN;
    const orderId = body.orderId;

    if (!accessToken) {
      return NextResponse.json({
        status: "error",
        erro_real: "TOKEN_NAO_CONFIGURADO",
      });
    }

    if (!orderId) {
      return NextResponse.json({
        status: "error",
        erro_real: "ORDER_ID_AUSENTE",
      });
    }

    const webhookUrl =
      "https://collin-medicochirurgical-kathrine.ngrok-free.dev/api/webhook";

    const paymentData = {
      transaction_amount: Number(body.transaction_amount),
      token: body.token,
      description: `Pedido ${orderId}`,
      external_reference: orderId, // 🔥 conecta com pedido
      notification_url: webhookUrl, // 🔥 webhook ativo
      installments: Number(body.installments),
      payment_method_id: body.payment_method_id,
      issuer_id: Number(body.issuer_id),
      payer: {
        email: body.payer?.email || "cliente@teste.com",
        identification: {
          type: "CPF",
          number:
            body.payer?.identification?.number || "12345678909",
        },
      },
    };

    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": orderId,
      },
      body: JSON.stringify(paymentData),
    });

    const result = await mpRes.json();

    console.log("💳 MP RESPONSE:", result);

    // 🔥 FALLBACK CONTROLADO
    if (result.status === "approved") {
      await dbAdmin.collection("orders").doc(orderId).set(
        {
          pago: true,
          status: "Pago",
          mercado_pago_id: result.id,
          data_pagamento: new Date().toISOString(),
          origem: "fallback",
        },
        { merge: true }
      );

      console.log("⚠️ fallback usou (approved)");
    }

    if (result.status === "rejected") {
      await dbAdmin.collection("orders").doc(orderId).set(
        {
          pago: false,
          status: "Rejeitado",
          origem: "fallback",
        },
        { merge: true }
      );

      console.log("⚠️ fallback usou (rejected)");
    }

    return NextResponse.json({
      status: result.status || "erro",
      status_detail: result.status_detail || "desconhecido",
      pagamento_id: result.id,
    });
  } catch (error) {
    console.error("❌ ERRO GERAL:", error);

    return NextResponse.json({
      status: "error",
      erro_real: error.message,
    });
  }
}