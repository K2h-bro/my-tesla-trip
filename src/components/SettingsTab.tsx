import { motion } from "framer-motion";
import { User, Bell, Car, Zap, HelpCircle, Info, ChevronRight } from "lucide-react";

const sections = [
  {
    title: "계정",
    items: [
      { icon: User, label: "프로필 설정" },
      { icon: Bell, label: "알림 설정" },
    ],
  },
  {
    title: "차량",
    items: [
      { icon: Car, label: "차량 정보 관리" },
      { icon: Zap, label: "충전 설정" },
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

const SettingsTab = () => {
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
          <h2 className="text-base font-bold text-foreground">김테슬라</h2>
          <p className="text-xs text-muted-foreground">tesla.lover@gmail.com</p>
        </div>
      </motion.div>

      {/* Settings Sections */}
      {sections.map((section, si) => (
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
