"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, Globe, Mail, MapPin, MessageCircle, Search, Users } from "lucide-react";
import { RUBROS, rubroPorValor, type Profesional } from "@/lib/catedra/rubros";

/**
 * La red de profesionales, filtrable por rubro y por texto. Filas con
 * filetes (como el índice del blog), el contacto a la derecha: WhatsApp,
 * email y web, lo que haya cargado cada uno.
 */
export default function RedProfesionales({ profesionales }: { profesionales: Profesional[] }) {
  const [rubro, setRubro] = useState<string>("todos");
  const [q, setQ] = useState("");

  const cuenta = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of profesionales) m.set(p.rubro, (m.get(p.rubro) ?? 0) + 1);
    return m;
  }, [profesionales]);

  const visibles = useMemo(() => {
    const t = q.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    return profesionales.filter(p => {
      if (rubro !== "todos" && p.rubro !== rubro) return false;
      if (!t) return true;
      const texto = `${p.nombre} ${p.zona} ${p.descripcion ?? ""} ${p.matricula ?? ""}`
        .toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      return texto.includes(t);
    });
  }, [profesionales, rubro, q]);

  return (
    <div className="cat-in cat-red">
      <aside className="cat-filtros">
        <label className="cat-buscar">
          <Search size={16} strokeWidth={1.7} />
          <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Nombre, zona o especialidad" aria-label="Buscar en la red" />
        </label>
        <div>
          <p className="cat-rotulo">Rubro</p>
          <ul className="cat-filtro-lista">
            <li>
              <button type="button" aria-pressed={rubro === "todos"} onClick={() => setRubro("todos")}>
                <Users size={15} strokeWidth={1.5} /> <span>Todos</span> <small>{profesionales.length}</small>
              </button>
            </li>
            {RUBROS.filter(r => cuenta.get(r.valor)).map(({ valor, plural, icon: Icon }) => (
              <li key={valor}>
                <button type="button" aria-pressed={rubro === valor} onClick={() => setRubro(valor)}>
                  <Icon size={15} strokeWidth={1.5} /> <span>{plural}</span> <small>{cuenta.get(valor)}</small>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div>
        {visibles.length === 0 ? (
          <p className="cat-vacio">
            {profesionales.length === 0
              ? "La red se está armando: pronto vas a encontrar acá a los primeros profesionales."
              : "No hay profesionales que coincidan con la búsqueda."}
          </p>
        ) : (
          <ul className="cat-fichas">
            {visibles.map(p => {
              const r = rubroPorValor(p.rubro);
              const Icon = r?.icon;
              const wa = p.telefono?.replace(/\D/g, "");
              return (
                <li key={p.id} className="cat-ficha">
                  <div>
                    <span className="cat-ficha-rubro">
                      {Icon && <Icon size={13} strokeWidth={1.6} />} {r?.nombre}
                      {p.recomendado && <span className="cat-recomendado"><BadgeCheck size={11} strokeWidth={2} /> Recomendado por Espacio</span>}
                    </span>
                    <h3>{p.nombre}</h3>
                    <div className="cat-ficha-datos">
                      <span><MapPin size={12} strokeWidth={1.8} style={{ display: "inline", verticalAlign: "-1px", color: "var(--gold-600)" }} /> {p.zona}</span>
                      {p.matricula && <span>Matrícula: {p.matricula}</span>}
                    </div>
                    {p.descripcion && <p>{p.descripcion}</p>}
                  </div>
                  <div className="cat-ficha-contacto">
                    {wa && (
                      <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener">
                        <MessageCircle size={14} strokeWidth={1.8} /> WhatsApp
                      </a>
                    )}
                    {p.email && <a href={`mailto:${p.email}`}><Mail size={14} strokeWidth={1.8} /> {p.email}</a>}
                    {p.web && (
                      <a href={p.web} target="_blank" rel="noopener nofollow">
                        <Globe size={14} strokeWidth={1.8} /> {p.web.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
