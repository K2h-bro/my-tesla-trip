import { motion } from "framer-motion";
import { Calendar, CloudRain, Sunrise, MapPin, Sun, Cloud } from "lucide-react";

const totalKm = 28420;
const earthCircumference = 40075;
const earthLaps = (totalKm / earthCircumference).toFixed(2);

const milestones = [
  { icon: Calendar, title: "함께한 날", value: "847일", color: "bg-primary/10 text-primary" },
  { icon: CloudRain, title: "비 오는 날", value: "62회", color: "bg-blue-50 text-blue-500" },
  { icon: Sunrise, title: "새벽 드라이브", value: "23회", color: "bg-amber-50 text-amber-500" },
  { icon: MapPin, title: "원정 여행", value: "15회", color: "bg-rose-50 text-rose-500" },
];

const journeys = [
  {
    title: "서울 → 강릉 해변 드라이브",
    date: "2026.03.28",
    distance: "237 km",
    efficiency: "6.8 km/kWh",
    weather: Sun,
    tags: ["고속도로", "주말"],
    mapBg: "from-blue-100 to-cyan-50",
  },
  {
    title: "판교 출퇴근",
    date: "2026.03.27",
    distance: "42 km",
    efficiency: "7.1 km/kWh",
    weather: Cloud,
    tags: ["출퇴근", "평일"],
    mapBg: "from-gray-100 to-slate-50",
  },
  {
    title: "제주 올레길 투어",
    date: "2026.03.22",
    distance: "186 km",
    efficiency: "5.9 km/kWh",
    weather: CloudRain,
    tags: ["제주", "여행"],
    mapBg: "from-emerald-100 to-teal-50",
  },
];

const DiaryTab = () => {
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
          <span className="text-2xl font-bold text-foreground">{totalKm.toLocaleString()}</span>
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
        <div className="space-y-3">
          {journeys.map((j, i) => {
            const WeatherIcon = j.weather;
            return (
              <motion.div
                key={i}
                className="bg-card rounded-2xl shadow-sm overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + i * 0.08 }}
              >
                {/* Map thumbnail */}
                <div className={`h-24 bg-gradient-to-br ${j.mapBg} flex items-center justify-center`}>
                  <MapPin size={28} className="text-muted-foreground/30" />
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-foreground">{j.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{j.date}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{j.distance}</span>
                    <span>•</span>
                    <span>{j.efficiency}</span>
                    <span>•</span>
                    <WeatherIcon size={14} />
                  </div>
                  <div className="flex gap-1.5 mt-2.5">
                    {j.tags.map((tag) => (
                      <span key={tag} className="text-[10px] font-medium bg-tag-bg text-tag-fg px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DiaryTab;
