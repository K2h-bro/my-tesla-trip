import { motion } from "framer-motion";
import { Route, Zap, CreditCard, RotateCcw, TrendingUp, TrendingDown } from "lucide-react";
import CircularGauge from "./CircularGauge";
import { useWeeklyReport } from "@/hooks/useWeeklyReport";
import { Skeleton } from "@/components/ui/skeleton";
import type { AppSettings } from "@/hooks/useSettings";

interface ReportTabProps {
  settings: AppSettings;
}

const getScoreComment = (score: number) => {
  if (score >= 80) return "훌륭한 주행이에요! 🎉";
  if (score >= 60) return "좋은 효율을 유지하고 있어요 👍";
  if (score >= 40) return "조금 더 개선할 수 있어요 💪";
  return "효율을 높여보세요 🔋";
};

const ReportTab = ({ settings }: Partial<ReportTabProps> & {} = {}) => {
  const batteryCapacity = settings?.batteryCapacity ?? 63;
  const electricityRate = settings?.electricityRate ?? 320;
  const { data, isLoading, isError } = useWeeklyReport(batteryCapacity, electricityRate);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-4">
        <Skeleton className="h-5 w-48 rounded-lg" />
        <Skeleton className="h-52 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  const statsData = [
    { label: "주행거리", value: `${data.totalKm}`, unit: "km", icon: Route, delta: "+12.3", up: true },
    { label: "평균 전비", value: data.avgEfficiency ? `${data.avgEfficiency}` : "N/A", unit: "km/kWh", icon: Zap, delta: "+0.4", up: true },
    { label: "충전비용", value: `₩${data.chargeCost.toLocaleString()}`, unit: "", icon: CreditCard, delta: "-₩800", up: false },
    { label: "회생제동", value: `${data.regenCount}`, unit: "회", icon: RotateCcw, delta: "+3", up: true },
  ];

  const maxVal = Math.max(...data.dailyEfficiency.map((d) => d.value), 1);

  return (
    <div className="space-y-6 pb-4">
      <p className="text-sm text-muted-foreground">
        {data.periodStart && data.periodEnd
          ? `${data.periodStart} – ${data.periodEnd}`
          : "데이터 없음"}
      </p>

      {/* Gauge + Comment */}
      <motion.div
        className="bg-card rounded-2xl p-6 flex flex-col items-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <CircularGauge score={data.score} />
        <p className="text-sm font-medium text-foreground mt-3">{getScoreComment(data.score)}</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {statsData.map((stat, i) => {
          const Icon = stat.icon;
          const isUp = stat.up;
          return (
            <motion.div
              key={stat.label}
              className="bg-card rounded-2xl p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className="text-primary" />
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
              <p className="text-2xl font-extrabold text-foreground leading-tight">
                {stat.value}
                {stat.unit && <span className="text-xs font-medium text-muted-foreground ml-1">{stat.unit}</span>}
              </p>
              <div className={`flex items-center gap-1 mt-1.5 text-[11px] font-medium ${isUp ? "text-primary" : "text-destructive"}`}>
                {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>{stat.delta} 지난주</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Daily Efficiency Chart */}
      <motion.div
        className="bg-card rounded-2xl p-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <h2 className="text-sm font-bold text-foreground mb-4">요일별 전비</h2>
        <div className="space-y-3">
          {data.dailyEfficiency.map((item) => {
            const pct = (item.value / (maxVal + 1)) * 100;
            const isGood = item.value >= 6.5;
            const isBad = item.value > 0 && item.value < 5.5;
            return (
              <div key={item.day} className="flex items-center gap-3">
                <span className="text-xs font-semibold text-muted-foreground w-5 text-center">{item.day}</span>
                <div className="flex-1 h-7 bg-secondary rounded-lg overflow-hidden">
                  <motion.div
                    className={`h-full rounded-lg ${
                      item.value === 0
                        ? "bg-secondary"
                        : isBad
                        ? "bg-destructive"
                        : isGood
                        ? "bg-primary"
                        : "bg-efficiency-medium"
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  />
                </div>
                <span className="text-xs font-bold text-foreground w-10 text-right">
                  {item.value > 0 ? item.value : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default ReportTab;
