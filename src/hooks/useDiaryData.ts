import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const MILES_TO_KM = 1.60934;

export interface DiaryStats {
  totalKm: number;
  totalDays: number;
}

export interface JourneyCard {
  date: string;
  distanceKm: number;
  avgEfficiency: number | null;
  avgTemp: number | null;
  recordCount: number;
}

export interface DiaryData {
  stats: DiaryStats;
  journeys: JourneyCard[];
}

async function fetchDiaryData(batteryCapacity: number): Promise<DiaryData> {
  const { data: rows, error } = await supabase
    .from("drives")
    .select("recorded_at, odometer, battery_range, battery_level, outside_temp")
    .order("recorded_at", { ascending: true });

  if (error) throw error;
  if (!rows || rows.length === 0) {
    return { stats: { totalKm: 0, totalDays: 0 }, journeys: [] };
  }

  // Total distance
  const odometers = rows.filter((r) => r.odometer != null).map((r) => r.odometer as number);
  const totalKm =
    odometers.length >= 2 ? Math.round((Math.max(...odometers) - Math.min(...odometers)) * MILES_TO_KM * 10) / 10 : 0;

  // Unique days
  const uniqueDays = new Set(rows.map((r) => r.recorded_at?.slice(0, 10)).filter(Boolean));
  const totalDays = uniqueDays.size;

  // Group by date for journey cards
  const dayMap = new Map<
    string,
    { odometers: number[]; ranges: number[]; levels: number[]; temps: number[]; count: number }
  >();

  for (const r of rows) {
    const date = r.recorded_at?.slice(0, 10);
    if (!date) continue;
    const entry = dayMap.get(date) || { odometers: [], ranges: [], levels: [], temps: [], count: 0 };
    if (r.odometer != null) entry.odometers.push(r.odometer as number);
    if (r.battery_range != null) entry.ranges.push(r.battery_range as number);
    if (r.battery_level != null) entry.levels.push(r.battery_level as number);
    if (r.outside_temp != null) entry.temps.push(r.outside_temp as number);
    entry.count++;
    dayMap.set(date, entry);
  }

  const journeys: JourneyCard[] = Array.from(dayMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 20)
    .map(([date, d]) => {
      const distanceKm =
        d.odometers.length >= 2
          ? Math.round((Math.max(...d.odometers) - Math.min(...d.odometers)) * MILES_TO_KM * 10) / 10
          : 0;

      const avgRange = d.ranges.length ? (d.ranges.reduce((a, b) => a + b, 0) / d.ranges.length) * MILES_TO_KM : 0;
      const avgLevel = d.levels.length ? d.levels.reduce((a, b) => a + b, 0) / d.levels.length : 0;
      const avgEfficiency =
        avgLevel > 0 && avgRange > 0
          ? Math.round((avgRange / ((avgLevel * batteryCapacity) / 100)) * 10) / 10
          : null;

      const avgTemp = d.temps.length
        ? Math.round((d.temps.reduce((a, b) => a + b, 0) / d.temps.length) * 10) / 10
        : null;

      return { date, distanceKm, avgEfficiency, avgTemp, recordCount: d.count };
    });

  return { stats: { totalKm, totalDays }, journeys };
}

export function useDiaryData(batteryCapacity: number) {
  return useQuery({
    queryKey: ["diaryData", batteryCapacity],
    queryFn: () => fetchDiaryData(batteryCapacity),
    staleTime: 5 * 60 * 1000,
  });
}
