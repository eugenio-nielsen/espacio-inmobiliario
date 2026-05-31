"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomeSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/propiedades?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto">
      <div className="flex items-center bg-white rounded-xl overflow-hidden shadow-2xl">
        <div className="flex items-center gap-3 flex-1 px-5">
          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por ubicación, tipo de propiedad..."
            className="flex-1 py-4 text-gray-800 text-sm bg-transparent outline-none placeholder-gray-400"
          />
        </div>
        <button
          type="submit"
          className="flex items-center gap-2 px-7 py-4 text-sm font-semibold text-white transition-colors shrink-0"
          style={{ background: "#0E2C50" }}
        >
          Buscar
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </div>
    </form>
  );
}
