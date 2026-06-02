"use client";
import { useState, useEffect } from "react";
// Importamos as ferramentas do Remote Config
import { getRemoteConfig, fetchAndActivate, getValue } from "firebase/remote-config";
// ATENÇÃO: Confirme se o 'app' está sendo exportado no seu arquivo lib/firebase.js
import { app } from "../lib/firebase"; 

export default function BannerRemote() {
  const [bannerUrl, setBannerUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarBannerInteligente = async () => {
      try {
        const remoteConfig = getRemoteConfig(app);
        
        // ZERA O CACHE (Deixe assim para testarmos. Quando for para a rua, nós apagamos essa linha)
        remoteConfig.settings.minimumFetchIntervalMillis = 0; 
        
        // Ativa a conexão com o Firebase e puxa as regras
        await fetchAndActivate(remoteConfig);
        
        // Busca a chave exata que você criou lá no painel
        const url = getValue(remoteConfig, "banner_principal_url").asString();
        
        if (url) {
          setBannerUrl(url);
        }
      } catch (error) { 
        console.error("Erro ao puxar o banner inteligente:", error); 
      } finally { 
        setLoading(false); 
      }
    };

    carregarBannerInteligente();
  }, []);

  // Animação de carregamento (Skeleton)
  if (loading) return <div className="w-full h-72 bg-zinc-900 animate-pulse rounded-[45px]" />;
  
  // Se houver falha e não vier link, esconde o componente para não ficar um buraco
  if (!bannerUrl) return null;

  return (
    <div className="relative w-full h-72 overflow-hidden rounded-[45px] bg-black shadow-2xl border border-white/5 group">
        <img 
          src={bannerUrl} 
          className="w-full h-full object-cover" 
          alt="Destaque Mogu Mogu" 
        />
    </div>
  );
}