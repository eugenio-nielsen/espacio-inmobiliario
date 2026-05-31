"use client";

import { useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function MarkReadButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function mark() {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.from("inquiries").update({ leida: true }).eq("id", id);
      router.refresh();
    });
  }

  return (
    <button
      onClick={mark}
      disabled={isPending}
      className="text-xs text-gray-400 hover:text-blue-600 border border-gray-200 rounded-lg px-3 py-1.5 shrink-0 transition-colors disabled:opacity-50"
    >
      {isPending ? "..." : "Marcar leída"}
    </button>
  );
}
