/** A time mentioned in a step, such as "simmer for 10 minutes". */
export type StepDuration = {
  /** The text as written, shown on the timer chip: "10 minutes", "1 hour 30 minutes". */
  label: string;
  /** How long to count down. For a range ("25-30 minutes") this is the shorter time. */
  seconds: number;
};

const WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, forty: 40, "forty-five": 45, sixty: 60,
};
const FRACTIONS: Record<string, number> = { "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3, "⅛": 0.125 };
const UNIT_SECONDS: Record<string, number> = { h: 3600, m: 60, s: 1 };

const NUMBER = String.raw`(?:\d+(?:\.\d+)?\s?[½¼¾⅓⅔⅛]?|[½¼¾⅓⅔⅛]|\b(?:an?|one|two|three|four|five|six|seven|eight|nine|ten|twelve|fifteen|twenty|thirty|forty-five|forty|sixty)\b)`;
const UNIT = String.raw`(hours?|hrs?|minutes?|mins?|seconds?|secs?)\b`;
const PATTERN = new RegExp(String.raw`(${NUMBER})(?:\s*(?:-|–|to)\s*(${NUMBER}))?\s*${UNIT}`, "gi");

function toNumber(text: string): number {
  const value = text.trim().toLowerCase();
  if (value in WORDS) return WORDS[value];
  const fraction = value.match(/([½¼¾⅓⅔⅛])$/);
  const whole = parseFloat(value);
  return (Number.isNaN(whole) ? 0 : whole) + (fraction ? FRACTIONS[fraction[1]] : 0);
}

type Match = { start: number; end: number; unit: "h" | "m" | "s"; seconds: number };

/** Finds the times in a step ("10 minutes", "1½ hours", "1 hour 30 minutes", "25-30 minutes"). */
export function findDurations(text: string): StepDuration[] {
  const matches: Match[] = [];
  for (const found of text.matchAll(PATTERN)) {
    const unit = found[3].toLowerCase()[0] as "h" | "m" | "s";
    // A range ("25-30 minutes") counts down the shorter time.
    const amount = toNumber(found[1]);
    if (amount <= 0) continue;
    matches.push({
      start: found.index,
      end: found.index + found[0].length,
      unit,
      seconds: Math.round(amount * UNIT_SECONDS[unit]),
    });
  }

  // "1 hour 30 minutes" is one timer, not two.
  const merged: { start: number; end: number; seconds: number }[] = [];
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];
    if (
      current.unit === "h" &&
      next?.unit === "m" &&
      /^\s*(?:,|and|,\s*and)?\s*$/i.test(text.slice(current.end, next.start))
    ) {
      merged.push({ start: current.start, end: next.end, seconds: current.seconds + next.seconds });
      i++;
    } else {
      merged.push(current);
    }
  }

  return merged
    .filter((item) => item.seconds >= 5)
    .map((item) => ({ label: text.slice(item.start, item.end).trim(), seconds: item.seconds }));
}
