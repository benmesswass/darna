"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/actions/notifications";
import { useT } from "@/components/i18n/LocaleProvider";
import { notificationMessage, type NotificationItem } from "@/lib/notification-text";
import { formatDateShortFr } from "@/lib/format";
import { BellIcon } from "@/components/icons";

const POLL_MS = 30_000;
const ENDPOINT = "/api/notifications";

/**
 * Centre de notifications in-app (F9) : cloche + pastille de non-lues, panneau
 * déroulant listant les réservations confirmées/annulées, avis reçus et
 * annonces bientôt expirées. Distinct de MessagesNotifier (messagerie) — les
 * deux sondent indépendamment, chacun sa pastille.
 */
export function NotificationBell() {
  const fr = useT();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(ENDPOINT, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { count: number; items: NotificationItem[] };
      setCount(data.count);
      setItems(data.items);
    } catch {
      // Réseau indisponible : on réessaiera à la prochaine sonde.
    }
  }, []);

  useEffect(() => {
    poll();
    const id = window.setInterval(poll, POLL_MS);
    const onFocus = () => {
      if (document.visibilityState === "visible") poll();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [poll]);

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

  function handleItemClick(n: NotificationItem) {
    setOpen(false);
    if (!n.readAt) {
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, readAt: new Date().toISOString() } : i)));
      setCount((c) => Math.max(0, c - 1));
      startTransition(() => {
        markNotificationReadAction(n.id);
      });
    }
    if (n.href) router.push(n.href);
  }

  function handleMarkAllRead() {
    setItems((prev) => prev.map((i) => ({ ...i, readAt: i.readAt ?? new Date().toISOString() })));
    setCount(0);
    startTransition(() => {
      markAllNotificationsReadAction();
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={fr.notifications.titre}
        aria-expanded={open}
        aria-haspopup="menu"
        className="relative inline-flex items-center justify-center rounded-full p-2 text-white/90 transition hover:bg-white/10 hover:text-white"
      >
        <BellIcon width={20} height={20} />
        {count > 0 ? (
          <span className="absolute -end-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-darna">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute end-0 top-full z-[1200] mt-2 w-80 overflow-hidden rounded-2xl bg-surface text-start shadow-xl ring-1 ring-darna/10"
        >
          <div className="flex items-center justify-between border-b border-ink/10 px-4 py-2.5">
            <p className="text-sm font-bold text-heading">{fr.notifications.titre}</p>
            {count > 0 ? (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-heading/70 hover:text-heading hover:underline"
              >
                {fr.notifications.toutMarquerLu}
              </button>
            ) : null}
          </div>

          <div className="max-h-96 overflow-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-body/50">
                {fr.notifications.aucune}
              </p>
            ) : (
              <ul>
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleItemClick(n)}
                      className={`flex w-full flex-col gap-0.5 px-4 py-2.5 text-start text-sm transition hover:bg-cream ${
                        n.readAt ? "text-body/60" : "font-medium text-body"
                      }`}
                    >
                      <span className="flex items-start gap-2">
                        {!n.readAt ? (
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-darna" />
                        ) : (
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0" />
                        )}
                        <span>{notificationMessage(fr, n)}</span>
                      </span>
                      <span className="ps-3.5 text-[11px] text-body/40">
                        {formatDateShortFr(new Date(n.createdAt))}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
