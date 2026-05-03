import os
import json
import joblib
import numpy as np
import pandas as pd

from datetime import datetime, timedelta

from utils.heat_index import calculate_heat_index, classify_risk


# ===============================
# PATHS
# ===============================
MODEL_DIR = "models/direct_multistep"


# ===============================
# LOAD MODELS
# ===============================
def load_models():
    config_path = os.path.join(MODEL_DIR, "forecast_config.json")
    encoder_path = os.path.join(MODEL_DIR, "location_encoder.pkl")

    if not os.path.exists(config_path):
        raise FileNotFoundError(
            f"Config file not found: {config_path}. Run training_model.py first."
        )

    if not os.path.exists(encoder_path):
        raise FileNotFoundError(
            f"Location encoder not found: {encoder_path}. Run training_model.py first."
        )

    with open(config_path, "r") as f:
        config = json.load(f)

    label_encoder = joblib.load(encoder_path)

    models = {}

    for target in config["targets"]:
        models[target] = {}

        for horizon in range(1, config["max_horizon"] + 1):
            model_path = os.path.join(
                MODEL_DIR,
                f"{target}_h{horizon}_model.pkl"
            )

            if os.path.exists(model_path):
                models[target][horizon] = joblib.load(model_path)
            else:
                print(f"⚠️ Missing model: {model_path}")

    return {
        "models": models,
        "encoder": label_encoder,
        "config": config
    }


# ===============================
# CYCLIC FEATURES
# ===============================
def add_cyclic_features(df, prefix, month_col, day_col):
    df[f"{prefix}_month_sin"] = np.sin(2 * np.pi * df[month_col] / 12)
    df[f"{prefix}_month_cos"] = np.cos(2 * np.pi * df[month_col] / 12)

    df[f"{prefix}_day_sin"] = np.sin(2 * np.pi * df[day_col] / 365.25)
    df[f"{prefix}_day_cos"] = np.cos(2 * np.pi * df[day_col] / 365.25)

    return df


# ===============================
# CLEAN DATA
# ===============================
def clean_weather_data(df, config):
    df = df.copy()

    if "datetime" not in df.columns:
        raise ValueError("Dataset must contain 'datetime' column.")

    if "location" not in df.columns:
        raise ValueError("Dataset must contain 'location' column.")

    df["datetime"] = pd.to_datetime(df["datetime"], errors="coerce")
    df = df.dropna(subset=["datetime", "location"])

    df["location"] = df["location"].astype(str)
    df = df.sort_values(["location", "datetime"]).reset_index(drop=True)

    weather_cols = config["weather_cols"]

    missing_cols = [col for col in weather_cols if col not in df.columns]

    if missing_cols:
        raise ValueError(
            f"Missing weather columns in prediction data: {missing_cols}"
        )

    for col in weather_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")

        df[col] = (
            df.groupby("location")[col]
            .transform(lambda s: s.ffill().bfill())
        )

    return df


# ===============================
# HISTORICAL FEATURES
# ===============================
def create_base_features(df, label_encoder, config):
    df = clean_weather_data(df, config)

    known_locations = set(label_encoder.classes_)
    current_locations = set(df["location"].unique())
    unknown_locations = current_locations - known_locations

    if unknown_locations:
        raise ValueError(
            f"Unknown locations found: {unknown_locations}. "
            "Retrain the model with these locations first."
        )

    df["location_enc"] = label_encoder.transform(df["location"])

    # Anchor date features
    df["anchor_month"] = df["datetime"].dt.month
    df["anchor_dayofyear"] = df["datetime"].dt.dayofyear

    df = add_cyclic_features(
        df,
        prefix="anchor",
        month_col="anchor_month",
        day_col="anchor_dayofyear"
    )

    weather_cols = config["weather_cols"]
    lags = config["lags"]
    roll_windows = config["roll_windows"]
    std_windows = config["std_windows"]

    for col in weather_cols:
        grouped = df.groupby("location")[col]

        df[f"{col}_lag0"] = df[col]

        for lag in lags:
            df[f"{col}_lag{lag}"] = grouped.shift(lag)

        for win in roll_windows:
            df[f"{col}_roll{win}"] = grouped.transform(
                lambda s: s.rolling(window=win, min_periods=win).mean()
            )

        for win in std_windows:
            df[f"{col}_std{win}"] = grouped.transform(
                lambda s: s.rolling(window=win, min_periods=win).std()
            )

        df[f"{col}_trend_1_7"] = df[f"{col}_lag1"] - df[f"{col}_lag7"]
        df[f"{col}_trend_1_14"] = df[f"{col}_lag1"] - df[f"{col}_lag14"]
        df[f"{col}_roll3_minus_roll14"] = df[f"{col}_roll3"] - df[f"{col}_roll14"]

    # Interaction features
    df["temp_humidity_lag0"] = df["tempmax_lag0"] * df["humidity_lag0"]
    df["solar_temp_lag0"] = df["solarradiation_lag0"] * df["tempmax_lag0"]
    df["solar_humidity_lag0"] = df["solarradiation_lag0"] * df["humidity_lag0"]

    # Solar-specific features
    df["solar_lag1_minus_lag7"] = df["solarradiation_lag1"] - df["solarradiation_lag7"]
    df["solar_lag1_minus_roll7"] = df["solarradiation_lag1"] - df["solarradiation_roll7"]
    df["solar_roll7_minus_roll14"] = df["solarradiation_roll7"] - df["solarradiation_roll14"]
    df["solar_roll3_minus_roll7"] = df["solarradiation_roll3"] - df["solarradiation_roll7"]

    df["solar_std7_to_roll7_ratio"] = (
        df["solarradiation_std7"] /
        (df["solarradiation_roll7"].abs() + 1e-6)
    )

    return df


