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
      priority
    />
  );
}
