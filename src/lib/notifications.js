import { requireOptionalNativeModule } from "expo";
import { Platform } from "react-native";

// Phone notifications need these native modules, which a development build or a release
// build has but Expo Go may not. We check for them first, and if any is missing (or we're
// on web) every function here quietly does nothing: the reminder is still saved and shown.
const REQUIRED_NATIVE_MODULES = [
  "ExpoApplication",
  "ExpoNotificationScheduler",
  "ExpoNotificationPermissionsModule",
  "ExpoNotificationsHandlerModule",
  ...(Platform.OS === "android"
    ? ["ExpoNotificationChannelManager", "ExpoTopicSubscriptionModule"]
    : []),
];

let cached; // undefined = not tried yet, null = unavailable

// Loaded lazily (not at import time) so a missing native module can't crash app startup.
function getNotifications() {
  if (cached !== undefined) return cached;
  cached = null;
  if (Platform.OS === "web") return cached;
  // Don't even require the library when a module is missing: requiring it would throw
  // (and show a red error screen in development) before we could catch anything useful.
  if (!REQUIRED_NATIVE_MODULES.every((name) => requireOptionalNativeModule(name))) {
    return cached;
  }
  try {
    const mod = require("expo-notifications");
    mod.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    cached = mod;
  } catch {
    cached = null;
  }
  return cached;
}

// Returns a notification id (to cancel later) or null if it couldn't be scheduled.
export async function scheduleReminder(note, timestamp) {
  const Notifications = getNotifications();
  if (!Notifications || timestamp <= Date.now()) return null;
  try {
    const perm = await Notifications.requestPermissionsAsync();
    if (!perm.granted) return null;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("reminders", {
        name: "Reminders",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: note.title || "Reminder",
        body: note.body || (note.items || []).map((i) => i.text).join(", "),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(timestamp),
        channelId: "reminders",
      },
    });
  } catch {
    return null;
  }
}

export async function cancelReminder(notificationId) {
  const Notifications = getNotifications();
  if (!Notifications || !notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {}
}
