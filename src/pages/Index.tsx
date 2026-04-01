import { useState } from "react";
import BottomTabBar from "@/components/BottomTabBar";
import ReportTab from "@/components/ReportTab";
import DiaryTab from "@/components/DiaryTab";
import VehicleTab from "@/components/VehicleTab";
import SettingsTab from "@/components/SettingsTab";
import { useSettings } from "@/hooks/useSettings";

type TabId = "report" | "diary" | "vehicle" | "settings";

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>("report");
  const { settings, updateSettings } = useSettings();

  const renderTab = () => {
    switch (activeTab) {
      case "report": return <ReportTab settings={settings} />;
      case "diary": return <DiaryTab settings={settings} />;
      case "vehicle": return <VehicleTab settings={settings} />;
      case "settings": return <SettingsTab settings={settings} onUpdateSettings={updateSettings} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-md z-40">
        <div className="max-w-lg mx-auto flex items-center justify-center h-14 px-4">
          <img src="https://smith.speedgabia.com/logo_data/the_smith_logo.png" alt="DriveLog" className="h-8 object-contain" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 pt-20 pb-28">
        {renderTab()}
      </div>
      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
