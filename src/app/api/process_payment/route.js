import { NextResponse } from "next/server";
import { dbAdmin } from "../../../lib/firebaseAdmin";

export async function POST(req) {
  try {
    const body = await req.json();

    const accessToken = process.env.MP_ACCESS_TOKEN;
    const seuCollectorId = Number(process.env.MP_USER_ID);

    const orderId = body.orderId;

    if (!accessToken || !orderId) {
      return NextResponse.json({ error: "Dados inválidos" });
    }

    // 🔥 1. BUSCAR PEDIDO
    const pedidoRef = dbAdmin.collection("orders").doc(orderId);
    const pedidoSnap = await pedidoRef.get();

    if (!pedidoSnap.exists) {
      return NextResponse.json({ error: "Pedido não encontrado" });
    }

    const pedido = pedidoSnap.data();

    // 🔥 2. BUSCAR RESTAURANTE
    const restauranteRef = dbAdmin
      .collection("restaurants")
      .doc(pedido.restaurantId);

    const restauranteSnap = await restauranteRef.get();

    if (!restauranteSnap.exists) {
      return NextResponse.json({ error: "Restaurante não encontrado" });
    }

    const restaurante = restauranteSnap.data();

    const vendedorCollectorId =
      restaurante?.mercadoPago?.collector_id;

    if (!vendedorCollectorId) {
      return NextResponse.json({
        error: "Restaurante sem collector_id",
      });
    }

    // 🔥 3. VALORES
    const subtotal = Number(pedido.valores.subtotal);
    const frete = Number(pedido.valores.taxaEntrega);

    // ✔ restaurante = 88% do subtotal
    const valorRestaurante = Number((subtotal * 0.88).toFixed(2));

    // ✔ você = restante + frete
    const valorMarketplace = Number(
      (subtotal - valorRestaurante + frete).toFixed(2)
    );

    // ✔ total
    const total = Number((subtotal + frete).toFixed(2));

    // 🔥 4. CRIAR PAGAMENTO
    const paymentData = {
      transaction_amount: total,
      description: `Pedido ${orderId}`,
      payment_method_id: body.payment_method_id || "pix",

      payer: {
        email: body.payer?.email || "teste@teste.com",
      },

      external_reference: orderId,

      // 🔥 SPLIT CORRETO
      split_payments: [
        {
          amount: valorRestaurante,
          collector_id: vendedorCollectorId,
        },
        {
          amount: valorMarketplace,
          collector_id: seuCollectorId,
        },
      ],
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

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);

    return NextResponse.json({
      error: error.message,
    });
  }
}