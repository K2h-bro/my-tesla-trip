import { BarChart3, Map, Car, Settings } from "lucide-react";

type TabId = "report" | "diary" | "vehicle" | "settings";

interface BottomTabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "report", label: "리포트", icon: BarChart3 },
  { id: "diary", label: "다이어리", icon: Map },
  { id: "vehicle", label: "차량", icon: Car },
  { id: "settings", label: "설정", icon: Settings },
];

const BottomTabBar = ({ activeTab, onTabChange }: BottomTabBarProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-border z-50">
      <div className="max-w-lg mx-auto flex items-center justify-around h-20 px-2 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-all duration-200 ${
                isActive ? "text-primary" : "text-tab-inactive hover:text-muted-foreground"
              }`}
            >
              <div className={`transition-all duration-200 ${isActive ? "scale-110" : ""}`}>
                <Icon size={isActive ? 26 : 22} strokeWidth={isActive ? 2.2 : 1.6} />
              </div>
              <span className={`text-[11px] ${isActive ? "font-bold" : "font-medium"}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomTabBar;
