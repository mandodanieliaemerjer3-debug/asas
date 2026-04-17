// /lib/ads.js

import { db } from "./firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  increment
} from "firebase/firestore";

/**
 * Busca anúncios
 * - Se NÃO tiver interesses → retorna todos ativos
 * - Se tiver interesses → filtra por tags
 */
export async function buscarAnunciosPorInteresse(interesses = []) {
  try {
    const snap = await getDocs(collection(db, "ads_mogu"));

    const anuncios = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return anuncios.filter(ad => {
      // precisa estar ativo
      if (ad.ativo !== true) return false;

      // precisa ter views disponíveis
      if (ad.limiteViews && ad.views >= ad.limiteViews) return false;

      // 🔥 SE NÃO TEM INTERESSE → PASSA DIRETO
      if (!interesses || interesses.length === 0) return true;

      // 🔥 SE TEM INTERESSE → FILTRA
      return ad.tags?.some(tag => interesses.includes(tag));
    });

  } catch (err) {
    console.error("Erro ao buscar anúncios:", err);
    return [];
  }
}

/**
 * Mistura anúncios no meio dos vídeos
 * (agora preparado pra intervalo correto)
 */
export function inserirAdsNosVideos(videos = [], anuncios = [], intervalo = 7) {
  let listaFinal = [];

  videos.forEach((video, i) => {
    listaFinal.push(video);

    // 🔥 a cada X vídeos entra anúncio
    if ((i + 1) % intervalo === 0 && anuncios.length > 0) {
      const adEscolhido =
        anuncios[Math.floor(Math.random() * anuncios.length)];

      listaFinal.push({
        ...adEscolhido,
        isAd: true
      });
    }
  });

  return listaFinal;
}

/**
 * Conta visualização do anúncio
 */
export async function registrarViewAnuncio(adId) {
  if (!adId) return;

  try {
    const ref = doc(db, "ads_mogu", adId);

    await updateDoc(ref, {
      views: increment(1)
    });

  } catch (err) {
    console.error("Erro ao contar view do anúncio:", err);
  }
}

/**
 * Conta clique no anúncio
 */
export async function registrarCliqueAnuncio(adId) {
  if (!adId) return;

  try {
    const ref = doc(db, "ads_mogu", adId);

    await updateDoc(ref, {
      cliques: increment(1)
    });

  } catch (err) {
    console.error("Erro ao contar clique:", err);
  }
}