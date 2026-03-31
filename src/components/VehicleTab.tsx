import { motion } from "framer-motion";
import { Battery, Thermometer, Gauge, Wrench, Shield, Calendar } from "lucide-react";

const vehicleInfo = [
  { icon: Battery, label: "배터리 상태", value: "94%", sub: "SOH" },
  { icon: Thermometer, label: "배터리 온도", value: "24°C", sub: "정상" },
  { icon: Gauge, label: "타이어 공기압", value: "42 PSI", sub: "전체 정상" },
  { icon: Wrench, label: "다음 점검", value: "D-23", sub: "정기 서비스" },
  { icon: Shield, label: "보험 만료", value: "2026.11", sub: "삼성화재" },
  { icon: Calendar, label: "등록일", value: "2024.03", sub: "2년차" },
];

const VehicleTab = () => {
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
        <h2 className="text-lg font-bold text-foreground mt-3">Model 3 Highland</h2>
        <p className="text-sm text-muted-foreground">Long Range · 2024</p>
        <p className="text-xs text-muted-foreground mt-1">서울 12가 3456</p>
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
