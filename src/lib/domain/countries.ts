/** Crowne ORMS destinations for this demo (D-017). Work history countries stay free-text. */
export const MIDDLE_EAST_COUNTRIES = [
  "United Arab Emirates",
  "Saudi Arabia",
  "Qatar",
  "Kuwait",
  "Bahrain",
  "Oman",
] as const;

export type MiddleEastCountry = (typeof MIDDLE_EAST_COUNTRIES)[number];

export function isMiddleEastCountry(value: string): value is MiddleEastCountry {
  return MIDDLE_EAST_COUNTRIES.some((country) => country === value);
}
