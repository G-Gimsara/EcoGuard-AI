import pandas as pd
import requests
import time
from datetime import datetime, timedelta
import os

# Import your configurations
try:
    from config.settings import CSV_PATH, LOCATIONS, FORECAST_BASE, ARCHIVE_BASE, BACKEND_SENSOR_URL, KADUWELA_DEVICE_ID
except ImportError:
    CSV_PATH = "data/Weather_2016-01-01_to_2026-01-24.csv"
    LOCATIONS = {
        "homagama": (6.845, 80.015),
        "kaduwela": (6.936, 79.984),
        "kolonnawa": (6.933, 79.885),
        "colombo": (6.932, 79.846),
        "moratuwa": (6.779, 79.883),
        "padukka": (6.841, 80.093),
        "dehiwala": (6.851, 79.866),
        "kesbawa": (6.779, 79.947),
        "rathmalana": (6.819, 79.881),
        "seethawaka": (6.954, 80.205),
        "thimbirigasyaya": (6.896, 79.867),
        "maharagama": (6.848, 79.927),
        "jayawardanapura": (6.885, 79.904),
    }

FORECAST_BASE = "https://api.open-meteo.com/v1/forecast"
ARCHIVE_BASE  = "https://archive-api.open-meteo.com/v1/archive"

# Backend API configuration
BACKEND_SENSOR_URL = "http://localhost:5000/api/sensors" 
KADUWELA_DEVICE_ID = "esp32-device-1" 

# -------------------------------------------------
def get_yesterday():
    return datetime.now().date() - timedelta(days=1)

# -------------------------------------------------
def is_after_4pm():
    return datetime.now().hour >= 16

# -------------------------------------------------
def get_update_range(last_date):
    today     = datetime.now().date()
    yesterday = get_yesterday()
    historical_start = None
    historical_end   = None
    if last_date < yesterday:
        historical_start = last_date + timedelta(days=1)
        historical_end   = yesterday
    return historical_start, historical_end, today

# -------------------------------------------------
def fetch_kaduwela_sensor_data():
    try:
        params = {"device_id": KADUWELA_DEVICE_ID, "limit": 500}
        response = requests.get(BACKEND_SENSOR_URL, params=params, timeout=10)
        if response.status_code != 200:
            return None
            
        readings = response.json()
        if not readings:
            return None

        today_str = datetime.now().strftime("%Y-%m-%d")
        today_readings = [
            r for r in readings 
            if r.get('createdAt') and r['createdAt'].startswith(today_str)
        ]

        if not today_readings:
            return None

        max_record = max(today_readings, key=lambda x: x['temperature'])
        return {
            "tempmax": max_record['temperature'],
            "humidity": max_record['humidity']
        }
    except Exception as e:
        print(f"   Sensor API fetch failed: {e}")
        return None

# -------------------------------------------------
def fetch_historical(location_name, coords, start_date, end_date):
    lat, lon = coords
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_date.strftime("%Y-%m-%d"),
        "end_date": end_date.strftime("%Y-%m-%d"),
        "hourly": "temperature_2m,relative_humidity_2m,shortwave_radiation",
        "timezone": "Asia/Colombo"
    }
    try:
        response = requests.get(ARCHIVE_BASE, params=params, timeout=15)
        response.raise_for_status()
    except Exception as e:
        print(f"   Historical fetch failed for {location_name}: {e}")
        return []

    data = response.json()
    if "hourly" not in data or not data["hourly"]["time"]:
        return []

    df = pd.DataFrame(data["hourly"])
    df["time"] = pd.to_datetime(df["time"])
    df["date"] = df["time"].dt.date

    rows = []
    for day, group in df.groupby("date"):
        if group.empty: continue
        peak_idx = group["temperature_2m"].idxmax()
        peak = group.loc[peak_idx]
        rows.append({
            "location": location_name,
            "datetime": day.strftime("%Y-%m-%d"),
            "tempmax": round(peak["temperature_2m"], 1),
            "humidity": round(peak["relative_humidity_2m"], 1),
            "solarradiation": round(peak["shortwave_radiation"], 1)
        })
    return rows

