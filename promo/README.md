# Videos promocionales de propiedades

Genera un video vertical (1080x1920, 30 s, MP4) de una propiedad para Instagram, TikTok o Stories, a partir de su ficha. Es una herramienta aparte del sitio: no toca el código ni los datos publicados.

Cada video tiene: apertura con la portada, una escena por foto con fichas con ícono, el mapa con lo que hay cerca, el precio con el sello de dueño directo y el cierre con el logo. Durante casi todo el video queda fija una barra con los datos de la propiedad (ambientes, dormitorios, baños, m², piso).

## Lo que hace falta

- Node 22 o más nuevo y Chrome (o Edge) instalado.
- Una vez por PC: `npm install` dentro de `promo/`.
- Para `nuevo`: el archivo `../.env.local` del sitio (solo usa la clave pública, en modo lectura).

## Hacer el video de una propiedad

Desde la carpeta `promo/`. El `<id>` son los 8 caracteres del final del link de la ficha (`.../departamento/27b2ceb9`); también se puede pegar el link entero.

```bash
npm run nuevo -- <id>                      # arma el borrador del guion en guiones/<id>.json
npm run video -- <id> --cuadros 3,8,13,18,23,28   # cuadros sueltos en salida/, para revisar sin esperar
npm run video -- <id>                      # el video completo en salida/<id>.mp4
```

El borrador completa lo que sale de la ficha: fotos, barrio, la barra de datos, la ubicación y el precio. **Lo demás se completa a mano** leyendo la descripción y mirando las fotos:

1. Qué foto va en cada escena (`foto`, empieza en 0).
2. Las fichas con ícono de cada escena (`chips`), por ejemplo "Aire acondicionado".
3. Qué hay cerca (`cerca`), por ejemplo "1 cuadra de Av. Corrientes".
4. Que los textos sean verdad: nada que no diga la ficha.

Después de tocar el guion, volver a correr `--cuadros` y mirar. Cambiar una frase y regenerar lleva menos de un minuto. [`guiones/27b2ceb9.json`](guiones/27b2ceb9.json) es un ejemplo completo.

## El guion

| Campo | Qué es |
|---|---|
| `fotos` | URLs de las fotos de la ficha, en orden. Las demás secciones las eligen por posición. |
| `pie` | La barra fija: hasta 5 datos `{ id, icono, valor, unidad?, rotulo }`. Los números cuentan al aparecer. |
| `apertura` | Primera escena: `foto`, `rotulo`, `titulo` (el barrio), `bajada`, `chips`. |
| `escenas` | Una por foto: `foto`, `titulo`, `bajada`, `chips`. `resalta` enciende un dato de la barra (por su `id`) mientras dura la escena. |
| `mapa` | `lat`, `lng`, `titulo`, `bajada`, `radio` (m de la zona dibujada) y `cerca`. Si se borra, el video sigue sin esa escena. |
| `precio` | `foto` (fondo desenfocado), `lugar`, `moneda`, `valor`, `notas`. |
| `cierre` | `titulo`, `rotulo`, `boton`. |
| `duracion` | Segundos que dura el video entero (30 por defecto en los guiones nuevos; sin este campo, 20). Todos los tramos se estiran en proporción. |
| `duraciones` | Opcional. Fija a mano los segundos de `apertura`, `mapa`, `precio` o `cierre`; las escenas se reparten el resto. |

