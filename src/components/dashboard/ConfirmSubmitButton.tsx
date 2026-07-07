"use client";

/**
 * Bouton de formulaire serveur avec confirmation navigateur avant soumission
 * — pour une action IRRÉVERSIBLE côté hôte (ex. suspension manuelle,
 * PAIEMENT_SUR_PLACE_ROADMAP.md §PSP8). `onSubmit` nécessite un composant
 * client ; isolé ici pour que la page appelante reste un composant serveur.
 */
export function ConfirmSubmitButton({
  action,
  confirmMessage,
  hiddenFields,
  label,
  className,
}: {
  action: (formData: FormData) => void | Promise<void>;
  confirmMessage: string;
  hiddenFields: Record<string, string>;
  label: string;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {Object.entries(hiddenFields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}
