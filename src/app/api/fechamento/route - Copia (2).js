import { db } from "../../../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { restauranteId } = await request.json();
    const hoje = new Date().toISOString().split('T')[0];

    const q = query(
      collection(db, "orders"),
      where("status", "in", ["Entregue", "Finalizado"]),
      where("criadoEm", ">=", hoje)
    );

    const snap = await getDocs(q);
    
    // Inicializamos com 0 para evitar o erro de 'undefined' na página
    let produtosBruto = 0;
    let fretesBruto = 0;
    let moedasReembolso = 0;

    snap.docs.forEach(doc => {
      const d = doc.data();
      const itensDoRest = d.itens?.filter(i => i.restaurantId === restauranteId) || [];
      
      if (itensDoRest.length > 0) {
        produtosBruto += itensDoRest.reduce((acc, i) => acc + (Number(i.price) || 0), 0);
        fretesBruto += (Number(d.valores?.taxaEntrega) || 0);
        moedasReembolso += (Number(d.moedasGastas) || 0) * 0.01;
      }
    });

    const comissao = produtosBruto * 0.05;
    const totalPagar = (comissao + fretesBruto) - moedasReembolso;

    // Retornamos os nomes exatos que a sua página page.js está esperando
    return NextResponse.json({
      comissaoMogu: comissao,
      fretesBruto: fretesBruto,
      moedasDesconto: moedasReembolso,
      totalPagar: totalPagar > 0 ? totalPagar : 0
    });
  } catch (error) {
    console.error("Erro na API:", error);
    return NextResponse.json({ error: "Erro ao calcular valores" }, { status: 500 });
  }
}