Los íconos son [Lucide](https://lucide.dev/icons) (los mismos del sitio): se escribe el nombre, por ejemplo `bed-double`, `sun`, `train-front`.

## Cosas para saber

- **Fotos verticales y apaisadas:** las verticales llenan el cuadro; las apaisadas van enteras sobre la misma foto desenfocada.
- **El mapa muestra la zona, no el punto exacto:** un círculo de `radio` metros alrededor de la propiedad. El sitio muestra el pin exacto en la ficha; en un video que circula por redes se eligió no hacerlo.
- **Mapa de OpenStreetMap:** los mismos tiles que usa el sitio. Se guardan en `cache/` y cada video pide unos 60; la atribución "© OpenStreetMap contributors" ya sale en el video, no sacarla.
- **Sin audio.** La música se suma al publicar, desde la app de la red social.
- **Zona segura:** Instagram y TikTok tapan con su interfaz la parte de arriba, la de abajo y el costado derecho. Las posiciones están en las constantes del principio de `video.js` (`MARCA_Y`, `TITULO_Y`, `PIE`, `MAPA`); si en un celular algo queda tapado, se ajusta ahí.
- **Colores y tipografías** son los del sitio (Playfair Display y Outfit, navy y dorado).

## Cómo funciona

- `nuevo.mjs` lee la propiedad de la base y escribe el borrador del guion.
- `render.mjs` levanta un servidor local y abre `video.html` en Chrome sin ventana.
- `video.js` dibuja cada cuadro en un `<canvas>` según el segundo en que está, y lo codifica a H.264 con WebCodecs; `mp4-muxer` arma el MP4. No necesita ffmpeg.

## Videos de herramientas (tasador, calculadoras…)

Además de las propiedades, `promo/` arma videos de 30 s que cuentan cómo se usa una herramienta del sitio, con subtítulos. Un guion con `"tipo": "herramienta"` usa su propio motor, `herramienta.js`; el render es el mismo:

```bash
npm run video -- tasador --cuadros 1,7,12.5,17,21.5,25.5,28   # cuadros sueltos para revisar
npm run video -- tasador                                       # salida/tasador.mp4
```

El guion del tasador es [`guiones/tasador.json`](guiones/tasador.json):

| Campo | Qué es |
|---|---|
| `tiempos` | Cuándo empieza y termina cada tramo (gancho, los cuatro pasos, emisión, informe, cierre), pensado para 30 s. Con otra `duracion`, se estiran en proporción. |
| `datos` | Lo que se "carga" en pantalla (barrio, superficie, ambientes, piso…) y el resultado del ejemplo. |
| `subtitulos` | Cada frase con su `ini` y `fin` en segundos. Las palabras se encienden en dorado de a una. |
| `cierre` | Título, botón y aviso final. |

**Los números del ejemplo salen del motor real del tasador**, no se inventan: si se cambian los datos de `datos`, hay que recalcular `valor`, `rangoMin`, `rangoMax` y `factores` con el motor (`lib/estimador/engine.ts`) para que el video siga diciendo la verdad. El video marca el resultado como "ejemplo" y el cierre aclara que es orientativo.

Para otra herramienta (calculadora de costos, RPI…), se copia `tasador.json` y se cambian los pasos: los textos de cada paso están en `herramienta.js` (`paso1` a `paso4`).

## Explainer de la home (1920x1080, con voz en off)

Video de ~75 s que recorre el sitio (registro, publicar, propiedades, tasador, panel, perfil, herramientas). Vive en `explainer/`:

```bash
node explainer/generar-vo.mjs     # voz en off con ElevenLabs (voz Valeria) → explainer/vo/
node explainer/capturar.mjs       # capturas del sitio en localhost:3000 → explainer/capturas/
node explainer/render.mjs         # salida/explainer.mp4   (--cuadros 5,20,40 para revisar cuadros sueltos)
```

- Los textos de la voz están en `explainer/guion.json`; qué captura y qué zoom va en cada escena, en `explainer/planos.json`. La duración de cada escena sale del audio.
- Necesita `ELEVEN_LABS_API_KEY` en `../.env.local` (solo local) y el sitio corriendo (`npm run dev`).
- Las escenas con sesión usan la cuenta de prueba de `explainer/.demo.json` (gitignorada, ver `demo.mjs` y `sembrar.mjs`). **No se borra**: se reutiliza para cualquier prueba con sesión.
- Las capturas difuminan el nombre de quien publica una ficha real.

## Video "La familia que vendió sin pagar comisión" (9:16, Higgsfield + ElevenLabs)

Historia ficticia de ~78 s para Reels, TikTok y Stories. El guion, los planos y los costos están en [`higgsfield/guion-familia.md`](higgsfield/guion-familia.md).

```bash
node higgsfield/generar-vo.mjs        # voz de Laura (Malena Tango, colección "Claude" de ElevenLabs) → higgsfield/vo/
node higgsfield/capturar-movil.mjs    # el sitio en un celular (usa la cuenta de prueba de explainer/.demo.json)
node higgsfield/render.mjs            # salida/familia.mp4   (--cuadros 5,40 para ver cuadros; --audio para el audio solo)
```

- Los 8 clips (`higgsfield/clips/c1..c8.mp4`) se generan con **Wan 3.0, 720p, 9:16, sin audio**, con imágenes de referencia de los personajes para que se vean iguales (`higgsfield/refs/`). Cuestan ~15,75 créditos cada uno de 9 s; el servicio admite pocas generaciones en simultáneo.
- `higgsfield/planos.json` dice qué clip va con cada frase; `render.mjs` mide la voz y reparte los tiempos solo.
- La **música es sintética** (piano y cuerdas suaves, compuesta en `montaje.js`): sin licencias de terceros. Baja sola cuando habla Laura.
- El cierre lleva el aviso "Historia recreada con inteligencia artificial". No se presenta como testimonio real.
