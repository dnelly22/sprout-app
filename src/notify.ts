import { LocalNotifications } from '@capacitor/local-notifications';
import { isNativeApp } from './native';

/*
 * Daily practice reminder — a single LOCAL notification scheduled on-device.
 * Nothing leaves the phone: no push tokens, no server, no tracking. On the web
 * build this is a stored preference only (no scheduled notifications).
 */

const REMINDER_ID = 1001;
const REMINDER_HOUR = 17; // 5:00 pm — after school, before dinner

/** Ask permission and schedule the daily reminder. Returns true if scheduled. */
export async function enableDailyReminder(kidName?: string): Promise<boolean> {
  if (!isNativeApp()) return true; // web: preference only
  try {
    const perm = await LocalNotifications.requestPermissions();
    if (perm.display !== 'granted') return false;
    await LocalNotifications.schedule({
      notifications: [{
        id: REMINDER_ID,
        title: 'A few minutes of practice 🌱',
        body: kidName ? `${kidName}'s streak is waiting — one quick game keeps it growing.` : 'One quick game keeps the streak growing.',
        schedule: { on: { hour: REMINDER_HOUR, minute: 0 }, allowWhileIdle: true },
      }],
    });
    return true;
  } catch {
    return false;
  }
}

/** Cancel the daily reminder (no-op on web). */
export async function disableDailyReminder(): Promise<void> {
  if (!isNativeApp()) return;
  try { await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] }); } catch { /* ignore */ }
}
