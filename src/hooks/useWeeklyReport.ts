import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const MILES_TO_KM = 1.60934;
const BATTERY_KWH = 82.0;

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export interface WeeklyStats {
  score: number;
  totalKm: number;
  avgEfficiency: number | null;
  chargeCost: number;
  regenCount: number;
  dailyEfficiency: { day: string; value: number }[];
  periodStart: string;
  periodEnd: string;
}

async function fetchWeeklyReport(): Promise<WeeklyStats> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: rows, error } = await supabase
    .from("drives")
    .select("recorded_at, battery_level, battery_range, odometer, charge_energy_added, is_charging")
    .gte("recorded_at", since)
    .order("recorded_at", { ascending: true });

  if (error) throw error;
  if (!rows || rows.length === 0) {
    return {
      score: 0,
      totalKm: 0,
      avgEfficiency: null,
      chargeCost: 0,
      regenCount: 0,
      dailyEfficiency: DAY_LABELS.slice(1).concat(DAY_LABELS[0]).map((d) => ({ day: d, value: 0 })),
      periodStart: "",
      periodEnd: "",
    };
  }

  // Total distance
  const odometers = rows.filter((r) => r.odometer != null).map((r) => r.odometer as number);
  const totalKm = odometers.length >= 2 ? (Math.max(...odometers) - Math.min(...odometers)) * MILES_TO_KM : 0;

  // Battery levels
  const levels = rows.filter((r) => r.battery_level != null).map((r) => r.battery_level as number);
  const avgBatteryLevel = levels.length ? levels.reduce((a, b) => a + b, 0) / levels.length : 0;

  // Average efficiency: avgRange(km) / (avgLevel * capacity / 100)
  const ranges = rows.filter((r) => r.battery_range != null).map((r) => r.battery_range as number);
  const avgRangeKm = ranges.length ? (ranges.reduce((a, b) => a + b, 0) / ranges.length) * MILES_TO_KM : 0;
  const avgEfficiency =
    avgBatteryLevel > 0 && avgRangeKm > 0
      ? Math.round((avgRangeKm / ((avgBatteryLevel * BATTERY_KWH) / 100)) * 100) / 100
      : null;

  // Score from avg battery level (simple mapping)
  const score = Math.min(100, Math.round(avgBatteryLevel));

  // Charge cost estimate (₩350/kWh average Korea EV rate)
  const chargedKwh = rows
    .filter((r) => r.charge_energy_added && r.is_charging)
    .reduce((sum, r) => sum + (r.charge_energy_added as number), 0);
  const chargeCost = Math.round(chargedKwh * 350);

  // Regen count estimate: count transitions where battery_level increases without charging
  let regenCount = 0;
  for (let i = 1; i < rows.length; i++) {
    if (
      rows[i].battery_level != null &&
      rows[i - 1].battery_level != null &&
      (rows[i].battery_level as number) > (rows[i - 1].battery_level as number) &&
      !rows[i].is_charging
    ) {
      regenCount++;
    }
  }

  // Daily efficiency: group by day of week
  const dayMap = new Map<number, { rangeSum: number; levelSum: number; count: number }>();
  for (const r of rows) {
    if (r.battery_range == null || r.battery_level == null) continue;
    const dow = new Date(r.recorded_at).getDay();
    const existing = dayMap.get(dow) || { rangeSum: 0, levelSum: 0, count: 0 };
    existing.rangeSum += (r.battery_range as number) * MILES_TO_KM;
    existing.levelSum += r.battery_level as number;
    existing.count++;
    dayMap.set(dow, existing);
  }

  // Mon(1) to Sun(0)
  const dayOrder = [1, 2, 3, 4, 5, 6, 0];
  const dailyEfficiency = dayOrder.map((dow) => {
    const d = dayMap.get(dow);
    let value = 0;
    if (d && d.levelSum > 0) {
      const avgR = d.rangeSum / d.count;
      const avgL = d.levelSum / d.count;
      value = Math.round((avgR / ((avgL * BATTERY_KWH) / 100)) * 10) / 10;
    }
    return { day: DAY_LABELS[dow], value };
  });

  return {
    score,
    totalKm: Math.round(totalKm * 10) / 10,
    avgEfficiency,
    chargeCost,
    regenCount,
    dailyEfficiency,
    periodStart: rows[0].recorded_at?.slice(0, 10) ?? "",
    periodEnd: rows[rows.length - 1].recorded_at?.slice(0, 10) ?? "",
  };
}

export function useWeeklyReport() {
  return useQuery({
    queryKey: ["weeklyReport"],
    queryFn: fetchWeeklyReport,
    staleTime: 5 * 60 * 1000,
  });
}
