/*
 * Kid-session lock. When a child enters Kid Zone ("I'm ready"), we persist this
 * flag. While it's set, the app frame bounces every parent route back into Kid
 * Zone — so a crash, reload, deep link, or stray navigation can NEVER drop the
 * child onto the parent side. Only entering the correct parent PIN clears it.
 * Persisted (not just in memory) specifically so it survives a reload/crash.
 */
const KEY = 'sprout_kidlock';

export function lockKidSession() {
  try { localStorage.setItem(KEY, '1'); } catch { /* ignore */ }
}
export function unlockKidSession() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
export function isKidSessionLocked(): boolean {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
}
