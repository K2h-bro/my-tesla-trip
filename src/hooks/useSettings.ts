import { useState, useCallback } from "react";

export interface AppSettings {
  batteryCapacity: number; // kWh
  electricityRate: number; // ₩/kWh
}

const STORAGE_KEY = "drivelog-settings";

const DEFAULTS: AppSettings = {
  batteryCapacity: 63,
  electricityRate: 320,
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
