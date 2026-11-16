import { useCallback, useEffect, useState } from "react";

import { cancelTimerAlert, scheduleTimerAlert } from "./notifications";

export type CookTimer = {
  /** Identifies the timer: step number and which time in that step. */
  key: string;
  step: number;
  label: string;
  endsAt: number;
  alertId?: string;
};

/**
 * Countdown timers for cook mode. They keep running when you move between steps, and each schedules
 * an alert for when it ends. `now` ticks once a second while any timer exists.
 */
export function useCookTimers(recipeName: string) {
  const [timers, setTimers] = useState<CookTimer[]>([]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (timers.length === 0) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [timers.length]);

  const start = useCallback(
    async (key: string, step: number, label: string, seconds: number) => {
      const startedAt = Date.now();
      const endsAt = startedAt + seconds * 1000;
      setNow(startedAt);
      setTimers((current) => [...current.filter((timer) => timer.key !== key), { key, step, label, endsAt }]);
      const alertId = await scheduleTimerAlert(seconds, "Timer done", `${label} (${recipeName})`);
      setTimers((current) => current.map((timer) => (timer.key === key ? { ...timer, alertId } : timer)));
    },
    [recipeName],
  );

  const cancel = useCallback((timer: CookTimer) => {
    cancelTimerAlert(timer.alertId);
    setTimers((current) => current.filter((other) => other.key !== timer.key));
  }, []);

  return { timers, now, start, cancel };
}
