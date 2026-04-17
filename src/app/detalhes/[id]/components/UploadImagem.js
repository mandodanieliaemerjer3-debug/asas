"use client";

import { useState } from "react";

export default function UploadImagem({ onSelect }) {
  const [preview, setPreview] = useState(null);

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target.result;
      };

      img.onload = () => {
        const canvas = document.createElement("canvas");

        const maxWidth = 800;
        const scale = maxWidth / img.width;

        canvas.width = maxWidth;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          "image/jpeg",
          0.7 // qualidade
        );
      };

      reader.readAsDataURL(file);
    });
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const compressed = await compressImage(file);

    setPreview(URL.createObjectURL(compressed));
    onSelect(compressed);
  };

  return (
    <div className="flex flex-col gap-2">

      <label className="border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer hover:bg-gray-50 transition">

        <p className="text-sm font-black text-gray-500">
          📸 Adicionar foto
        </p>

        <input
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />

      </label>

      {preview && (
        <img
          src={preview}
          className="w-full h-40 object-cover rounded-2xl shadow"
        />
      )}

    </div>
  );
}