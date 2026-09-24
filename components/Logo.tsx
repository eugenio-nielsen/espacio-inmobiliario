import Image from "next/image";

interface Props {
  className?: string;
}

export default function Logo({ className = "h-10 w-auto" }: Props) {
  return (
    <Image
      src="/logo.png"
      alt="Espacio Inmobiliario"
      width={180}
      height={60}
      className={className}
      // Siempre arriba del pliegue. Sin prioridad alta: es chico y no
      // tiene que competir con la foto principal de cada página.
      // (`priority` está deprecado en Next 16 y ya no hacía nada.)
      loading="eager"
    />
  );
}
