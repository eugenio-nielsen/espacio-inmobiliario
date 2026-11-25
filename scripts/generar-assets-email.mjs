// Imágenes de los mails: los clientes de correo no muestran SVG, así que la
// firma (el mismo trazo de components/FirmaTrazo.tsx) y el logo se sirven
// como PNG desde /public/email. Se corre a mano si cambia alguno:
//   node scripts/generar-assets-email.mjs
import sharp from "sharp";

const TRAZO = "M12 60 C 78 26, 168 18, 246 34 C 300 45, 348 58, 396 49 C 436 41, 454 24, 441 14 C 430 5, 412 15, 419 31 C 427 49, 460 54, 508 39";
const firma = (color) => Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 70" width="1040" height="140">
     <path d="${TRAZO}" transform="translate(0,2)" fill="none" stroke="${color}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
   </svg>`);

await sharp(firma("#A4894E")).png().toFile("public/email/firma.png");       // sobre crema/blanco
await sharp(firma("#CBB585")).png().toFile("public/email/firma-oro.png");   // sobre navy
// Logo a 2x del tamaño en pantalla (220 px). El original tiene un fondo crema con
// algo de ruido: lo pasamos a un color plano (el mismo del encabezado del mail)
// para que no se vea el borde de la imagen.
const { data, info } = await sharp("public/logo.png").resize({ width: 440 }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const BG = [248, 249, 244];
for (let i = 0; i < data.length; i += 3) {
  const claro = Math.min(data[i], data[i + 1], data[i + 2]);
  if (claro >= 215) {
    const t = Math.min(1, (claro - 215) / 20); // 0 = conserva el pixel, 1 = fondo plano
    for (let c = 0; c < 3; c++) data[i + c] = Math.round(data[i + c] * (1 - t) + BG[c] * t);
  }
}
await sharp(data, { raw: { width: info.width, height: info.height, channels: 3 } }).toColourspace("srgb").png({ palette: true, quality: 92, compressionLevel: 9 }).toFile("public/email/logo.png");
console.log("listo");
