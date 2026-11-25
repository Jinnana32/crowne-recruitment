export function centsFromDecimal(value: string) {
  const negative = value.trim().startsWith("-");
  const [wholeRaw, fractionRaw = ""] = value.trim().replace("-", "").split(".");
  const fraction = `${fractionRaw}00`.slice(0, 2);
  const cents = Number(wholeRaw || "0") * 100 + Number(fraction);
  return negative ? -cents : cents;
}

export function decimalFromCents(cents: number) {
  const negative = cents < 0;
  const absolute = Math.abs(cents);
  const whole = Math.floor(absolute / 100);
  const fraction = String(absolute % 100).padStart(2, "0");
  return `${negative ? "-" : ""}${whole}.${fraction}`;
}

export function formatPeso(cents: number) {
  const amount = cents / 100;
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(amount);
}
