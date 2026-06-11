import { cookies } from "next/headers";
import {
  LOCALE_COOKIE,
  defaultLocale,
  getDictionary,
  isLocale,
  type Dictionary,
  type Locale,
} from "./index";

/** Locale de la requête, lue depuis le cookie — `fr` par défaut. */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return value && isLocale(value) ? value : defaultLocale;
}

/**
 * Dictionnaire de la requête, pour composants serveur et server actions.
 * Convention : `const fr = await getT();` en tête de fonction, pour que le
 * corps des composants reste inchangé (les clés gardent leurs noms français).
 */
export async function getT(): Promise<Dictionary> {
  return getDictionary(await getLocale());
}
