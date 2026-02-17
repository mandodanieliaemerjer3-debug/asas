import { db } from "../../../lib/firebase"; 
import { collection, query, where, getDocs } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const restauranteId = body.restauranteId;

    // 📡 BUSCA INTELIGENTE: Pega apenas o que foi ENTREGUE
    // Não filtramos o repasse no Firebase para capturar pedidos antigos sem o campo
    const q = query(
      collection(db, "orders"),
      where("status", "==", "Entregue")
    );

    const snap = await getDocs(q);
    
    let produtosBruto = 0;
    let fretesBruto = 0;
    let moedasReembolso = 0;
    let listaPendente = [];

    snap.docs.forEach(docSnap => {
      const d = docSnap.data();
      
      // 🛡️ A LÓGICA QUE VOCÊ PEDIU:
      // Se o campo NÃO existir (undefined) OU for falso, ele entra na conta
      const jaFoiPago = d.repasseConfirmado === true;

      if (!jaFoiPago) {
        const itensDoRest = d.itens?.filter(i => i.restaurantId === restauranteId) || [];
        
        if (itensDoRest.length > 0) {
          const somaProdutos = itensDoRest.reduce((acc, i) => acc + (Number(i.price) || 0), 0);
          produtosBruto += somaProdutos;
          fretesBruto += (Number(d.valores?.taxaEntrega) || 0);
          moedasReembolso += (Number(d.moedasGastas) || 0) * 0.01;

          listaPendente.push({
            id: docSnap.id,
            clienteNome: d.clienteNome || "Cliente",
            totalPedido: d.valores?.total || 0,
            data: d.criadoEm
          });
        }
      }
    });

    const comissaoMogu = produtosBruto * 0.05; 
    const totalPagar = (comissaoMogu + fretesBruto) - moedasReembolso;

    return NextResponse.json({
      comissaoMogu: comissaoMogu || 0,
      fretesBruto: fretesBruto || 0,
      moedasDesconto: moedasReembolso || 0,
      totalPagar: totalPagar > 0 ? totalPagar : 0,
      pedidosRelacionados: listaPendente
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}