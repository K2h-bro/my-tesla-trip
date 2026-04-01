import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const MILES_TO_KM = 1.60934;

export interface VehicleData {
  batteryLevel: number;
  rangeKm: number;
  totalOdometerKm: number;
  insideTemp: number | null;
  outsideTemp: number | null;
  isCharging: boolean;
  recordedAt: string;
}

async function fetchVehicleData(): Promise<VehicleData | null> {
  const { data, error } = await supabase
    .from("drives")
    .select("battery_level, battery_range, odometer, inside_temp, outside_temp, is_charging, recorded_at")
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    batteryLevel: data.battery_level ?? 0,
    rangeKm: Math.round((data.battery_range ?? 0) * MILES_TO_KM * 10) / 10,
    totalOdometerKm: Math.round((data.odometer ?? 0) * MILES_TO_KM * 10) / 10,
    insideTemp: data.inside_temp ?? null,
    outsideTemp: data.outside_temp ?? null,
    isCharging: data.is_charging ?? false,
    recordedAt: data.recorded_at ?? "",
  };
}

export function useVehicleData() {
  return useQuery({
    queryKey: ["vehicleData"],
    queryFn: fetchVehicleData,
    staleTime: 60 * 1000,
  });
}
