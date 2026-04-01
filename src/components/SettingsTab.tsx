import { useState } from "react";
import { motion } from "framer-motion";
import { User, Bell, ChevronRight, HelpCircle, Info, Battery, Coins, Car } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import type { AppSettings, VehicleModel } from "@/hooks/useSettings";

const VEHICLE_MODELS: VehicleModel[] = ["Model 3", "Model Y", "Model S", "Model X"];

interface SettingsTabProps {
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
}

const SettingsTab = ({ settings, onUpdateSettings = () => {} }: Partial<SettingsTabProps> & {} = {}) => {
  const s = settings ?? {
    batteryCapacity: 63,
    electricityRate: 320,
    userName: "",
    vehicleModel: "Model 3" as VehicleModel,
    weeklyReportNotification: true,
    batteryLowThreshold: 20,
  };

  const [nameInput, setNameInput] = useState(s.userName);
  const [saved, setSaved] = useState(false);

  const handleSaveProfile = () => {
    onUpdateSettings?.({ userName: nameInput });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="space-y-5 pb-4">
      <h1 className="text-xl font-bold text-foreground">설정</h1>

      {/* Profile Card */}
      <motion.div
        className="bg-card rounded-2xl p-5 shadow-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-xs font-semibold text-muted-foreground mb-3">프로필 설정</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">사용자 이름</label>
            <Input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="이름을 입력하세요"
              className="h-10"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">차량 모델</label>
            <div className="grid grid-cols-2 gap-2">
              {VEHICLE_MODELS.map((model) => (
                <button
                  key={model}
                  onClick={() => onUpdateSettings?.({ vehicleModel: model })}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    s.vehicleModel === model
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  }`}
                >
                  {model}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleSaveProfile}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold transition-colors hover:bg-primary/90"
          >
            {saved ? "✓ 저장됨" : "저장"}
          </button>
        </div>
      </motion.div>

      {/* Notification Settings */}
      <motion.div
        className="bg-card rounded-2xl p-5 shadow-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <h2 className="text-xs font-semibold text-muted-foreground mb-3">알림 설정</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-primary" />
              <span className="text-sm font-medium text-foreground">주간 리포트 알림</span>
            </div>
            <Switch
              checked={s.weeklyReportNotification}
              onCheckedChange={(checked) => onUpdateSettings?.({ weeklyReportNotification: checked })}
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Battery size={18} className="text-primary" />
              <span className="text-sm font-medium text-foreground">배터리 낮음 알림</span>
              <span className="ml-auto text-sm font-bold text-primary">{s.batteryLowThreshold}%</span>
            </div>
            <Slider
              value={[s.batteryLowThreshold]}
              onValueChange={([v]) => onUpdateSettings?.({ batteryLowThreshold: v })}
              min={20}
              max={50}
              step={1}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>20%</span>
              <span>50%</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Calculation Settings */}
      <motion.div
        className="bg-card rounded-2xl p-5 shadow-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <h2 className="text-xs font-semibold text-muted-foreground mb-3">계산 설정</h2>
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Car size={18} className="text-primary" />
              <span className="text-sm font-medium text-foreground">배터리 용량</span>
              <span className="ml-auto text-sm font-bold text-primary">{s.batteryCapacity} kWh</span>
            </div>
            <Slider
              value={[s.batteryCapacity]}
              onValueChange={([v]) => onUpdateSettings?.({ batteryCapacity: v })}
              min={40}
              max={100}
              step={1}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>40 kWh</span>
              <span>100 kWh</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Coins size={18} className="text-primary" />
              <span className="text-sm font-medium text-foreground">전기 요금</span>
              <span className="ml-auto text-sm font-bold text-primary">₩{s.electricityRate}/kWh</span>
            </div>
            <Slider
              value={[s.electricityRate]}
              onValueChange={([v]) => onUpdateSettings?.({ electricityRate: v })}
              min={100}
              max={600}
              step={10}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>₩100</span>
              <span>₩600</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Other */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <h2 className="text-xs font-semibold text-muted-foreground mb-2 px-1">기타</h2>
        <div className="bg-card rounded-2xl shadow-sm overflow-hidden divide-y divide-border">
          {[
            { icon: HelpCircle, label: "고객센터" },
            { icon: Info, label: "앱 정보" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50 transition-colors"
              >
                <Icon size={18} className="text-muted-foreground" />
                <span className="text-sm font-medium text-foreground flex-1 text-left">{item.label}</span>
                <ChevronRight size={16} className="text-muted-foreground/50" />
              </button>
            );
          })}
        </div>
      </motion.div>

      <p className="text-center text-[10px] text-muted-foreground pt-2">DriveLog v1.0.0</p>
    </div>
  );
};

export default SettingsTab;
