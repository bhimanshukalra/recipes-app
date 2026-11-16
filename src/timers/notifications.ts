import * as Notifications from "expo-notifications";

// Show a timer's alert even while the app is open; without a handler iOS hides foreground notifications.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Schedules an alert for when a timer ends, so it still rings with the phone locked or the app closed.
 * Asks for permission the first time. Returns undefined when notifications are not allowed, and the
 * timer then only counts down on screen.
 */
export async function scheduleTimerAlert(seconds: number, title: string, body: string): Promise<string | undefined> {
  try {
    let permission = await Notifications.getPermissionsAsync();
    if (!permission.granted && permission.canAskAgain) {
      permission = await Notifications.requestPermissionsAsync();
    }
    if (!permission.granted) return undefined;
    return await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(1, Math.round(seconds)) },
    });
  } catch {
    return undefined;
  }
}

export async function cancelTimerAlert(id: string | undefined): Promise<void> {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // Already delivered or cancelled.
  }
}
