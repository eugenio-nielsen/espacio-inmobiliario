import type { Metadata } from "next";
import PaginaCostos from "@/components/catedra/PaginaCostos";
import { getCostosConfig } from "@/lib/catedra/data";
import { guia } from "@/lib/catedra/guias-costos";
import { SITE } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const g = guia("vender", await getCostosConfig());
  return {
    title: g.titulo,
    description: g.descripcion,
    alternates: { canonical: `${SITE}/catedra/${g.slug}` },
    openGraph: { title: g.titulo, description: g.descripcion, url: `${SITE}/catedra/${g.slug}`, type: "website", locale: "es_AR" },
  };
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default function Page({ searchParams }: Props) {
  return <PaginaCostos foco="vender" searchParams={searchParams} />;
}
