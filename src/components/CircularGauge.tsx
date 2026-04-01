import { motion } from "framer-motion";

interface CircularGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

const CircularGauge = ({ score, size = 150, strokeWidth = 12, label = "전비 점수" }: CircularGaugeProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const getColor = () => {
    if (score >= 70) return "hsl(var(--efficiency-good))";
    if (score >= 40) return "hsl(var(--efficiency-medium))";
    return "hsl(var(--efficiency-bad))";
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--gauge-track))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold text-foreground">{score}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">/ 100</span>
        </div>
      </div>
      <span className="text-xs font-medium text-muted-foreground mt-2">{label}</span>
    </div>
  );
};

export default CircularGauge;
