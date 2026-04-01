import os
import sys
import requests
from datetime import datetime, timezone
from supabase import create_client, Client

CLIENT_ID     = os.environ["TESLA_CLIENT_ID"]
REFRESH_TOKEN = os.environ["TESLA_REFRESH_TOKEN"]
SUPABASE_URL  = os.environ["SUPABASE_URL"]
SUPABASE_KEY  = os.environ["SUPABASE_KEY"]

TESLA_AUTH_URL = "https://auth.tesla.com/oauth2/v3/token"
TESLA_API_BASE = "https://owner-api.teslamotors.com"

def get_access_token():
    payload = {
        "grant_type": "refresh_token",
        "client_id": CLIENT_ID,
        "refresh_token": REFRESH_TOKEN,
    }
    resp = requests.post(TESLA_AUTH_URL, json=payload, timeout=30)
    resp.raise_for_status()
    token = resp.json().get("access_token")
    if not token:
        raise ValueError("access_token 없음")
    print("access_token 발급 완료")
    return token

def get_vehicle_id(headers):
    resp = requests.get(f"{TESLA_API_BASE}/api/1/vehicles", headers=headers, timeout=30)
    resp.raise_for_status()
    vehicles = resp.json().get("response", [])
    if not vehicles:
        raise RuntimeError("등록된 차량 없음")
    vid = str(vehicles[0]["id"])
    print(f"차량 ID: {vid}")
    return vid

def get_vehicle_data(headers, vehicle_id):
    url = f"{TESLA_API_BASE}/api/1/vehicles/{vehicle_id}/vehicle_data"
    resp = requests.get(url, headers=headers, timeout=30)
    if resp.status_code == 408:
        raise RuntimeError("차량 절전 상태(408)")
    resp.raise_for_status()
    print("vehicle_data 수신 완료")
    return resp.json().get("response", {})

def parse_row(data):
    charge  = data.get("charge_state", {})
    climate = data.get("climate_state", {})
    drive   = data.get("drive_state", {})
    return {
        "recorded_at":         datetime.now(timezone.utc).isoformat(),
        "battery_level":       charge.get("battery_level"),
        "battery_range":       charge.get("battery_range"),
        "odometer":            data.get("vehicle_state", {}).get("odometer"),
        "speed":               drive.get("speed"),
        "latitude":            drive.get("latitude"),
        "longitude":           drive.get("longitude"),
        "outside_temp":        climate.get("outside_temp"),
        "inside_temp":         climate.get("inside_temp"),
        "is_charging":         charge.get("charging_state") == "Charging",
        "charge_energy_added": charge.get("charge_energy_added"),
    }

def insert_to_supabase(row):
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    result = client.table("drives").insert(row).execute()
    if result.data:
        print(f"Supabase INSERT 완료 id: {result.data[0].get('id')}")
    else:
        raise RuntimeError(f"INSERT 실패: {result}")

def main():
    print(f"\n{'='*50}")
    print(f"Tesla 데이터 수집 시작: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print(f"{'='*50}\n")
    try:
        access_token = get_access_token()
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        vehicle_id   = get_vehicle_id(headers)
        vehicle_data = get_vehicle_data(headers, vehicle_id)
        row          = parse_row(vehicle_data)
        insert_to_supabase(row)
        print("완료!")
    except RuntimeError as e:
        print(f"건너뜀: {e}")
        sys.exit(0)
    except Exception as e:
        print(f"오류: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
