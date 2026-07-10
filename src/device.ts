/**
 * True on a desktop/laptop (real computer). False for phones and tablets —
 * iPhone / iPod / Android, and iPad (incl. iPadOS 13+ which reports as a Mac
 * but has touch). Used to show the "scan to get it on your phone" step.
 */
export function isDesktop(): boolean {
  try {
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod|Android/i.test(ua)) return false;                       // phones + Android tablets
    if (/Mobile|Tablet|Silk|Kindle|PlayBook|BB10|webOS|Windows Phone/i.test(ua)) return false;
    if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return false;      // iPadOS 13+ masquerades as Mac
    return true;                                                                  // Windows / desktop Mac / Linux
  } catch { return false; }
}
