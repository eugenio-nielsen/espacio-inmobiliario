"use client";

import { useState, useTransition } from "react";
import { sendInquiry } from "@/lib/actions/inquiries";

export default function InquiryForm({ propertyId }: { propertyId: string }) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await sendInquiry(propertyId, formData);
      if (result?.error) setError(result.error);
      else setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="text-center py-6 bg-green-50 rounded-xl border border-green-200">
        <div className="text-3xl mb-2">✅</div>
        <p className="font-semibold text-green-800 text-sm">¡Consulta enviada!</p>
        <p className="text-green-600 text-xs mt-1">El dueño se comunicará con vos a la brevedad.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm font-semibold text-gray-700">Enviá una consulta</p>

      <input
        name="nombre"
        type="text"
        required
        placeholder="Tu nombre *"
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        name="email"
        type="email"
        required
        placeholder="Tu email *"
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        name="telefono"
        type="tel"
        placeholder="Tu teléfono (opcional)"
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <textarea
        name="mensaje"
        required
        rows={3}
        placeholder="Tu mensaje *"
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        defaultValue="Hola, me interesa la propiedad. ¿Podemos coordinar una visita?"
      />

      {error && (
        <p className="text-red-600 text-xs">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
      >
        {isPending ? "Enviando..." : "Enviar consulta"}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Tu consulta va directamente al dueño. Sin intermediarios.
      </p>
    </form>
  );
}
