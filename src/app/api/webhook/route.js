import { NextResponse } from "next/server";
import { dbAdmin } from "../../../lib/firebaseAdmin";

export async function POST(req) {
  try {
    const body = await req.json();

    console.log("🔔 Webhook recebido:", JSON.stringify(body));

    const paymentId = body?.data?.id;
    const type = body?.type;

    if (type !== "payment" || !paymentId) {
      return NextResponse.json({ ok: true });
    }

    // 🔒 BUSCA DADOS REAIS DO PAGAMENTO (NÃO CONFIA NO WEBHOOK)
    const resMP = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
      }
    );

    const payment = await resMP.json();

    console.log("💳 Status real:", payment.status);

    const orderId = payment.external_reference;

    if (!orderId) {
      console.log("❌ Sem external_reference");
      return NextResponse.json({ ok: true });
    }

    const orderRef = dbAdmin.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      console.log("❌ Pedido não encontrado:", orderId);
      return NextResponse.json({ ok: true });
    }

    const orderData = orderSnap.data();

    // 🧠 ANTI-DUPLICAÇÃO (evita processar duas vezes)
    if (orderData.mercado_pago_id === payment.id) {
      console.log("⚠️ Já processado antes");
      return NextResponse.json({ ok: true });
    }

    // 🎯 DEFINE STATUS FINAL
    let statusFinal = "Pendente";
    let pago = false;

    if (payment.status === "approved") {
      statusFinal = "Pago";
      pago = true;
    } else if (payment.status === "rejected") {
      statusFinal = "Rejeitado";
    } else if (payment.status === "in_process") {
      statusFinal = "Processando";
    }

    // 💾 ATUALIZA FIREBASE (ADMIN = SEM BLOQUEIO DE PERMISSÃO)
    await orderRef.set(
      {
        pago,
        status: statusFinal,
        mercado_pago_id: payment.id,
        data_pagamento: new Date().toISOString(),
        webhook_processado: true,
      },
      { merge: true }
    );

    console.log(`✅ Pedido ${orderId} atualizado via webhook`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("❌ Erro webhook:", error);
    return NextResponse.json({ error: "erro" }, { status: 500 });
  }
}