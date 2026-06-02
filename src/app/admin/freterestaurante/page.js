"use client";

import { useState, useEffect } from "react";
import { getFirestore, collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
// Ajuste o caminho da lib conforme a sua estrutura (voltei 3 pastas baseado no arquivo anterior)
import { app } from "../../../lib/firebase"; 

export default function FreteRestaurante() {
  const [restaurantes, setRestaurantes] = useState([]);
  const [selectedRest, setSelectedRest] = useState("");
  
  // As taxas que vamos editar na tela (formato de lista para facilitar)
  const [taxas, setTaxas] = useState([]); 
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const db = getFirestore(app);

  // 1. Carrega todos os restaurantes ao abrir a página
  useEffect(() => {
    async function carregarRestaurantes() {
      try {
        const snap = await getDocs(collection(db, "restaurants"));
        const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setRestaurantes(lista);
      } catch (error) {
        console.error("Erro ao buscar restaurantes:", error);
      } finally {
        setLoading(false);
      }
    }
    carregarRestaurantes();
  }, []);

  // 2. Quando escolhe um restaurante, carrega as taxas que ele já tem
  const handleSelectRestaurante = async (restId) => {
    setSelectedRest(restId);
    setStatus("");
    if (!restId) {
      setTaxas([]);
      return;
    }

    try {
      const docRef = doc(db, "restaurants", restId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const dados = docSnap.data();
        const taxasDoBanco = dados.taxasPorLinha || {};
        
        // Converte o formato do Firebase (Mapa) para um Array (Lista) para a tela
        const taxasParaTela = Object.keys(taxasDoBanco).map(linhaId => ({
          linha: linhaId,
          preco: taxasDoBanco[linhaId].preco,
          ativo: taxasDoBanco[linhaId].ativo
        }));
        
        setTaxas(taxasParaTela);
      }
    } catch (error) {
      console.error("Erro ao carregar taxas:", error);
    }
  };

  // 3. Adiciona uma nova linha em branco na tela
  const adicionarLinha = () => {
    setTaxas([...taxas, { linha: "", preco: "", ativo: true }]);
  };

  // 4. Remove uma linha da tela
  const removerLinha = (index) => {
    const novasTaxas = [...taxas];
    novasTaxas.splice(index, 1);
    setTaxas(novasTaxas);
  };

  // 5. Atualiza os dados de uma linha específica enquanto digita
  const atualizarLinha = (index, campo, valor) => {
    const novasTaxas = [...taxas];
    novasTaxas[index][campo] = valor;
    setTaxas(novasTaxas);
  };

  // 6. Salva tudo no Firebase no formato perfeito (Mapa)
  const salvarConfiguracoes = async () => {
    if (!selectedRest) return;
    setSaving(true);
    setStatus("Salvando...");

    try {
      // Converte a lista da tela de volta para o formato Mapa que o Firebase gosta
      const taxasMapaParaSalvar = {};
      
      taxas.forEach(t => {
        if (t.linha && t.linha.trim() !== "") {
          taxasMapaParaSalvar[t.linha] = {
            preco: Number(t.preco) || 0,
            ativo: Boolean(t.ativo)
          };
        }
      });

      const docRef = doc(db, "restaurants", selectedRest);
      
      // Atualiza apenas o campo taxasPorLinha no documento do restaurante
      await updateDoc(docRef, {
        taxasPorLinha: taxasMapaParaSalvar
      });

      setStatus("✅ Taxas de frete atualizadas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      setStatus("❌ Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Carregando restaurantes...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', fontFamily: 'sans-serif', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '12px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>🚚 Configurar Frete por Restaurante</h1>
      
      {/* SELECIONAR RESTAURANTE */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Selecione o Restaurante:</label>
        <select 
          value={selectedRest} 
          onChange={(e) => handleSelectRestaurante(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px' }}
        >
          <option value="">-- Escolha um restaurante --</option>
          {restaurantes.map(r => (
            <option key={r.id} value={r.id}>
              {r.nome || r.name || r.id} {/* Tenta mostrar o nome, se não tiver, mostra o ID */}
            </option>
          ))}
        </select>
      </div>

      {/* ÁREA DE CONFIGURAÇÃO DE LINHAS (Só aparece se escolher um restaurante) */}
      {selectedRest && (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>Linhas de Entrega</h2>
          
          {taxas.length === 0 && <p style={{ color: '#666', fontStyle: 'italic' }}>Nenhuma linha configurada ainda.</p>}

          {taxas.map((taxa, index) => (
            <div key={index} style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
              
              <div style={{ flex: '1' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#555' }}>ID da Linha</label>
                <input 
                  type="text" 
                  placeholder="Ex: 1, 2, 4..."
                  value={taxa.linha} 
                  onChange={(e) => atualizarLinha(index, 'linha', e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                />
              </div>

              <div style={{ flex: '1' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#555' }}>Preço (R$)</label>
                <input 
                  type="number" 
                  placeholder="Ex: 15.00"
                  value={taxa.preco} 
                  onChange={(e) => atualizarLinha(index, 'preco', e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '80px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#555' }}>Ativo?</label>
                <input 
                  type="checkbox" 
                  checked={taxa.ativo} 
                  onChange={(e) => atualizarLinha(index, 'ativo', e.target.checked)}
                  style={{ width: '20px', height: '20px', marginTop: '5px' }}
                />
              </div>

              <button 
                onClick={() => removerLinha(index)}
                style={{ marginTop: '18px', padding: '8px 12px', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Remover
              </button>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <button 
              onClick={adicionarLinha}
              style={{ padding: '10px 20px', backgroundColor: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              + Adicionar Linha
            </button>

            <button 
              onClick={salvarConfiguracoes}
              disabled={saving}
              style={{ padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
          
          {status && (
            <div style={{ marginTop: '20px', padding: '15px', borderRadius: '8px', backgroundColor: status.includes('❌') ? '#fef2f2' : '#ecfdf5', color: status.includes('❌') ? '#991b1b' : '#065f46', fontWeight: 'bold', textAlign: 'center' }}>
              {status}
            </div>
          )}
        </div>
      )}
    </div>
  );
}