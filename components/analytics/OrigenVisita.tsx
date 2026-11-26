"use client";

import { useEffect } from "react";
import { registrarOrigen } from "@/lib/origen";

/**
 * Guarda de dónde llegó la persona (utm y dominio de origen) en cuanto abre
 * el sitio, para que el alta lo recuerde aunque navegue antes de registrarse.
 * No muestra nada. Ver lib/origen.ts.
 */
export default function OrigenVisita() {
  useEffect(() => {
    registrarOrigen();
  }, []);
  return null;
}
