/** Pick the Arabic or English half of a bilingual template field, based on
 * the current UI locale — content picked for the end user (dynamic forms,
 * task review, request detail), never for the admin builder itself, which
 * always shows both languages side by side for editing. */
export function pickLocalized(ar: string, en: string, locale: string): string {
  return locale === "en" ? en || ar : ar || en;
}
