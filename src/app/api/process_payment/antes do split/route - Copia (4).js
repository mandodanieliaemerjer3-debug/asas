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

    const paymentData = {
      transaction_amount: Number(body.transaction_amount),
      token: body.token,
      description: `Pedido ${orderId}`,
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

    console.log("MP RESPONSE:", result);

    // 🔥 SALVA NO FIREBASE COM ADMIN SDK
    if (
      result.status === "approved" ||
      result.status === "rejected" ||
      result.status === "cancelled"
    ) {
      const statusFinal =
        result.status === "approved" ? "Pago" : "Rejeitado";

      await dbAdmin.collection("orders").doc(orderId).update({
        pago: result.status === "approved",
        status: statusFinal,
        mercado_pago_id: result.id,
        data_pagamento: new Date().toISOString(),
      });
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