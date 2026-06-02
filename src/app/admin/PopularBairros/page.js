"use client";

import { useState } from 'react';
import { getFirestore, collection, writeBatch, doc } from 'firebase/firestore';

// Tentei ajustar o caminho para voltar 3 pastas e entrar na 'lib'.
// Se a sua pasta lib estiver dentro de src, isto vai funcionar.
import { app } from '../../../lib/firebase'; 

export default function PopularBairros() {
  const [jsonInput, setJsonInput] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePopulate = async () => {
    if (!jsonInput.trim()) {
      setStatus('Cole o JSON antes de enviar.');
      return;
    }

    try {
      setLoading(true);
      setStatus('A processar...');
      
      // Converte o texto colado num objeto JavaScript
      const bairros = JSON.parse(jsonInput);

      // Valida se o que foi colado é realmente uma lista (array)
      if (!Array.isArray(bairros)) {
        setStatus('Erro: O JSON precisa de ser uma lista, comece com [ e termine com ]');
        setLoading(false);
        return;
      }

      const db = getFirestore(app);
      const batch = writeBatch(db);

      // Prepara o envio de cada bairro
      bairros.forEach((bairro) => {
        // Cria uma referência vazia na coleção "bairros" (o Firebase gera um ID único)
        const bairroRef = doc(collection(db, 'bairros'));
        
        batch.set(bairroRef, {
          fee: Number(bairro.fee),
          level: String(bairro.level),
          linha: Number(bairro.linha),
          linhaId: String(bairro.linhaId),
          name: String(bairro.name)
        });
      });

      // Envia tudo para o Firebase de uma vez só
      await batch.commit();
      
      setStatus(`✅ Sucesso! ${bairros.length} bairros foram adicionados.`);
      setJsonInput(''); // Limpa o campo para o próximo uso
    } catch (error) {
      console.error("Erro ao popular:", error);
      setStatus(`❌ Erro no JSON ou no Firebase: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2>Popular Bairros em Massa</h2>
      <p>Cole o array JSON com os bairros e clique em enviar.</p>
      
      <textarea
        rows={15}
        style={{ width: '100%', padding: '10px', marginBottom: '10px', fontFamily: 'monospace' }}
        placeholder='[{"name": "Vila Rural", "fee": 20...}]'
        value={jsonInput}
        onChange={(e) => setJsonInput(e.target.value)}
      />
      
      <button 
        onClick={handlePopulate} 
        disabled={loading}
        style={{ padding: '10px 20px', background: '#0070f3', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '5px' }}
      >
        {loading ? 'A enviar...' : 'Popular Firebase'}
      </button>
      
      {status && <p style={{ marginTop: '15px', fontWeight: 'bold' }}>{status}</p>}
    </div>
  );
}