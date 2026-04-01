"""
Tesla Owner API → Supabase collector
  - Fleet API(도메인 등록 필요) 대신 Owner API 사용
  - GitHub Actions 등 고정 도메인 없는 환경에서도 정상 작동
"""

import os
import sys
import requests
from datetime import datetime, timezone
from supabase import create_client, Client


# ── 환경변수 ──────────────────────────────────────────────────────────────────
CLIENT_ID     = os.environ["TESLA_CLIENT_ID"]
REFRESH_TOKEN = os.environ["TESLA_REFRESH_TOKEN"]
SUPABASE_URL  = os.environ["SUPABASE_URL"]
SUPABASE_KEY  = os.environ["SUPABASE_KEY"]
# CLIENT_SECRET 불필요 → GitHub Secrets에서 삭제하지 않아도 무방 (그냥 미사용)

TESLA_AUTH_URL = "https://auth.tesla.com/oauth2/v3/token"
TESLA_API_BASE = "https://owner-api.teslamotors.com"   # ✅ 도메인 등록 불필요
# Fleet API (도메인 등록 필요, GitHub Actions에서 412 발생)
# TESLA_API_BASE = "https://fleet-api.prd.na.vn.cloud.tesla.com"


# ── 1. Access Token 발급 ──────────────────────────────────────────────────────
def get_access_token() -> str:
    payload = {
        "grant_type":    "refresh_token",
        "client_id":     CLIENT_ID,
        "refresh_token": REFRESH_TOKEN,
        # client_secret 제거 - Owner API 토큰 갱신에 불필요
    }
    resp = requests.post(TESLA_AUTH_URL, json=payload, timeout=30)
    resp.raise_for_status()
    token = resp.json().get("access_token")
    if not token:
        raise ValueError(f"access_token 없음: {resp.text}")
    print("✅ access_token 발급 완료")
    return token


# ── 2. 차량 ID 조회 ───────────────────────────────────────────────────────────
def get_vehicle_id(headers: dict) -> str:
    resp = requests.get(
        f"{TESLA_API_BASE}/api/1/vehicles",
        headers=headers,
        timeout=30,
    )
    resp.raise_for_status()
    vehicles = resp.json().get("response", [])
    if not vehicles:
        raise RuntimeError("등록된 차량이 없습니다.")
    vehicle_id = str(vehicles[0]["id"])
    print(f"✅ 차량 ID: {vehicle_id}  ({vehicles[0].get('display_name', 'Unknown')})")
    return vehicle_id


# ── 3. Vehicle Data 조회 ──────────────────────────────────────────────────────
def get_vehicle_data(headers: dict, vehicle_id: str) -> dict:
    url = f"{TESLA_API_BASE}/api/1/vehicles/{vehicle_id}/vehicle_data"

    # Owner API는 endpoints 파라미터 미지원 → 파라미터 없이 호출
    resp = requests.get(url, headers=headers, timeout=30)

    if resp.status_code == 408:
        raise RuntimeError("차량이 절전 상태(408)입니다. 다음 실행 때 재시도합니다.")

    if resp.status_code == 412:
        raise RuntimeError(
            "412 Precondition Failed: 도메인 등록이 필요한 엔드포인트입니다. "
            "TESLA_API_BASE가 Owner API로 설정되어 있는지 확인하세요."
        )

    resp.raise_for_status()
    data = resp.json().get("response", {})
    print("✅ vehicle_data 수신 완료")
    return data


# ── 4. 필요한 필드만 추출 ─────────────────────────────────────────────────────
def parse_row(data: dict) -> dict:
    charge  = data.get("charge_state",   {})
    climate = data.get("climate_state",  {})
    drive   = data.get("drive_state",    {})

    def safe(val):
        return val if val is not None else None

    return {
        "recorded_at":         datetime.now(timezone.utc).isoformat(),
        "battery_level":       safe(charge.get("battery_level")),
        "battery_range":       safe(charge.get("battery_range")),
        "odometer":            safe(data.get("vehicle_state", {}).get("odometer")),
        "speed":               safe(drive.get("speed")),
        "latitude":            safe(drive.get("latitude")),
        "longitude":           safe(drive.get("longitude")),
        "outside_temp":        safe(climate.get("outside_temp")),
        "inside_temp":         safe(climate.get("inside_temp")),
        "is_charging":         charge.get("charging_state") == "Charging",
        "charge_energy_added": safe(charge.get("charge_energy_added")),
    }


# ── 5. Supabase INSERT ────────────────────────────────────────────────────────
def insert_to_supabase(row: dict) -> None:
    client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    result = client.table("drives").insert(row).execute()
    if result.data:
        print(f"✅ Supabase INSERT 완료 → id: {result.data[0].get('id', '?')}")
    else:
        raise RuntimeError(f"INSERT 실패: {result}")


# ── 메인 ──────────────────────────────────────────────────────────────────────
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
        print(f"\n⚠️  건너뜀: {e}\n")
        sys.exit(0)

    except Exception as e:
        print(f"\n❌ 오류: {e}\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
```

---

## GitHub Secrets 정리
```
# 제거해도 됨 (더 이상 사용 안 함)
TESLA_CLIENT_SECRET  - 삭제 가능

# 유지 필수
TESLA_CLIENT_ID
TESLA_REFRESH_TOKEN
SUPABASE_URL
SUPABASE_KEY
