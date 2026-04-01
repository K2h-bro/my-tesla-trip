import { motion } from "framer-motion";
import { Route, Zap, CreditCard, RotateCcw, Lightbulb, ThermometerSun } from "lucide-react";
import CircularGauge from "./CircularGauge";
import { useWeeklyReport } from "@/hooks/useWeeklyReport";
import { Skeleton } from "@/components/ui/skeleton";
import type { AppSettings } from "@/hooks/useSettings";

const tips = [
  {
    icon: ThermometerSun,
    title: "프리컨디셔닝 활용하기",
    description: "출발 10분 전 에어컨을 켜면 배터리 효율이 12% 향상됩니다.",
    savings: "₩3,200/주",
  },
  {
    icon: Lightbulb,
    title: "회생제동 최대로 설정",
    description: "회생제동 강도를 '표준'으로 설정하면 에너지 회수율이 높아집니다.",
    savings: "₩2,800/주",
  },
];

interface ReportTabProps {
  settings: AppSettings;
}

const ReportTab = ({ settings }: ReportTabProps) => {
  const { data, isLoading, isError } = useWeeklyReport(settings.batteryCapacity, settings.electricityRate);

  if (isLoading) {
    return (
      <div className="space-y-5 pb-4">
        <div>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-48 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
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
    { label: "주행거리", value: `${data.totalKm} km`, icon: Route },
    { label: "평균 전비", value: data.avgEfficiency ? `${data.avgEfficiency} km/kWh` : "N/A", icon: Zap },
    { label: "충전비용", value: `₩${data.chargeCost.toLocaleString()}`, icon: CreditCard },
    { label: "회생제동", value: `${data.regenCount}회`, icon: RotateCcw },
  ];

  const maxVal = Math.max(...data.dailyEfficiency.map((d) => d.value), 1);

  return (
    <div className="space-y-5 pb-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">주간 리포트</h1>
        <p className="text-sm text-muted-foreground">
          {data.periodStart && data.periodEnd
            ? `${data.periodStart} – ${data.periodEnd}`
            : "데이터 없음"}
        </p>
      </div>

      <motion.div
        className="bg-card rounded-2xl p-6 flex justify-center shadow-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <CircularGauge score={data.score} />
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        {statsData.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              className="bg-card rounded-2xl p-4 shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
            >
              <Icon size={18} className="text-primary mb-2" />
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-bold text-foreground mt-0.5">{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        className="bg-card rounded-2xl p-5 shadow-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <h2 className="text-sm font-semibold text-foreground mb-4">요일별 전비 (km/kWh)</h2>
        <div className="space-y-2.5">
          {data.dailyEfficiency.map((item) => {
            const pct = (item.value / (maxVal + 1)) * 100;
            const isGood = item.value >= 6.5;
            const isBad = item.value > 0 && item.value < 5.5;
            return (
              <div key={item.day} className="flex items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground w-4">{item.day}</span>
                <div className="flex-1 h-6 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      item.value === 0
                        ? "bg-secondary"
                        : isBad
                        ? "bg-efficiency-bad"
                        : isGood
                        ? "bg-efficiency-good"
                        : "bg-efficiency-medium"
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  />
                </div>
                <span className="text-xs font-semibold text-foreground w-8 text-right">
                  {item.value > 0 ? item.value : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">🤖 AI 절약 팁</h2>
        <div className="space-y-3">
          {tips.map((tip, i) => {
            const Icon = tip.icon;
            return (
              <motion.div
                key={i}
                className="bg-card rounded-2xl p-4 shadow-sm flex gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 + i * 0.1 }}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={20} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{tip.title}</h3>
                    <span className="text-xs font-semibold bg-savings-bg text-savings-fg px-2 py-0.5 rounded-full whitespace-nowrap">
                      {tip.savings}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{tip.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReportTab;
