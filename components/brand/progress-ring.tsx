type ProgressRingProps = {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
};

export function ProgressRing({
  value,
  size = 88,
  stroke = 8,
  label,
}: ProgressRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#ece9ff"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7c6cf6" />
            <stop offset="100%" stopColor="#ff6b9d" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute text-sm font-extrabold text-qd-ink">
        {label ?? `${Math.round(value)}%`}
      </span>
    </div>
  );
}
