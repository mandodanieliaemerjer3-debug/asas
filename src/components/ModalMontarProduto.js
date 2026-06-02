"use client";

import ModalPizza from "./ModalPizza";
import ModalBurguer from "./ModalBurguer"; 
import ModalMarmita from "./ModalMarmita"; 
import ModalSorvete from "./ModalSorvete"; // Adicionamos a importação aqui!

export default function ModalMontarProduto({ produto, onClose, onConfirm }) {
  
  const categoria = (produto?.category || produto?.categoria || "").toLowerCase();
  const tagsTexto = (produto?.tags || produto?.t || "").toLowerCase();

  // É Pizza?
  if (categoria === "pizza" || produto?.pizza === true || tagsTexto.includes("pizza")) {
    return <ModalPizza produto={produto} onClose={onClose} onConfirm={onConfirm} />;
  }

  // É Lanche/Hambúrguer?
  if (categoria === "lanche" || produto?.burguer === true || tagsTexto.includes("lanche") || tagsTexto.includes("hamburguer")) {
    return <ModalBurguer produto={produto} onClose={onClose} onConfirm={onConfirm} />;
  }

  // É Marmita?
  if (categoria === "marmita" || tagsTexto.includes("marmita")) {
    return <ModalMarmita produto={produto} onClose={onClose} onConfirm={onConfirm} />;
  }

  // É Sorvete/Sobremesa? (Verifica categoria ou tags)
  if (categoria === "sorvete" || categoria === "sobremesa" || tagsTexto.includes("sorvete")) {
    return <ModalSorvete produto={produto} onClose={onClose} onConfirm={onConfirm} />;
  }

  // Fallback padrão de segurança
  return <ModalPizza produto={produto} onClose={onClose} onConfirm={onConfirm} />;
}