const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  hellip: "…",
  deg: "°",
  frac12: "½",
  frac13: "⅓",
  frac14: "¼",
  frac23: "⅔",
  frac34: "¾",
};

/** Decodes HTML entities in one pass, so "&amp;quot;" becomes "&quot;" and not a quote. */
export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (match, body: string) => {
    if (body[0] === "#") {
      const code = body[1].toLowerCase() === "x" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      try {
        return String.fromCodePoint(code);
      } catch {
        return match;
      }
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? match;
  });
}

/** Decodes entities, turns non-breaking spaces into spaces, and collapses whitespace. */
export function cleanText(text: string): string {
  return decodeEntities(text).replace(/\s+/g, " ").trim();
}

const ISO_DURATION = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i;

/**
 * Turns an ISO 8601 duration such as "PT1H30M" into "1 hr 30 min".
 * Text that is not a duration is returned cleaned; a zero duration returns undefined.
 */
export function formatDuration(value: string): string | undefined {
  const match = ISO_DURATION.exec(value.trim());
  if (!match) return cleanText(value) || undefined;

  const [days, hours, minutes, seconds] = match.slice(1).map((part) => (part ? Number(part) : 0));
  const parts: string[] = [];
  if (days) parts.push(`${days} ${days === 1 ? "day" : "days"}`);
  if (hours) parts.push(`${hours} hr`);
  if (minutes) parts.push(`${minutes} min`);
  if (!parts.length && seconds) parts.push(`${seconds} sec`);
  return parts.length ? parts.join(" ") : undefined;
}

/**
 * Normalises the many shapes of recipeYield ("4", ["4", "4 servings"], 6, "Makes 12").
 * Prefers the entry that says what the number counts, drops "Makes"/"Serves", and
 * turns a bare number into "N servings".
 */
export function formatYield(value: unknown): string | undefined {
  const entries = (Array.isArray(value) ? value : [value])
    .filter((entry): entry is string | number => typeof entry === "string" || typeof entry === "number")
    .map((entry) => cleanText(String(entry)))
    .filter(Boolean);
  if (!entries.length) return undefined;

  const text = (entries.find((entry) => /[a-z]/i.test(entry)) ?? entries[0]).replace(
    /^(makes|serves|yields?|cuts into)\s*:?\s*/i,
    "",
  );
  if (!text) return undefined;
  if (!/^\d+(\.\d+)?$/.test(text)) return text;
  return `${text} ${Number(text) === 1 ? "serving" : "servings"}`;
}
