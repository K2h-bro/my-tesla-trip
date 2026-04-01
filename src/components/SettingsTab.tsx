import { motion } from "framer-motion";
import { User, Bell, Car, Zap, HelpCircle, Info, ChevronRight, Battery, Coins } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import type { AppSettings } from "@/hooks/useSettings";

interface SettingsTabProps {
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
}

const SettingsTab = ({ settings, onUpdateSettings }: SettingsTabProps) => {
  const menuSections = [
    {
      title: "계정",
      items: [
        { icon: User, label: "프로필 설정" },
        { icon: Bell, label: "알림 설정" },
      ],
    },
    {
      title: "기타",
      items: [
        { icon: HelpCircle, label: "고객센터" },
        { icon: Info, label: "앱 정보" },
      ],
    },
  ];

  return (
    <div className="space-y-5 pb-4">
      <h1 className="text-xl font-bold text-foreground">설정</h1>

      {/* Profile Card */}
      <motion.div
        className="bg-card rounded-2xl p-5 shadow-sm flex items-center gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
          👤
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">DriveLog 사용자</h2>
          <p className="text-xs text-muted-foreground">설정을 맞춤 조정하세요</p>
        </div>
      </motion.div>

      {/* Calculation Settings */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <h2 className="text-xs font-semibold text-muted-foreground mb-2 px-1">계산 설정</h2>
        <div className="bg-card rounded-2xl shadow-sm p-4 space-y-5">
          {/* Battery Capacity */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Battery size={18} className="text-primary" />
              <span className="text-sm font-medium text-foreground">배터리 용량</span>
              <span className="ml-auto text-sm font-bold text-primary">{settings.batteryCapacity} kWh</span>
            </div>
            <Slider
              value={[settings.batteryCapacity]}
              onValueChange={([v]) => onUpdateSettings({ batteryCapacity: v })}
              min={40}
              max={100}
              step={1}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>40 kWh</span>
              <span>100 kWh</span>
            </div>
          </div>

          {/* Electricity Rate */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Coins size={18} className="text-primary" />
              <span className="text-sm font-medium text-foreground">전기 요금</span>
              <span className="ml-auto text-sm font-bold text-primary">₩{settings.electricityRate}/kWh</span>
            </div>
            <Slider
              value={[settings.electricityRate]}
              onValueChange={([v]) => onUpdateSettings({ electricityRate: v })}
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

      {/* Menu Sections */}
      {menuSections.map((section, si) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 + si * 0.05 }}
        >
          <h2 className="text-xs font-semibold text-muted-foreground mb-2 px-1">{section.title}</h2>
          <div className="bg-card rounded-2xl shadow-sm overflow-hidden divide-y divide-border">
            {section.items.map((item) => {
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
      ))}

      <p className="text-center text-[10px] text-muted-foreground pt-2">DriveLog v1.0.0</p>
    </div>
  );
};

export default SettingsTab;
