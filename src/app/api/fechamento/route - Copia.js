import { db } from "../../../lib/firebase"; // Caminho exato para sair de api/fechamento e chegar em lib
import { collection, query, where, getDocs } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { restauranteId } = await request.json();
    const hoje = new Date().toISOString().split('T')[0];

    // Busca pedidos entregues hoje para calcular o repasse
    const q = query(
      collection(db, "orders"),
      where("status", "in", ["Entregue", "Finalizado"]),
      where("criadoEm", ">=", hoje)
    );

    const snap = await getDocs(q);
    let produtosBruto = 0;
    let fretesBruto = 0;
    let moedasReembolso = 0;

    snap.docs.forEach(doc => {
      const d = doc.data();
      // Isola apenas os itens deste restaurante específico no pedido
      const itensDoRest = d.itens?.filter(i => i.restaurantId === restauranteId) || [];
      
      if (itensDoRest.length > 0) {
        produtosBruto += itensDoRest.reduce((acc, i) => acc + (Number(i.price) || 0), 0);
        fretesBruto += (d.valores?.taxaEntrega || 0);
        moedasReembolso += (Number(d.moedasGastas) || 0) * 0.01;
      }
    });

    const comissao = produtosBruto * 0.05; // Sua taxa de 5% sobre produtos
    const totalPagar = (comissao + fretesBruto) - moedasReembolso;

    return NextResponse.json({
      comissaoMogu: comissao,
      fretesBruto,
      moedasDesconto: moedasReembolso,
      totalPagar: totalPagar > 0 ? totalPagar : 0
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}