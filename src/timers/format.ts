/** 452 becomes "7:32", 3900 becomes "1:05:00". Rounds partial seconds up, so a timer never shows 0:00 early. */
export function formatClock(totalSeconds: number): string {
  const total = Math.max(0, Math.ceil(totalSeconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}
