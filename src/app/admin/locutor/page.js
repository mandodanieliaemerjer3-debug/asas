// src/app/adm/locutor/page.js
import Transcritor from "./Transcritor"; // Ou onde você salvar o arquivo do transcritor

export default function PaginaLocutor() {
  return (
    <main className="p-10">
      <h1 className="text-2xl font-black italic">Painel do Locutor</h1>
      <p>O sistema de escuta está ativo e rodando em segundo plano.</p>
      
      {/* Aqui você insere o componente que criamos */}
      <Transcritor />
    </main>
  );
}