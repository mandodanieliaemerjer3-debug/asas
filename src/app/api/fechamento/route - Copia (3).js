import { db } from "../../../lib/firebase"; //
import { collection, query, where, getDocs } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const restauranteId = body.restauranteId;
    
    // Pegamos a data de hoje no formato YYYY-MM-DD para bater com o banco
    const hoje = new Date().toISOString().split('T')[0];

    // 📡 Busca pedidos que já foram finalizados hoje
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
      
      // 🛡️ Filtro de Segurança: Garante que o pedido tem itens e valores
      const itensDoRest = d.itens?.filter(i => i.restaurantId === restauranteId) || [];
      
      if (itensDoRest.length > 0) {
        // Soma apenas os produtos deste restaurante
        produtosBruto += itensDoRest.reduce((acc, i) => acc + (Number(i.price) || 0), 0);
        
        // Soma o frete (garantindo que seja número)
        fretesBruto += (Number(d.valores?.taxaEntrega) || 0);
        
        // Soma moedas gastas (0.01 por moeda)
        moedasReembolso += (Number(d.moedasGastas) || 0) * 0.01;
      }
    });

    // 🧮 A MATEMÁTICA DO REPASSE
    const comissao = produtosBruto * 0.05; // 5% seu
    const totalPagar = (comissao + fretesBruto) - moedasReembolso;

    return NextResponse.json({
      comissaoMogu: comissao || 0,
      fretesBruto: fretesBruto || 0,
      moedasDesconto: moedasReembolso || 0,
      totalPagar: totalPagar > 0 ? totalPagar : 0
    });

  } catch (error) {
    console.error("ERRO CRÍTICO NA API:", error);
    return NextResponse.json(
      { error: "Erro interno: " + error.message }, 
      { status: 500 }
    );
  }
}