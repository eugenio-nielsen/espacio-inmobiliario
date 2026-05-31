"use client";

import { useState } from "react";
import Image from "next/image";

interface Props {
  fotos: string[];
  titulo: string;
}

export default function PropertyGallery({ fotos, titulo }: Props) {
  const [current, setCurrent] = useState(0);

  if (!fotos?.length) {
    return (
      <div className="bg-gray-100 rounded-2xl h-72 flex items-center justify-center text-gray-300 text-6xl">
        🏠
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Foto principal */}
      <div className="relative w-full h-72 sm:h-96 rounded-2xl overflow-hidden bg-gray-100">
        <Image
          src={fotos[current]}
          alt={`${titulo} — foto ${current + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 66vw"
          priority={current === 0}
        />
        {fotos.length > 1 && (
          <>
            <button
              onClick={() => setCurrent((c) => (c - 1 + fotos.length) % fotos.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-9 h-9 flex items-center justify-center transition-colors"
            >
              ‹
            </button>
            <button
              onClick={() => setCurrent((c) => (c + 1) % fotos.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-9 h-9 flex items-center justify-center transition-colors"
            >
              ›
            </button>
            <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
              {current + 1} / {fotos.length}
            </span>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {fotos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {fotos.map((url, i) => (
            <button
              key={url}
              onClick={() => setCurrent(i)}
              className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                i === current ? "border-blue-500" : "border-transparent"
              }`}
            >
              <Image
                src={url}
                alt={`Miniatura ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
