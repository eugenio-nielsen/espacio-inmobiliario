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
