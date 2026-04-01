import { motion } from "framer-motion";
import { Battery, Thermometer, Gauge, Zap, MapPin, Clock } from "lucide-react";
import { useVehicleData } from "@/hooks/useVehicleData";
import { Skeleton } from "@/components/ui/skeleton";
import type { AppSettings } from "@/hooks/useSettings";

interface VehicleTabProps {
  settings?: AppSettings;
}

const VehicleTab = ({ settings }: VehicleTabProps = {}) => {
  const vehicleModel = settings?.vehicleModel ?? "Model 3";
  const { data, isLoading, isError } = useVehicleData();

  if (isLoading) {
    return (
      <div className="space-y-5 pb-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-48 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-5 pb-4">
        <h1 className="text-xl font-bold text-foreground">내 차량</h1>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground text-sm">차량 데이터를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  const vehicleInfo = [
    { icon: Battery, label: "배터리 잔량", value: `${data.batteryLevel}%`, sub: data.isCharging ? "충전 중 ⚡" : "방전 중" },
    { icon: MapPin, label: "주행 가능 거리", value: `${data.rangeKm} km`, sub: "예상 잔여" },
    { icon: Gauge, label: "총 주행거리", value: `${data.totalOdometerKm.toLocaleString()} km`, sub: "누적" },
    { icon: Thermometer, label: "실내 온도", value: data.insideTemp != null ? `${data.insideTemp}°C` : "N/A", sub: "차량 내부" },
    { icon: Thermometer, label: "외부 온도", value: data.outsideTemp != null ? `${data.outsideTemp}°C` : "N/A", sub: "차량 외부" },
    { icon: Zap, label: "충전 상태", value: data.isCharging ? "충전 중" : "미충전", sub: data.isCharging ? "⚡ 활성" : "대기" },
  ];

  const lastUpdate = data.recordedAt ? new Date(data.recordedAt).toLocaleString("ko-KR") : "";

  return (
    <div className="space-y-5 pb-4">
      <h1 className="text-xl font-bold text-foreground">내 차량</h1>

      {/* Vehicle Card */}
      <motion.div
        className="bg-card rounded-2xl p-6 shadow-sm text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="w-20 h-20 rounded-2xl bg-primary/10 mx-auto flex items-center justify-center text-3xl">
          🚗
        </div>
        <h2 className="text-lg font-bold text-foreground mt-3">Tesla Model 3</h2>
        <div className="flex items-center justify-center gap-2 mt-2">
          <div className={`w-2 h-2 rounded-full ${data.isCharging ? "bg-efficiency-good animate-pulse" : "bg-muted-foreground/30"}`} />
          <span className="text-sm text-muted-foreground">{data.isCharging ? "충전 중" : "대기 중"}</span>
        </div>
        {lastUpdate && (
          <div className="flex items-center justify-center gap-1 mt-2">
            <Clock size={12} className="text-muted-foreground/50" />
            <p className="text-[10px] text-muted-foreground/50">{lastUpdate} 기준</p>
          </div>
        )}
      </motion.div>

      {/* Vehicle Stats */}
      <div className="grid grid-cols-2 gap-3">
        {vehicleInfo.map((info, i) => {
          const Icon = info.icon;
          return (
            <motion.div
              key={info.label}
              className="bg-card rounded-2xl p-4 shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
            >
              <Icon size={18} className="text-primary mb-2" />
              <p className="text-xs text-muted-foreground">{info.label}</p>
              <p className="text-lg font-bold text-foreground">{info.value}</p>
              <p className="text-[10px] text-muted-foreground">{info.sub}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default VehicleTab;
