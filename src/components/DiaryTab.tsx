import { motion } from "framer-motion";
import { Calendar, Thermometer, MapPin, Route } from "lucide-react";
import { useDiaryData } from "@/hooks/useDiaryData";
import { Skeleton } from "@/components/ui/skeleton";
import type { AppSettings } from "@/hooks/useSettings";

const earthCircumference = 40075;

interface DiaryTabProps {
  settings: AppSettings;
}

const DiaryTab = ({ settings }: Partial<DiaryTabProps> & {} = {}) => {
  const { data, isLoading, isError } = useDiaryData(settings?.batteryCapacity ?? 63);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-4">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
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

  const { stats, journeys } = data;
  const earthLaps = (stats.totalKm / earthCircumference).toFixed(2);

  const milestones = [
    { icon: Calendar, title: "함께한 날", value: `${stats.totalDays}일` },
    { icon: Route, title: "총 주행", value: `${stats.totalKm.toLocaleString()} km` },
  ];

  return (
    <div className="space-y-6 pb-4">
      {/* Total Distance */}
      <motion.div
        className="bg-card rounded-2xl p-6 flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="w-28 h-28 rounded-full border-[3px] border-primary/30 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold text-foreground">{stats.totalKm.toLocaleString()}</span>
          <span className="text-[10px] text-muted-foreground">km</span>
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          지구 <span className="font-bold text-primary">{earthLaps}바퀴</span> 주행했어요 🌍
        </p>
      </motion.div>

      {/* Milestones */}
      <div className="flex gap-3">
        {milestones.map((ms, i) => {
          const Icon = ms.icon;
          return (
            <motion.div
              key={ms.title}
              className="bg-card rounded-2xl p-4 flex-1 flex flex-col items-center gap-1.5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10">
                <Icon size={18} className="text-primary" />
              </div>
              <span className="text-[10px] text-muted-foreground">{ms.title}</span>
              <span className="text-base font-extrabold text-foreground">{ms.value}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Recap Banner */}
      <motion.div
        className="bg-card rounded-2xl p-5 relative overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-8 translate-x-8" />
        <p className="text-[10px] font-semibold text-muted-foreground">2025 연간 리캡</p>
        <h3 className="text-base font-bold mt-1 text-foreground">나의 드라이브 한 해 돌아보기</h3>
        <p className="text-xs mt-1.5 text-muted-foreground">곧 공개됩니다 ✨</p>
      </motion.div>

      {/* Journey Cards */}
      <div>
        <h2 className="text-sm font-bold text-foreground mb-3">최근 여정</h2>
        {journeys.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">기록된 여정이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {journeys.map((j, i) => (
              <motion.div
                key={j.date}
                className="bg-card rounded-2xl overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
              >
                <div className="h-12 bg-gradient-to-br from-primary/8 to-primary/3 flex items-center justify-center">
                  <MapPin size={16} className="text-primary/30" />
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-bold text-foreground">{j.date} 드라이브</h3>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{j.distanceKm} km</span>
                    {j.avgEfficiency != null && (
                      <>
                        <span>·</span>
                        <span>{j.avgEfficiency} km/kWh</span>
                      </>
                    )}
                    {j.avgTemp != null && (
                      <>
                        <span>·</span>
                        <Thermometer size={11} className="inline text-muted-foreground" />
                        <span>{j.avgTemp}°C</span>
                      </>
                    )}
                  </div>
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
