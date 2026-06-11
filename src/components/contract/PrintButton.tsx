"use client";

import { useT } from "@/components/i18n/LocaleProvider";
import { PrinterIcon } from "@/components/icons";

export function PrintButton() {
  const fr = useT();
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-2 rounded-full bg-darna px-6 py-2.5 text-sm font-bold text-white transition hover:bg-darna-light"
    >
      <PrinterIcon width={16} height={16} />
      {fr.common.imprimer}
    </button>
  );
}
