import pandas as pd
from datetime import datetime, timedelta   # ← FIXED: added datetime here
import joblib
from sklearn.preprocessing import LabelEncoder
from utils.heat_index import calculate_heat_index, classify_risk


def load_models():
    return {
        "tempmax":        joblib.load("models/tempmax_model.pkl"),
        "humidity":       joblib.load("models/humidity_model.pkl"),
        "solarradiation": joblib.load("models/solarradiation_model.pkl"),
    }


FEATURES = {
    "tempmax": [
        "location_enc", "month", "dayofyear",
        "tempmax_lag1", "tempmax_lag7", "tempmax_lag14",
        "humidity_lag1", "humidity_lag7",
        "temp_roll3", "hum_roll3"
    ],

    "humidity": [
        "location_enc", "month", "dayofyear",
        "humidity_lag1", "humidity_lag7", "humidity_lag14",
        "tempmax_lag1", "tempmax_lag7",
        "hum_roll3"
    ],

    "solarradiation": [
        "location_enc", "month", "dayofyear",
        "solarradiation_lag1", "solarradiation_lag7", "solarradiation_lag14"
    ]
}


def safe_lag(series, lag, fallback):
    return series.iloc[-lag] if len(series) >= lag else fallback


def add_features(df):
    df = df.sort_values(["location", "datetime"]).copy()

    for col in ["tempmax", "humidity", "solarradiation"]:
        df[f"{col}_lag1"]  = df.groupby("location")[col].shift(1)
        df[f"{col}_lag7"]  = df.groupby("location")[col].shift(7)
        df[f"{col}_lag14"] = df.groupby("location")[col].shift(14)

    df["temp_roll3"] = (
        df.groupby("location")["tempmax"]
        .rolling(3)
        .mean()
        .reset_index(0, drop=True)
    )

    df["hum_roll3"] = (
        df.groupby("location")["humidity"]
        .rolling(3)
        .mean()
        .reset_index(0, drop=True)
    )

    return df.dropna()


def run_predictions(df, models, future_days=15):
    """
    Predictions start FROM TODAY (inclusive)
    - First prediction = today (using latest known features)
    - Then tomorrow, day after, ..., up to future_days days
    """
    df["datetime"] = pd.to_datetime(df["datetime"], errors="coerce")
    df = df.sort_values(["location", "datetime"])

    le = LabelEncoder()
    df["location_enc"] = le.fit_transform(df["location"])

    df = add_features(df)

    locations = df["location"].unique()
    last_date = df["datetime"].max().date()  # last known date in data

    # Start from TODAY
    start_date = datetime.now().date()
    future_dates = pd.date_range(
        start=start_date,
        periods=future_days
    )

    future_records = []

    for loc in locations:
        df_loc = df[df["location"] == loc].copy()
        latest = df_loc.iloc[-1:].copy()

        for date in future_dates:
            latest["datetime"] = date
            latest["month"] = date.month
            latest["dayofyear"] = date.timetuple().tm_yday

            row = {
                "location": loc,
                "datetime": str(date.date())
            }

            # Predict in dependency-friendly order
            row["tempmax"] = models["tempmax"].predict(
                latest[FEATURES["tempmax"]]
            )[0]
            latest["tempmax"] = row["tempmax"]

            row["humidity"] = models["humidity"].predict(
                latest[FEATURES["humidity"]]
            )[0]
            latest["humidity"] = row["humidity"]

            row["solarradiation"] = models["solarradiation"].predict(
                latest[FEATURES["solarradiation"]]
            )[0]
            latest["solarradiation"] = row["solarradiation"]

            # Update lag1
            latest["tempmax_lag1"]        = row["tempmax"]
            latest["humidity_lag1"]       = row["humidity"]
            latest["solarradiation_lag1"] = row["solarradiation"]

            # Longer lags — use historical or fallback
            latest["tempmax_lag7"] = safe_lag(df_loc["tempmax"], 7, row["tempmax"])
            latest["humidity_lag7"] = safe_lag(df_loc["humidity"], 7, row["humidity"])
            latest["solarradiation_lag7"] = safe_lag(df_loc["solarradiation"], 7, row["solarradiation"])

            latest["tempmax_lag14"] = safe_lag(df_loc["tempmax"], 14, row["tempmax"])
            latest["humidity_lag14"] = safe_lag(df_loc["humidity"], 14, row["humidity"])
            latest["solarradiation_lag14"] = safe_lag(df_loc["solarradiation"], 14, row["solarradiation"])

            # Rolling
            latest["temp_roll3"] = (
                df_loc["tempmax"].tail(3).mean()
                if len(df_loc) >= 3 else row["tempmax"]
            )

            latest["hum_roll3"] = (
                df_loc["humidity"].tail(3).mean()
                if len(df_loc) >= 3 else row["humidity"]
            )

            HI_C = calculate_heat_index(row["tempmax"], row["humidity"])
            row["heat_index_C"] = round(HI_C)
            row["risk_level"] = classify_risk(HI_C)

            future_records.append(row)

            # Append to df_loc for next iteration
            df_loc = pd.concat([df_loc, pd.DataFrame([row])], ignore_index=True)

    return future_records