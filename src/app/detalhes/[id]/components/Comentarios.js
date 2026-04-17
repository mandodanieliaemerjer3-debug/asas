"use client";

export default function Comentarios({
  comentarios,
  novoComentario,
  setNovoComentario,
  enviarComentario,
  UploadComponent,
  setImagem
}) {
  return (
    <div className="p-4 mt-6">

      <h3 className="font-black mb-4 text-lg">
        💬 Comentários
      </h3>

      {/* INPUT */}
      <div className="bg-gray-100 p-3 rounded-2xl flex flex-col gap-3 mb-6">

        <textarea
          value={novoComentario}
          onChange={(e) => setNovoComentario(e.target.value)}
          placeholder="O que achou do lanche?"
          className="bg-transparent outline-none resize-none text-sm"
        />

        <UploadComponent onSelect={setImagem} />

        <button
          onClick={enviarComentario}
          className="bg-black text-white py-2 rounded-xl font-black"
        >
          Enviar
        </button>

      </div>

      {/* LISTA */}
      <div className="flex flex-col gap-4">

        {comentarios.map(c => (
          <div
            key={c.id}
            className="bg-white p-4 rounded-2xl shadow"
          >
            <p className="text-xs font-black text-gray-400">
              {c.userName}
            </p>

            <p className="mt-1 text-sm">
              {c.texto}
            </p>

            {c.imageUrl && (
              <img
                src={c.imageUrl}
                className="mt-3 rounded-xl w-full object-cover"
              />
            )}
          </div>
        ))}

      </div>

    </div>
  );
}