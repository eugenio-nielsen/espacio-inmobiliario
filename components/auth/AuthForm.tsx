"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { flushSync } from "react-dom";
import { signIn, signUp } from "@/lib/actions/auth";
import ReenviarMail from "./ReenviarMail";
import RevisaTuMail from "./RevisaTuMail";

interface Props {
  mode: "login" | "registro";
  /** Ruta interna a la que volver después de ingresar (la valida el servidor). */
  volver?: string;
  /** Título y bajada de la página: se reemplazan por el aviso "revisá tu mail" cuando la cuenta queda por confirmar. */
  encabezado?: React.ReactNode;
}

export default function AuthForm({ mode, volver, encabezado }: Props) {
  const [error, setError] = useState<string | null>(null);
  /** Ingreso: el email de una cuenta que todavía no confirmó, para ofrecer reenviarle el mail. */
  const [sinConfirmar, setSinConfirmar] = useState<string | null>(null);
  /** Registro: el email de la cuenta recién creada, que falta confirmar. */
  const [pendiente, setPendiente] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSinConfirmar(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      if (mode === "login") {
        const result = await signIn(formData);
        if (result?.error) setError(result.error);
        if (result?.sinConfirmar) setSinConfirmar(String(formData.get("email") ?? "").trim());
        return;
      }
      const result = await signUp(formData);
      if (result && "error" in result) setError(result.error);
      else if (result && "pendiente" in result) setPendiente(result.email);
    });
  }

  function corregirEmail() {
    // El formulario vuelve con lo que ya había cargado: el foco va al email
    flushSync(() => setPendiente(null));
    formRef.current?.querySelector<HTMLInputElement>('input[name="email"]')?.focus();
  }

  return (
    <>
      {pendiente ? (
        <RevisaTuMail email={pendiente} pagina="/auth/registro" variante="tarjeta" onCorregir={corregirEmail} />
      ) : (
        encabezado
      )}
      {/* Oculto, no desmontado: si se equivocó de email no pierde lo que escribió */}
      <form ref={formRef} onSubmit={handleSubmit} hidden={!!pendiente} className="space-y-4">
        {volver && <input type="hidden" name="volver" value={volver} />}
        {mode === "registro" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo *
              </label>
              <input
                name="nombre"
                type="text"
                required
                autoComplete="name"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Juan García"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono / WhatsApp *
              </label>
              <input
                name="telefono"
                type="tel"
                required
                autoComplete="tel"
                inputMode="tel"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+54 9 11 1234-5678"
              />
              <p className="text-xs text-gray-500 mt-1.5">
                Es el número al que te van a escribir los interesados. Incluí el código de área.
              </p>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="tu@email.com"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Contraseña *
            </label>
            {mode === "login" && (
              <Link href="/auth/recuperar" className="text-xs text-blue-600 hover:underline">
                ¿La olvidaste?
              </Link>
            )}
          </div>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {sinConfirmar && <ReenviarMail email={sinConfirmar} origen="login" variante="tarjeta" />}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
        >
          {isPending
            ? "Procesando..."
            : mode === "login"
            ? "Iniciar sesión"
            : "Crear cuenta gratis"}
        </button>
      </form>
    </>
  );
}
