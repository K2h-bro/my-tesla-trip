"""
Tesla Owner API → Supabase collector
  - Refresh access token using refresh token
  - Fetch vehicle_data and INSERT into drives table
  - On 408 (vehicle sleeping): clone latest row with current timestamp
"""

import os
import sys
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


# -- 3. Get Vehicle Data ------------------------------------------------------
def get_vehicle_data(headers: dict, vehicle_id: str) -> dict:
    url  = f"{TESLA_API_BASE}/api/1/vehicles/{vehicle_id}/vehicle_data"
    resp = requests.get(url, headers=headers, timeout=30)

    if resp.status_code == 408:
        raise RuntimeError("VEHICLE_SLEEPING")

    if resp.status_code == 412:
        raise RuntimeError(
            "412 Precondition Failed: check that TESLA_API_BASE is set to Owner API."
        )

    resp.raise_for_status()
    data = resp.json().get("response", {})
    print("✅ vehicle_data received")
    return data


# -- 4. Parse Fields ----------------------------------------------------------
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


# -- 5. Clone Latest Row (vehicle sleeping fallback) --------------------------
def clone_latest_row(client: Client) -> dict:
    result = (
        client.table("drives")
        .select("*")
        .order("recorded_at", desc=True)
        .limit(1)
        .execute()
    )
    rows = result.data or []
    if not rows:
        raise RuntimeError("No existing rows to clone — cannot fallback.")

    row = rows[0].copy()

    # Strip DB-managed fields so INSERT gets a clean new row
    row.pop("id",         None)
    row.pop("created_at", None)

    # Update timestamp to now
    row["recorded_at"] = datetime.now(timezone.utc).isoformat()

    print("✅ Latest row cloned (vehicle was sleeping)")
    return row


# -- 6. Supabase INSERT -------------------------------------------------------
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

        vehicle_id   = get_vehicle_id(headers)
        vehicle_data = get_vehicle_data(headers, vehicle_id)
        row          = parse_row(vehicle_data)

    except RuntimeError as e:
        if str(e) == "VEHICLE_SLEEPING":
            # 408 fallback: clone latest row with current timestamp
            print("⚠️  Vehicle sleeping (408) — cloning latest row instead")
            try:
                row = clone_latest_row(supabase)
            except RuntimeError as clone_err:
                print(f"\n⚠️  Fallback failed: {clone_err}\n")
                sys.exit(0)
        else:
            print(f"\n⚠️  Skipped: {e}\n")
            sys.exit(0)

    except Exception as e:
        print(f"\n❌ Error: {e}\n")
        sys.exit(1)

    print("\n📋 Row to insert:")
    for k, v in row.items():
        print(f"   {k}: {v}")

    try:
        insert_to_supabase(supabase, row)
        print("\n🎉 Done!\n")
    except Exception as e:
        print(f"\n❌ Error: {e}\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
