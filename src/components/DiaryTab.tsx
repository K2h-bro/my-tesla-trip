import { motion } from "framer-motion";
import { Calendar, Thermometer, MapPin, Route } from "lucide-react";
import { useDiaryData } from "@/hooks/useDiaryData";
import { Skeleton } from "@/components/ui/skeleton";
import type { AppSettings } from "@/hooks/useSettings";

const earthCircumference = 40075;

interface DiaryTabProps {
  settings: AppSettings;
}

const DiaryTab = ({ settings = { batteryCapacity: 63, electricityRate: 320 } }: Partial<DiaryTabProps> & {}) => {
  const { data, isLoading, isError } = useDiaryData(settings?.batteryCapacity ?? 63);

  if (isLoading) {
    return (
      <div className="space-y-5 pb-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-5 pb-4">
        <h1 className="text-xl font-bold text-foreground">드라이브 다이어리</h1>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground text-sm">데이터를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  const { stats, journeys } = data;
  const earthLaps = (stats.totalKm / earthCircumference).toFixed(2);

  const milestones = [
    { icon: Calendar, title: "함께한 날", value: `${stats.totalDays}일`, color: "bg-primary/10 text-primary" },
    { icon: Route, title: "총 주행", value: `${stats.totalKm.toLocaleString()} km`, color: "bg-blue-50 text-blue-500" },
  ];

  return (
    <div className="space-y-5 pb-4">
      <h1 className="text-xl font-bold text-foreground">드라이브 다이어리</h1>

      {/* Total Distance Circle */}
      <motion.div
        className="bg-card rounded-2xl p-6 flex flex-col items-center shadow-sm"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="w-32 h-32 rounded-full border-4 border-primary/20 flex flex-col items-center justify-center bg-primary/5">
          <span className="text-2xl font-bold text-foreground">{stats.totalKm.toLocaleString()}</span>
          <span className="text-xs text-muted-foreground">km</span>
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          지구 <span className="font-bold text-primary">{earthLaps}바퀴</span> 주행했어요 🌍
        </p>
      </motion.div>

      {/* Milestones */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">마일스톤</h2>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {milestones.map((ms, i) => {
            const Icon = ms.icon;
            return (
              <motion.div
                key={ms.title}
                className="bg-card rounded-2xl p-4 shadow-sm min-w-[130px] flex flex-col items-center gap-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ms.color}`}>
                  <Icon size={20} />
                </div>
                <span className="text-xs text-muted-foreground">{ms.title}</span>
                <span className="text-base font-bold text-foreground">{ms.value}</span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Annual Recap Banner */}
      <motion.div
        className="bg-banner-bg rounded-2xl p-5 text-banner-fg relative overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-6 -translate-x-4" />
        <p className="text-xs font-medium opacity-80">2025 연간 리캡</p>
        <h3 className="text-lg font-bold mt-1">나의 드라이브 한 해 돌아보기</h3>
        <p className="text-xs mt-2 opacity-70">곧 공개됩니다 ✨</p>
      </motion.div>

      {/* Journey Cards */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">최근 여정</h2>
        {journeys.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">기록된 여정이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {journeys.map((j, i) => (
              <motion.div
                key={j.date}
                className="bg-card rounded-2xl shadow-sm overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
              >
                <div className="h-16 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <MapPin size={24} className="text-muted-foreground/30" />
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-foreground">{j.date} 드라이브</h3>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{j.distanceKm} km</span>
                    {j.avgEfficiency != null && (
                      <>
                        <span>•</span>
                        <span>{j.avgEfficiency} km/kWh</span>
                      </>
                    )}
                    {j.avgTemp != null && (
                      <>
                        <span>•</span>
                        <Thermometer size={12} className="inline" />
                        <span>{j.avgTemp}°C</span>
                      </>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">{j.recordCount}개 기록</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiaryTab;
