/**
 * Helpers de rendu pour les tests de composants (Phase 2).
 * Enveloppe le composant dans les providers client dont dépendent la plupart
 * des composants Darna : i18n (`useT`) et devise (`useCurrency`).
 */
import type { ReactElement, ReactNode } from "react";
import { render, type RenderResult } from "@testing-library/react";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { CurrencyProvider } from "@/components/currency/CurrencyProvider";
import type { Locale } from "@/lib/i18n";

export function renderWithProviders(
  ui: ReactElement,
  { locale = "fr" as Locale }: { locale?: Locale } = {}
): RenderResult {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <LocaleProvider locale={locale}>
      <CurrencyProvider>{children}</CurrencyProvider>
    </LocaleProvider>
  );
  return render(ui, { wrapper: Wrapper });
}
