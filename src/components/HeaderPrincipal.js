"use client";

export default function HeaderPrincipal({ user, loginGoogle, router }) {
  return (
    <header className="p-4 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-100">
      <div className="flex items-center gap-3">
        {!user ? (
          <button
            onClick={loginGoogle}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 font-black italic"
          >
            IN
          </button>
        ) : (
          <div
            onClick={() => router.push("/perfil")}
            className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center font-bold uppercase shadow-md cursor-pointer"
          >
            {user.displayName ? user.displayName[0] : "U"}
          </div>
        )}
        <div>
          <p className="text-[10px] text-gray-400 font-black uppercase leading-none">
            Entrega em
          </p>
          <h3 className="font-black text-gray-800 text-xs italic uppercase">
            📍 Guapiara, SP
          </h3>
        </div>
      </div>
    </header>
  );
}