"use client";

import { useState } from "react";
import { useT } from "@/components/i18n/LocaleProvider";
import { deleteFolderAction, renameFolderAction } from "@/actions/properties";
import {
  CheckIcon,
  CloseIcon,
  FolderIcon,
  PencilIcon,
  TrashIcon,
} from "@/components/icons";

/**
 * En-tête d'un dossier de favoris dans le dashboard : nom + compteur, avec
 * renommage en place (form → renameFolderAction) et suppression (form →
 * deleteFolderAction, après confirmation). Les favoris d'un dossier supprimé
 * ne sont pas perdus : ils repassent « Sans dossier » (cf. action serveur).
 */
export function FolderHeader({
  folderId,
  name,
  count,
}: {
  folderId: string;
  name: string;
  count: number;
}) {
  const fr = useT();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <form
        action={renameFolderAction}
        onSubmit={() => setEditing(false)}
        className="flex flex-wrap items-center gap-2"
      >
        <input type="hidden" name="folderId" value={folderId} />
        <input
          name="name"
          defaultValue={name}
          autoFocus
          required
          maxLength={80}
          className="rounded-xl border border-darna/15 bg-surface px-3 py-1.5 text-sm text-body outline-none focus:border-darna/40 focus:ring-2 focus:ring-darna/15"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-xl bg-darna px-3 py-1.5 text-sm font-medium text-white transition hover:bg-darna/90"
        >
          <CheckIcon width={15} height={15} />
          {fr.dashboard.favorisEnregistrer}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          aria-label={fr.dashboard.favorisAnnuler}
          className="inline-flex items-center justify-center rounded-xl p-1.5 text-body/50 ring-1 ring-darna/15 transition hover:bg-darna/5"
        >
          <CloseIcon width={15} height={15} />
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <FolderIcon width={18} height={18} className="shrink-0 text-heading/70" />
      <h3 className="font-semibold text-body">{name}</h3>
      <span className="text-sm text-body/50">
        {fr.dashboard.favorisNbLogements(count)}
      </span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={fr.dashboard.favorisRenommer}
        title={fr.dashboard.favorisRenommer}
        className="ms-1 inline-flex items-center justify-center rounded-full p-1.5 text-body/40 transition hover:bg-darna/5 hover:text-heading"
      >
        <PencilIcon width={16} height={16} />
      </button>
      <form
        action={deleteFolderAction}
        onSubmit={(e) => {
          if (!confirm(fr.dashboard.favorisSupprimerConfirm)) e.preventDefault();
        }}
      >
        <input type="hidden" name="folderId" value={folderId} />
        <button
          type="submit"
          aria-label={fr.dashboard.favorisSupprimerDossier}
          title={fr.dashboard.favorisSupprimerDossier}
          className="inline-flex items-center justify-center rounded-full p-1.5 text-body/40 transition hover:bg-red-50 hover:text-red-500"
        >
          <TrashIcon width={16} height={16} />
        </button>
      </form>
    </div>
  );
}