# ===============================
# ADD FUTURE HORIZON FEATURES
# ===============================
def add_future_horizon_features(anchor_row, horizon, target_date):
    row = anchor_row.copy()

    target_month = int(target_date.month)
    target_dayofyear = int(target_date.timetuple().tm_yday)

    row["horizon"] = int(horizon)

    row["target_month"] = target_month
    row["target_dayofyear"] = target_dayofyear

    row["target_month_sin"] = np.sin(2 * np.pi * target_month / 12)
    row["target_month_cos"] = np.cos(2 * np.pi * target_month / 12)

    row["target_day_sin"] = np.sin(2 * np.pi * target_dayofyear / 365.25)
    row["target_day_cos"] = np.cos(2 * np.pi * target_dayofyear / 365.25)

    return row


# ===============================
# TARGET INVERSE TRANSFORM
# ===============================
def inverse_transform_prediction(target, pred, config):
    log_targets = config.get("log_targets", [])

    if target in log_targets:
        pred = np.expm1(pred)

    return pred


# ===============================
# POSTPROCESS
# ===============================
def postprocess_prediction(target, value):
    value = float(value)

    if target == "humidity":
        value = float(np.clip(value, 0, 100))

    if target == "solarradiation":
        value = float(max(value, 0))

    return value


# ===============================
# DATE SELECTION
# ===============================
def choose_start_date(last_known_date, future_days, max_horizon, start_date=None):
    if start_date is not None:
        selected_date = pd.to_datetime(start_date).date()
        first_horizon = (selected_date - last_known_date).days
        last_horizon = first_horizon + future_days - 1

        if first_horizon < 1:
            raise ValueError(
                "start_date must be after the latest known date in the dataset."
            )

        if last_horizon > max_horizon:
            raise ValueError(
                f"Requested date range needs horizon up to {last_horizon}, "
                f"but models are trained only up to {max_horizon}. "
                "Increase MAX_HORIZON and retrain."
            )

        return selected_date

    today = datetime.now().date()

    first_horizon_today = (today - last_known_date).days
    last_horizon_today = first_horizon_today + future_days - 1

    if 1 <= first_horizon_today and last_horizon_today <= max_horizon:
        return today

    return last_known_date + timedelta(days=1)


# ===============================
# VALIDATE FEATURES
# ===============================
def validate_feature_columns(df, feature_columns):
    missing_features = [col for col in feature_columns if col not in df.columns]

    if missing_features:
        raise ValueError(
            f"Missing prediction features: {missing_features}. "
            "prediction_logic.py must match training_model.py."
        )


# ===============================
# MAIN PREDICTION FUNCTION
# ===============================
def run_predictions(df, model_package, future_days=15, start_date=None):
    models = model_package["models"]
    label_encoder = model_package["encoder"]
    config = model_package["config"]

    max_horizon = config["max_horizon"]
    targets = config["targets"]
    feature_columns = config["feature_columns"]
    base_feature_columns = config["base_feature_columns"]

    if future_days < 1:
        raise ValueError("future_days must be at least 1.")

    if future_days > max_horizon:
        raise ValueError(
            f"future_days={future_days} is greater than trained max_horizon={max_horizon}."
        )

    base_df = create_base_features(df, label_encoder, config)

    validate_feature_columns(base_df, base_feature_columns)

    base_df = base_df.dropna(subset=base_feature_columns).reset_index(drop=True)

    if base_df.empty:
        raise ValueError(
            "Not enough historical data to create lag/rolling features."
        )

    future_records = []

    locations = base_df["location"].unique()

    for loc in locations:
        df_loc = base_df[base_df["location"] == loc].copy()
        df_loc = df_loc.sort_values("datetime")

        if df_loc.empty:
            continue

        anchor_row = df_loc.iloc[-1:].copy()
        last_known_date = anchor_row["datetime"].iloc[0].date()

        forecast_start_date = choose_start_date(
            last_known_date=last_known_date,
            future_days=future_days,
            max_horizon=max_horizon,
            start_date=start_date
        )

        for i in range(future_days):
            target_date = forecast_start_date + timedelta(days=i)
            horizon = (target_date - last_known_date).days

            if horizon < 1 or horizon > max_horizon:
                raise ValueError(
                    f"Horizon {horizon} is outside trained range 1-{max_horizon}."
                )

            prediction_row = add_future_horizon_features(
                anchor_row,
                horizon=horizon,
                target_date=target_date
            )

            validate_feature_columns(prediction_row, feature_columns)

            X_future = prediction_row[feature_columns]

            result = {
                "location": loc,
                "datetime": target_date.isoformat()
            }

            for target in targets:
                if target not in models:
                    raise ValueError(f"No models loaded for target: {target}")

                if horizon not in models[target]:
                    raise ValueError(
                        f"Missing model for {target}, horizon {horizon}."
                    )

                pred_value = models[target][horizon].predict(X_future)[0]

                pred_value = inverse_transform_prediction(
                    target=target,
                    pred=pred_value,
                    config=config
                )

                pred_value = postprocess_prediction(
                    target=target,
                    value=pred_value
                )

                result[target] = round(pred_value, 2)

            if "tempmax" in result and "humidity" in result:
                HI_C = calculate_heat_index(
                    result["tempmax"],
                    result["humidity"]
                )

                result["heat_index_C"] = round(HI_C)
                result["risk_level"] = classify_risk(HI_C)

            future_records.append(result)

    return future_records