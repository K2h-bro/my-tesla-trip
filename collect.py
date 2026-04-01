"""
Tesla Fleet API → Supabase collector
  - access_token을 refresh_token으로 갱신
  - vehicle_data 조회 후 drives 테이블에 INSERT
"""

import os
import sys
import requests
from datetime import datetime, timezone
from supabase import create_client, Client


# ── 환경변수 ──────────────────────────────────────────────
CLIENT_ID     = os.environ["TESLA_CLIENT_ID"]
CLIENT_SECRET = os.environ["TESLA_CLIENT_SECRET"]
REFRESH_TOKEN = os.environ["TESLA_REFRESH_TOKEN"]
SUPABASE_URL  = os.environ["SUPABASE_URL"]
SUPABASE_KEY  = os.environ["SUPABASE_KEY"]

TESLA_AUTH_URL = "https://auth.tesla.com/oauth2/v3/token"
TESLA_API_BASE = "https://fleet-api.prd.na.vn.cloud.tesla.com"   # 북미 엔드포인트
                                                                   # EU: eu.vn.cloud.tesla.com


# ── 1. Access Token 발급 ──────────────────────────────────
def get_access_token() -> str:
    payload = {
        "grant_type":    "refresh_token",
        "client_id":     CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "refresh_token": REFRESH_TOKEN,
    }
    resp = requests.post(TESLA_AUTH_URL, json=payload, timeout=30)
    resp.raise_for_status()
    token = resp.json().get("access_token")
    if not token:
        raise ValueError(f"access_token 없음: {resp.text}")
    print("✅ access_token 발급 완료")
    return token


# ── 2. 차량 ID 조회 ───────────────────────────────────────
def get_vehicle_id(headers: dict) -> str:
    resp = requests.get(f"{TESLA_API_BASE}/api/1/vehicles", headers=headers, timeout=30)
    resp.raise_for_status()
    vehicles = resp.json().get("response", [])
    if not vehicles:
        raise RuntimeError("등록된 차량이 없습니다.")
    vehicle_id = str(vehicles[0]["id"])
    print(f"✅ 차량 ID: {vehicle_id}  ({vehicles[0].get('display_name', 'Unknown')})")
    return vehicle_id


# ── 3. Vehicle Data 조회 ──────────────────────────────────
def get_vehicle_data(headers: dict, vehicle_id: str) -> dict:
    endpoints = ",".join([
        "charge_state",
        "climate_state",
        "drive_state",
        "vehicle_state",
    ])
    url = f"{TESLA_API_BASE}/api/1/vehicles/{vehicle_id}/vehicle_data"
    resp = requests.get(url, headers=headers, params={"endpoints": endpoints}, timeout=30)

    if resp.status_code == 408:
        # 차량이 잠들어 있을 경우 wake-up 후 재시도할 수도 있지만,
        # cron 특성상 다음 실행까지 건너뜀
        raise RuntimeError("차량이 절전 상태(408)입니다. 다음 실행 때 재시도합니다.")

    resp.raise_for_status()
    data = resp.json().get("response", {})
    print("✅ vehicle_data 수신 완료")
    return data


# ── 4. 필요한 필드만 추출 ─────────────────────────────────
def parse_row(data: dict) -> dict:
    charge  = data.get("charge_state",   {})
    climate = data.get("climate_state",  {})
    drive   = data.get("drive_state",    {})

    def safe(val):
        """None-safe 변환 (미지원 차량은 null로 저장)"""
        return val if val is not None else None

    return {
        "recorded_at":        datetime.now(timezone.utc).isoformat(),
        "battery_level":      safe(charge.get("battery_level")),
        "battery_range":      safe(charge.get("battery_range")),        # 마일
        "odometer":           safe(data.get("vehicle_state", {}).get("odometer")),  # 마일
        "speed":              safe(drive.get("speed")),                  # mph, 정차시 null
        "latitude":           safe(drive.get("latitude")),
        "longitude":          safe(drive.get("longitude")),
        "outside_temp":       safe(climate.get("outside_temp")),        # ℃
        "inside_temp":        safe(climate.get("inside_temp")),         # ℃
        "is_charging":        charge.get("charging_state") == "Charging",
        "charge_energy_added": safe(charge.get("charge_energy_added")), # kWh
    }


# ── 5. Supabase INSERT ────────────────────────────────────
def insert_to_supabase(row: dict) -> None:
    client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    result = client.table("drives").insert(row).execute()
    if result.data:
        print(f"✅ Supabase INSERT 완료 → id: {result.data[0].get('id', '?')}")
    else:
        raise RuntimeError(f"INSERT 실패: {result}")


# ── 메인 ──────────────────────────────────────────────────
def main():
    print(f"\n{'='*50}")
    print(f"  Tesla 데이터 수집 시작: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print(f"{'='*50}\n")

    try:
        access_token = get_access_token()
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type":  "application/json",
        }

        vehicle_id   = get_vehicle_id(headers)
        vehicle_data = get_vehicle_data(headers, vehicle_id)
        row          = parse_row(vehicle_data)

        print("\n📋 수집된 데이터:")
        for k, v in row.items():
            print(f"   {k}: {v}")

        insert_to_supabase(row)
        print("\n🎉 완료!\n")

    except RuntimeError as e:
        # 차량 절전 등 예상 가능한 상황 → 경고만 출력하고 exit 0
        print(f"\n⚠️  건너뜀: {e}\n")
        sys.exit(0)

    except Exception as e:
        print(f"\n❌ 오류: {e}\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
