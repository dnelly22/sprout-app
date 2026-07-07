/** Fires a burst of colored confetti from an element's center. No state needed. */
const COLORS = ['#F2724C', '#FBB614', '#7A5AD9', '#1F8A5B', '#2A8FD8', '#E0517A'];

export function burstConfetti(target: HTMLElement | null, count = 20): void {
  if (!target) return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const rect = target.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height * 0.4;

  for (let i = 0; i < count; i += 1) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.background = COLORS[i % COLORS.length];
    piece.style.left = `${cx}px`;
    piece.style.top = `${cy}px`;
    if (i % 2 === 0) piece.style.borderRadius = '50%';

    const angle = Math.random() * Math.PI * 2;
    const dist = 70 + Math.random() * 110;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - 50; // bias upward
    piece.style.setProperty('--dx', `${dx}px`);
    piece.style.setProperty('--dy', `${dy}px`);
    piece.style.setProperty('--rot', `${Math.random() * 720 - 360}deg`);

    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 1100);
  }
}
