const MAX_DIMENSION = 1920;
const WEBP_QUALITY = 0.82;

/**
 * Comprime una imagen en el navegador antes de subirla:
 * redimensiona a un máximo de 1920px y convierte a WebP.
 * Una foto de celular de ~8 MB queda en ~200-400 KB sin pérdida visible.
 * Si algo falla (formato raro, navegador viejo) devuelve el archivo original.
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  try {
    // imageOrientation: "from-image" respeta la rotación EXIF de fotos de celular
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });

    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY)
    );

    // Si la compresión no achicó el archivo, conservar el original
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], name, { type: "image/webp" });
  } catch {
    return file;
  }
}
