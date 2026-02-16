import pandas as pd
import requests
import time
from datetime import datetime, timedelta

from config.settings import (
    CSV_PATH,
    LOCATIONS,
    BASE_URL
)

# -------------------------------------------------
# Get missing dates between last CSV date and today
# -------------------------------------------------
def get_missing_dates(last_date, today):
    start = last_date + timedelta(days=1)
    end = today - timedelta(days=1)
    
    if start > end:
        return None, None # No range needed
        
    return start, end


# -------------------------------------------------
# Fetch weather from Open-Meteo (Hourly -> Daily Agg)
# -------------------------------------------------
def fetch_weather_batch(location_name, coords, start_date, end_date):
    lat, lon = coords
    
    # Format dates for Open-Meteo (YYYY-MM-DD)
    start_str = start_date.strftime("%Y-%m-%d")
    end_str = end_date.strftime("%Y-%m-%d")

    # We fetch HOURLY data because Open-Meteo's DAILY endpoint 
    # often lacks specific means like "Mean Humidity" or "Dew Point".
    # We will aggregate it ourselves below.
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_str,
        "end_date": end_str,
        "hourly": "temperature_2m,relative_humidity_2m,dew_point_2m,shortwave_radiation",
        "timezone": "Asia/Colombo" 
    }

    try:
        response = requests.get(BASE_URL, params=params)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        print(f"❌ API Request failed for {location_name}: {e}")
        return []

    # Process Hourly Data
    hourly = data.get("hourly", {})
    if not hourly:
        return []

    # Create a DataFrame from hourly data
    df_hourly = pd.DataFrame({
        "time": pd.to_datetime(hourly["time"]),
        "temp": hourly["temperature_2m"],
        "humidity": hourly["relative_humidity_2m"],
        "dew": hourly["dew_point_2m"],
        "solar": hourly["shortwave_radiation"]
    })

    # Create a 'date' column for grouping (remove time component)
    df_hourly["date"] = df_hourly["time"].dt.date

    # Aggregate to Daily values
    # tempmax -> Max of hourly temps
    # dew -> Mean of hourly dew points
    # humidity -> Mean of hourly humidity
    # solarradiation -> Mean of hourly solar (W/m²)
    df_daily = df_hourly.groupby("date").agg({
        "temp": "max",
        "dew": "mean",
        "humidity": "mean",
        "solar": "mean"
    }).reset_index()

    # Format into list of dictionaries
    results = []
    for _, row in df_daily.iterrows():
        results.append({
            "location": location_name,
            "datetime": pd.to_datetime(row["date"]),
            "tempmax": round(row["temp"], 2),
            "dew": round(row["dew"], 2),
            "humidity": round(row["humidity"], 2),
            "solarradiation": round(row["solar"], 2)
        })

    return results


# -------------------------------------------------
# Update CSV automatically on app startup
# -------------------------------------------------
def update_weather_csv():
    print("🔄 Checking weather CSV updates...")

    try:
        df = pd.read_csv(CSV_PATH)
    except FileNotFoundError:
        print("❌ CSV file not found.")
        return

    # Ensure datetime parsing is robust
    df["datetime"] = pd.to_datetime(
        df["datetime"],
        format="mixed",
        dayfirst=True,
        errors="coerce"
    )

    df = df.dropna(subset=["datetime"])

    if df.empty:
        last_date = datetime(2023, 1, 1).date() # Fallback if CSV is empty
    else:
        last_date = df["datetime"].max().date()
    
    today = datetime.now().date()

    # Get start and end dates for the query
    start_date, end_date = get_missing_dates(last_date, today)

    if not start_date:
        print("✅ CSV already up to date")
        return

    print(f"📅 Updating data from {start_date} to {end_date}")

    new_rows = []

    # Iterate locations and fetch the WHOLE range at once (More efficient)
    for location, coords in LOCATIONS.items():
        print(f"🌦️ Fetching data for {location}...")
        
        location_data = fetch_weather_batch(location, coords, start_date, end_date)
        
        if location_data:
            new_rows.extend(location_data)
        
        # Be nice to the free API
        time.sleep(1) 

    if new_rows:
        new_df = pd.DataFrame(new_rows)

        # Concatenate and sort
        df = pd.concat([df, new_df], ignore_index=True)
        df.sort_values(["location", "datetime"], inplace=True)
        
        # Save
        df.to_csv(CSV_PATH, index=False)
        print(f"✅ Added {len(new_rows)} new rows to CSV")
    else:
        print("⚠️ No new data was retrieved.")

if __name__ == "__main__":
    update_weather_csv()