"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/components/i18n/LocaleProvider";
import { CheckIcon, LinkIcon, ShareIcon, WhatsAppIcon } from "@/components/icons";
import { trackEvent } from "@/actions/track-event";

/**
 * Bouton « Partager » d'une fiche annonce : partage natif (navigator.share,
 * mobile) quand disponible, sinon menu déroulant Copier le lien / WhatsApp —
 * cible prioritaire diaspora qui partage en groupe familial WhatsApp.
 */
export function ShareButton({
  title,
  url,
  className = "",
}: {
  title: string;
  url: string;
  className?: string;
}) {
  const fr = useT();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Instrumentation produit (INSTRUMENTATION_ROADMAP.md §IN2) — best-effort,
  // jamais awaité : ne doit ni bloquer le partage ni retarder une navigation
  // (lien WhatsApp). Une perte occasionnelle (ex. navigation immédiate) est
  // acceptée, comme pour tout événement produit.
  function trackShare(channel: "native" | "copy" | "whatsapp") {
    void trackEvent({ event: "SHARE_CLICKED", metadata: { channel } });
  }

  async function handleClick() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        trackShare("native");
      } catch {
        // Annulation utilisateur (AbortError) — rien à faire, pas de mesure.
      }
      return;
    }
    setOpen((o) => !o);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    trackShare("copy");
    setCopied(true);
    setOpen(false);
  }

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
    `${fr.property.partagerMessage(title)} ${url}`
  )}`;

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-body/70 ring-1 ring-darna/15 transition hover:bg-darna/5"
      >
        <ShareIcon width={16} height={16} />
        {fr.property.partager}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute start-0 top-full z-[1000] mt-2 w-56 overflow-hidden rounded-2xl bg-surface py-1.5 text-start shadow-xl ring-1 ring-darna/10"
        >
          <button
            type="button"
            role="menuitem"
            onClick={copyLink}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-body/80 transition hover:bg-cream"
          >
            <LinkIcon width={16} height={16} />
            {fr.property.copierLien}
          </button>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            onClick={() => {
              trackShare("whatsapp");
              setOpen(false);
            }}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-body/80 transition hover:bg-cream"
          >
            <WhatsAppIcon width={16} height={16} />
            {fr.property.whatsapp}
          </a>
        </div>
      ) : null}

      {copied ? (
        <span
          role="status"
          className="absolute start-0 top-full mt-2 whitespace-nowrap rounded-full bg-darna px-3 py-1 text-xs font-medium text-white shadow"
        >
          <CheckIcon width={12} height={12} className="me-1 -mt-0.5 inline" />
          {fr.property.lienCopie}
        </span>
      ) : null}
    </div>
  );
}
