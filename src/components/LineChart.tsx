/** Confidence-over-time chart. Always real data, never an empty element. */
export function LineChart({ data, color = 'var(--green-500)' }: { data: number[]; color?: string }) {
  const W = 300, H = 132, pad = 16, top = 14, max = 100;
  const base = H - 22;
  const pts = data.length > 1 ? data : [data[0] ?? 50, data[0] ?? 50];
  const xs = pts.map((_, i) => pad + (i * (W - pad * 2)) / (pts.length - 1));
  const ys = pts.map((v) => top + (1 - v / max) * (base - top));
  const line = xs.map((x, i) => `${x},${ys[i]}`).join(' ');
  const area = `${pad},${base} ${line} ${xs[xs.length - 1]},${base}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="confFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--green-400)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--green-400)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={pad} y1={base} x2={W - pad} y2={base} stroke="var(--border)" strokeWidth="1" />
      <polygon points={area} fill="url(#confFill)" />
      <polyline points={line} fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      {xs.map((x, i) => (
        <g key={i}>
          <circle cx={x} cy={ys[i]} r={i === xs.length - 1 ? 5.5 : 3} fill={i === xs.length - 1 ? color : 'var(--surface)'} stroke={color} strokeWidth="2.5" />
          <text x={x} y={H - 4} textAnchor="middle" fontSize="9" fontWeight="800" fill="var(--text-faint)">W{i + 1}</text>
        </g>
      ))}
    </svg>
  );
}
