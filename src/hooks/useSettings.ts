import { useState, useCallback } from "react";

export type VehicleModel = "Model 3" | "Model Y" | "Model S" | "Model X";

export interface AppSettings {
  batteryCapacity: number;
  electricityRate: number;
  userName: string;
  vehicleModel: VehicleModel;
  weeklyReportNotification: boolean;
  batteryLowThreshold: number;
}

const STORAGE_KEY = "drivelog-settings";

const DEFAULTS: AppSettings = {
  batteryCapacity: 63,
  electricityRate: 320,
  userName: "",
  vehicleModel: "Model 3",
  weeklyReportNotification: true,
  batteryLowThreshold: 20,
};

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULTS;
}

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(loadSettings);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { settings, updateSettings };
}
