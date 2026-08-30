# Estimador de Precios de Deptos en CABA

Herramienta que estima un rango de valor de venta orientativo para departamentos en Capital Federal.

> ⚠️ No es una tasación profesional. Es una estimación orientativa basada en datos de mercado.

## Arquitectura

| Capa | Archivo |
|---|---|
| Página pública (wizard 3 pasos) | `app/estimador/page.tsx` + `components/estimador/EstimadorWizard.tsx` |
| API REST | `app/api/estimador/route.ts` (`POST /api/estimador`) |
| Motor de cálculo (puro) | `lib/estimador/engine.ts` |
| Tipos | `lib/estimador/types.ts` |
| Config por defecto | `lib/estimador/config.default.ts` |
| Lectura de datos | `lib/estimador/data.ts` |
| Lead + admin (server actions) | `lib/actions/estimador.ts` |
| Panel de admin | `app/panel/estimador/page.tsx` + `components/panel/EstimadorAdmin.tsx` |
| Email al admin       | `sendEstimacionLead` en `lib/email.ts` |
| Esquema SQL | `supabase/migrations/estimador.sql` |

## Modelo de cálculo

```
valorBase = m²Cubiertos × precioBarrio + m²Descubiertos × precioBarrio × factorDescubierto
índiceAjuste = producto de todos los coeficientes aplicables (topeado entre topeMin y topeMax)
valorEstimado = valorBase × índiceAjuste
rango = valorEstimado ± spread(confianza)
```

## Cómo actualizar los precios por barrio

**Opción A — Panel de admin (recomendado):**
1. Iniciá sesión con `eugenio@espacioinmobiliario.com.ar`
2. Entrá a `/panel/estimador` → pestaña **Precios por barrio**
3. Editá el valor y tocá guardar en cada barrio.

**Opción B — Directo en Supabase:**
- Tabla `barrio_precios`, columna `precio_m2_usd`.

## Cómo modificar / sumar / quitar coeficientes

En `/panel/estimador` → pestaña **Coeficientes**:
- Editá cualquier coeficiente, los topes y los rangos de confianza.
- Activá/desactivá factores (checkbox **Activo**) o eliminálos (🗑).
- En factores de tipo *rango* podés agregar/quitar tramos.
- **Guardar configuración** persiste todo en `estimador_config` (no requiere deploy).

Si la tabla `estimador_config` está vacía, el sistema usa `lib/estimador/config.default.ts`.

## Setup inicial

Correr `supabase/migrations/estimador.sql` en el SQL Editor de Supabase (crea tablas, RLS y seedea los 48 barrios).

## Futuras mejoras (IA + comparables reales)

1. **Comparables reales**: integrar avisos recientes (propios + scraping/feeds de Zonaprop/Argenprop) y ajustar por superficie/estado como define el método de comparables. El motor ya está preparado (mismo `índiceAjuste`).
2. **Modelo ML**: con suficientes operaciones cerradas, entrenar un regresor (gradient boosting) y combinarlo con el modelo de reglas (ensemble).
3. **Ajuste temporal**: índice de evolución de precios por barrio (mensual) para corregir comparables antiguos.
4. **Confianza basada en densidad de comparables** por barrio/tipología.
5. **Geolocalización fina**: ajustar por sub-zona dentro del barrio (cercanía a subte, parques, corredores premium).
