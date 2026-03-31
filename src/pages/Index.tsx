import { useState } from "react";
import BottomTabBar from "@/components/BottomTabBar";
import ReportTab from "@/components/ReportTab";
import DiaryTab from "@/components/DiaryTab";
import VehicleTab from "@/components/VehicleTab";
import SettingsTab from "@/components/SettingsTab";

type TabId = "report" | "diary" | "vehicle" | "settings";

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>("report");

  const renderTab = () => {
    switch (activeTab) {
      case "report": return <ReportTab />;
      case "diary": return <DiaryTab />;
      case "vehicle": return <VehicleTab />;
      case "settings": return <SettingsTab />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-12 pb-24">
        {renderTab()}
      </div>
      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
