export default function BarChart({ data = [], height = 180, barWidth = 40, gap = 16 }) {
  const max = Math.max(1, ...data.map(d => d.value || 0));
  const width = data.length * (barWidth + gap) + gap;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label="Bar chart">
      <line x1="0" y1={height-20} x2={width} y2={height-20} stroke="#334155" strokeWidth="2" />
      {data.map((d, i) => {
        const h = Math.max(1, (d.value / max) * (height - 40));
        const x = gap + i * (barWidth + gap);
        const y = height - 20 - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={h} rx="6" fill="#10b981" />
            <text x={x + barWidth/2} y={height - 6} textAnchor="middle" fontSize="10" fill="#94a3b8">{d.label}</text>
            <text x={x + barWidth/2} y={y - 4} textAnchor="middle" fontSize="11" fill="#e5e7eb">{Math.round(d.value)}</text>
          </g>
        );
      })}
    </svg>
  );
}
