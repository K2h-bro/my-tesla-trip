"""
Tesla Fleet API → Supabase collector
  - Refresh access token using refresh token
  - On 408 (vehicle sleeping): wake_up → poll 30s → fetch → INSERT
  - On wake timeout: skip gracefully
"""

import os
import sys
import time
import requests
from datetime import datetime, timezone
from supabase import create_client, Client


# -- Environment Variables ----------------------------------------------------
CLIENT_ID     = os.environ["TESLA_CLIENT_ID"]
REFRESH_TOKEN = os.environ["TESLA_REFRESH_TOKEN"]
SUPABASE_URL  = os.environ["SUPABASE_URL"]
SUPABASE_KEY  = os.environ["SUPABASE_KEY"]

TESLA_AUTH_URL = "https://auth.tesla.com/oauth2/v3/token"
TESLA_API_BASE = "https://fleet-api.prd.na.vn.cloud.tesla.com"

WAKE_TIMEOUT_SEC  = 30   # max wait for vehicle to wake
WAKE_POLL_SEC     =  3   # interval between state checks


# -- 1. Get Access Token ------------------------------------------------------
def get_access_token() -> str:
    payload = {
        "grant_type":    "refresh_token",
        "client_id":     CLIENT_ID,
        "refresh_token": REFRESH_TOKEN,
    }
    resp = requests.post(TESLA_AUTH_URL, json=payload, timeout=30)
    resp.raise_for_status()
    token = resp.json().get("access_token")
    if not token:
        raise ValueError(f"access_token missing: {resp.text}")
    print("✅ access_token issued")
    return token


# -- 2. Get Vehicle ID --------------------------------------------------------
def get_vehicle_id(headers: dict) -> str:
    resp = requests.get(
        f"{TESLA_API_BASE}/api/1/vehicles",
        headers=headers,
        timeout=30,
    )
    resp.raise_for_status()
    vehicles = resp.json().get("response", [])
    if not vehicles:
        raise RuntimeError("No registered vehicles found.")
    vehicle_id = str(vehicles[0]["id"])
    print(f"✅ Vehicle ID: {vehicle_id}  ({vehicles[0].get('display_name', 'Unknown')})")
    return vehicle_id


# -- 3. Wake Up Vehicle -------------------------------------------------------
def wake_up(headers: dict, vehicle_id: str) -> None:
    url  = f"{TESLA_API_BASE}/api/1/vehicles/{vehicle_id}/wake_up"
    resp = requests.post(url, headers=headers, timeout=30)
    resp.raise_for_status()
    print("🔔 wake_up command sent")


# -- 4. Poll Until Online or Timeout ------------------------------------------
def wait_until_online(headers: dict, vehicle_id: str) -> bool:
    """
    Poll vehicle state every WAKE_POLL_SEC seconds.
    Return True if online within WAKE_TIMEOUT_SEC, False otherwise.
    """
    url     = f"{TESLA_API_BASE}/api/1/vehicles/{vehicle_id}"
    elapsed = 0

    while elapsed < WAKE_TIMEOUT_SEC:
        time.sleep(WAKE_POLL_SEC)
        elapsed += WAKE_POLL_SEC

        try:
            resp  = requests.get(url, headers=headers, timeout=15)
            resp.raise_for_status()
            state = resp.json().get("response", {}).get("state", "")
            print(f"   [{elapsed:2d}s] vehicle state: {state}")
            if state == "online":
                print("✅ Vehicle is online")
                return True
        except Exception as poll_err:
            print(f"   [{elapsed:2d}s] poll error: {poll_err}")

    print(f"⚠️  Vehicle did not wake within {WAKE_TIMEOUT_SEC}s")
    return False


# -- 5. Get Vehicle Data ------------------------------------------------------
def get_vehicle_data(headers: dict, vehicle_id: str) -> dict:
    url  = f"{TESLA_API_BASE}/api/1/vehicles/{vehicle_id}/vehicle_data"
    resp = requests.get(url, headers=headers, timeout=30)

    if resp.status_code == 408:
        raise RuntimeError("VEHICLE_SLEEPING")

    if resp.status_code == 412:
        raise RuntimeError(
            "412 Precondition Failed: domain registration required for Fleet API."
        )

    resp.raise_for_status()
    data = resp.json().get("response", {})
    print("✅ vehicle_data received")
    return data


# -- 6. Parse Fields ----------------------------------------------------------
def parse_row(data: dict) -> dict:
    charge  = data.get("charge_state",  {})
    climate = data.get("climate_state", {})
    drive   = data.get("drive_state",   {})

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


# -- 7. Supabase INSERT -------------------------------------------------------
def insert_to_supabase(client: Client, row: dict) -> None:
    result = client.table("drives").insert(row).execute()
    if result.data:
        print(f"✅ Supabase INSERT done → id: {result.data[0].get('id', '?')}")
    else:
        raise RuntimeError(f"INSERT failed: {result}")


# -- Main ---------------------------------------------------------------------
def main():
    print(f"\n{'='*50}")
    print(f"  Tesla data collect: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print(f"{'='*50}\n")

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    try:
        access_token = get_access_token()
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type":  "application/json",
        }

        vehicle_id = get_vehicle_id(headers)

        # -- First attempt ----------------------------------------------------
        try:
            vehicle_data = get_vehicle_data(headers, vehicle_id)

        except RuntimeError as e:
            if str(e) != "VEHICLE_SLEEPING":
                raise

            # -- 408: wake up and retry ---------------------------------------
            print("⚠️  Vehicle sleeping (408) — sending wake_up")
            wake_up(headers, vehicle_id)

            online = wait_until_online(headers, vehicle_id)
            if not online:
                print("⏭️  Skipping this run — vehicle did not wake in time\n")
                sys.exit(0)

            # -- Retry vehicle_data after wakeup ------------------------------
            vehicle_data = get_vehicle_data(headers, vehicle_id)

        row = parse_row(vehicle_data)

        print("\n📋 Row to insert:")
        for k, v in row.items():
            print(f"   {k}: {v}")

        insert_to_supabase(supabase, row)
        print("\n🎉 Done!\n")

    except Exception as e:
        print(f"\n❌ Error: {e}\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