# -------------------------------------------------
def fetch_today(location_name, coords):
    lat, lon = coords
    now = datetime.now()
    today = now.date()
    
    # 1. Logic for Kaduwela (Sensor Data + API Solar)
    if location_name == "kaduwela":
        sensor_result = fetch_kaduwela_sensor_data()
        
        # Always fetch hourly data to get peak solar radiation
        solar_val = 0.0
        try:
            # Use ARCHIVE if after 4pm for better accuracy, else FORECAST
            url = ARCHIVE_BASE if is_after_4pm() else FORECAST_BASE
            params = {
                "latitude": lat, "longitude": lon, 
                "hourly": "shortwave_radiation", 
                "timezone": "Asia/Colombo"
            }
            if is_after_4pm():
                params["start_date"] = today.strftime("%Y-%m-%d")
                params["end_date"] = today.strftime("%Y-%m-%d")
            
            s_res = requests.get(url, params=params, timeout=10)
            s_data = s_res.json()
            # Get the maximum solar radiation recorded today so far
            solar_val = max(s_data["hourly"]["shortwave_radiation"])
        except:
            pass

        if sensor_result:
            return [{
                "location": location_name,
                "datetime": today.strftime("%Y-%m-%d"),
                "tempmax": round(sensor_result["tempmax"], 1),
                "humidity": round(sensor_result["humidity"], 1),
                "solarradiation": round(solar_val, 1)
            }]

    # 2. Standard Logic for other locations (using 4PM rule)
    if is_after_4pm():
        params = {
            "latitude": lat, "longitude": lon,
            "start_date": today.strftime("%Y-%m-%d"), "end_date": today.strftime("%Y-%m-%d"),
            "hourly": "temperature_2m,relative_humidity_2m,shortwave_radiation",
            "timezone": "Asia/Colombo"
        }
        try:
            response = requests.get(ARCHIVE_BASE, params=params, timeout=15)
            data = response.json()
            df = pd.DataFrame(data["hourly"])
            peak_idx = df["temperature_2m"].idxmax()
            peak = df.loc[peak_idx]
            return [{
                "location": location_name,
                "datetime": today.strftime("%Y-%m-%d"),
                "tempmax": round(peak["temperature_2m"], 1),
                "humidity": round(peak["relative_humidity_2m"], 1),
                "solarradiation": round(peak["shortwave_radiation"], 1)
            }]
        except: return []
    else:
        # Before 4PM: Get current hour values
        params = {
            "latitude": lat, "longitude": lon,
            "hourly": "temperature_2m,relative_humidity_2m,shortwave_radiation",
            "forecast_days": 1, "timezone": "Asia/Colombo"
        }
        try:
            response = requests.get(FORECAST_BASE, params=params, timeout=12)
            data = response.json()
            df = pd.DataFrame(data["hourly"])
            df["time"] = pd.to_datetime(df["time"])
            now_hour = now.hour
            sel = df[(df["time"].dt.date == today) & (df["time"].dt.hour == now_hour)]
            sel_row = sel.iloc[0] if not sel.empty else df.iloc[-1]
            return [{
                "location": location_name,
                "datetime": today.strftime("%Y-%m-%d"),
                "tempmax": round(sel_row["temperature_2m"], 1),
                "humidity": round(sel_row["relative_humidity_2m"], 1),
                "solarradiation": round(sel_row["shortwave_radiation"], 1)
            }]
        except: return []

# -------------------------------------------------
def update_weather_csv():
    print(f" Checking CSV: {CSV_PATH}")
    if not os.path.exists(CSV_PATH):
        pd.DataFrame(columns=["location", "datetime", "tempmax", "humidity", "solarradiation"]).to_csv(CSV_PATH, index=False)

    try:
        df = pd.read_csv(CSV_PATH)
    except Exception as e:
        print(f" Cannot read CSV: {e}"); return

    df["datetime_parsed"] = pd.to_datetime(df["datetime"], errors="coerce")
    valid = df.dropna(subset=["datetime_parsed"])
    last_date = valid["datetime_parsed"].max().date() if not valid.empty else datetime(2000, 1, 1).date()

    hist_start, hist_end, today = get_update_range(last_date)
    new_rows = []

    for loc_name, coords in LOCATIONS.items():
        print(f" Processing {loc_name}...")
        try:
            if hist_start and hist_end and hist_start <= hist_end:
                hist_data = fetch_historical(loc_name, coords, hist_start, hist_end)
                new_rows.extend(hist_data)
                time.sleep(1.1)
            
            today_data = fetch_today(loc_name, coords)
            if today_data:
                new_rows.extend(today_data)
        except Exception as e:
            print(f"   Error in {loc_name}: {e}")

    if not new_rows:
        print(" No new data retrieved."); return

    new_df = pd.DataFrame(new_rows)
    today_str = today.strftime("%Y-%m-%d")
    df = df[df["datetime"] != today_str]
    if "datetime_parsed" in df.columns:
        df["datetime"] = df["datetime_parsed"].dt.strftime("%Y-%m-%d")
        df = df.drop(columns=["datetime_parsed"])

    combined = pd.concat([df, new_df], ignore_index=True)
    combined = combined.drop_duplicates(subset=["location", "datetime"], keep="last")
    combined.sort_values(["location", "datetime"], inplace=True)

    try:
        combined.to_csv(CSV_PATH, index=False)
        print(f" Saved {len(new_rows)} rows. Data up to: {today}")
    except Exception as e:
        print(f" Save failed: {e}")

if __name__ == "__main__":
    update_weather_csv()
