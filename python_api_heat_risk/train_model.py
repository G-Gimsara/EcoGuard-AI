import os
import json
import joblib
import numpy as np
import pandas as pd

from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

from lightgbm import LGBMRegressor, early_stopping, log_evaluation


# ===============================
# PATHS
# ===============================
DATA_PATH = "data/Weather_2016-01-01_to_2026-01-24.csv"
MODEL_DIR = "models/direct_multistep"

os.makedirs(MODEL_DIR, exist_ok=True)


# ===============================
# CONFIG
# ===============================
MAX_HORIZON = 15
VALIDATION_DAYS = 365

TARGETS = [
    "tempmax",
    "humidity",
    "solarradiation"
]

# No extra data columns used
WEATHER_COLS = [
    "tempmax",
    "humidity",
    "solarradiation"
]

# Removed lag365
LAGS = [1, 2, 3, 7, 14, 21, 30]

ROLL_WINDOWS = [3, 7, 14]
STD_WINDOWS = [7, 14]

# Keep empty because solar log transform gave weak result
LOG_TARGETS = []


# ===============================
# CYCLIC ENCODING
# ===============================
def add_cyclic_features(df, prefix, month_col, day_col):
    df[f"{prefix}_month_sin"] = np.sin(2 * np.pi * df[month_col] / 12)
    df[f"{prefix}_month_cos"] = np.cos(2 * np.pi * df[month_col] / 12)

    df[f"{prefix}_day_sin"] = np.sin(2 * np.pi * df[day_col] / 365.25)
    df[f"{prefix}_day_cos"] = np.cos(2 * np.pi * df[day_col] / 365.25)

    return df


# ===============================
# FEATURE LIST
# ===============================
def build_feature_columns():
    features = [
        "location_enc",

        "horizon",

        "anchor_month",
        "anchor_dayofyear",
        "anchor_month_sin",
        "anchor_month_cos",
        "anchor_day_sin",
        "anchor_day_cos",

        "target_month",
        "target_dayofyear",
        "target_month_sin",
        "target_month_cos",
        "target_day_sin",
        "target_day_cos",
    ]

    for col in WEATHER_COLS:
        features.append(f"{col}_lag0")

        for lag in LAGS:
            features.append(f"{col}_lag{lag}")

        for win in ROLL_WINDOWS:
            features.append(f"{col}_roll{win}")

        for win in STD_WINDOWS:
            features.append(f"{col}_std{win}")

        features.append(f"{col}_trend_1_7")
        features.append(f"{col}_trend_1_14")
        features.append(f"{col}_roll3_minus_roll14")

    # Existing-column interaction features
    features.extend([
        "temp_humidity_lag0",
        "solar_temp_lag0",
        "solar_humidity_lag0",

        # Solar-specific features from existing solarradiation only
        "solar_lag1_minus_lag7",
        "solar_lag1_minus_roll7",
        "solar_roll7_minus_roll14",
        "solar_roll3_minus_roll7",
        "solar_std7_to_roll7_ratio",
    ])

    return features


FEATURE_COLUMNS = build_feature_columns()

BASE_FEATURE_COLUMNS = [
    col for col in FEATURE_COLUMNS
    if col not in [
        "horizon",
        "target_month",
        "target_dayofyear",
        "target_month_sin",
        "target_month_cos",
        "target_day_sin",
        "target_day_cos",
    ]
]


# ===============================
# CLEAN DATA
# ===============================
def clean_weather_data(df):
    df = df.copy()

    if "datetime" not in df.columns:
        raise ValueError("Dataset must contain 'datetime' column.")

    if "location" not in df.columns:
        raise ValueError("Dataset must contain 'location' column.")

    missing_cols = [col for col in WEATHER_COLS if col not in df.columns]

    if missing_cols:
        raise ValueError(f"Missing required columns: {missing_cols}")

    df["datetime"] = pd.to_datetime(df["datetime"], errors="coerce")
    df = df.dropna(subset=["datetime", "location"])

    df["location"] = df["location"].astype(str)
    df = df.sort_values(["location", "datetime"]).reset_index(drop=True)

    for col in WEATHER_COLS:
        df[col] = pd.to_numeric(df[col], errors="coerce")

        df[col] = (
            df.groupby("location")[col]
            .transform(lambda s: s.ffill().bfill())
        )

    return df


# ===============================
# BASE HISTORICAL FEATURES
# ===============================
def create_base_features(df, label_encoder=None, fit_encoder=False):
    df = clean_weather_data(df)

    if fit_encoder:
        label_encoder = LabelEncoder()
        df["location_enc"] = label_encoder.fit_transform(df["location"])
    else:
        if label_encoder is None:
            raise ValueError("label_encoder is required when fit_encoder=False")

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

    # Lag, rolling, std, trend features
    for col in WEATHER_COLS:
        grouped = df.groupby("location")[col]

        df[f"{col}_lag0"] = df[col]

        for lag in LAGS:
            df[f"{col}_lag{lag}"] = grouped.shift(lag)

        for win in ROLL_WINDOWS:
            df[f"{col}_roll{win}"] = grouped.transform(
                lambda s: s.rolling(window=win, min_periods=win).mean()
            )

        for win in STD_WINDOWS:
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

    # Solar-specific features using only solarradiation
    df["solar_lag1_minus_lag7"] = df["solarradiation_lag1"] - df["solarradiation_lag7"]
    df["solar_lag1_minus_roll7"] = df["solarradiation_lag1"] - df["solarradiation_roll7"]
    df["solar_roll7_minus_roll14"] = df["solarradiation_roll7"] - df["solarradiation_roll14"]
    df["solar_roll3_minus_roll7"] = df["solarradiation_roll3"] - df["solarradiation_roll7"]

    df["solar_std7_to_roll7_ratio"] = (
        df["solarradiation_std7"] /
        (df["solarradiation_roll7"].abs() + 1e-6)
    )

    return df, label_encoder


# ===============================
# HORIZON FEATURES
# ===============================
def add_horizon_features(df, horizon):
    df = df.copy()

    df["horizon"] = horizon
    df["target_datetime"] = df["datetime"] + pd.to_timedelta(horizon, unit="D")

    df["target_month"] = df["target_datetime"].dt.month
    df["target_dayofyear"] = df["target_datetime"].dt.dayofyear

    df = add_cyclic_features(
        df,
        prefix="target",
        month_col="target_month",
        day_col="target_dayofyear"
    )

    return df


# ===============================
# TARGET TRANSFORM
# ===============================
def transform_target(target, y):
    y = np.array(y, dtype=float)

    if target in LOG_TARGETS:
        y = np.maximum(y, 0)
        return np.log1p(y)

    return y


def inverse_transform_target(target, y_pred):
    y_pred = np.array(y_pred, dtype=float)

    if target in LOG_TARGETS:
        return np.expm1(y_pred)

    return y_pred


# ===============================
# POSTPROCESS
# ===============================
def postprocess_predictions(target, preds):
    preds = np.array(preds, dtype=float)

    if target == "humidity":
        preds = np.clip(preds, 0, 100)

    if target == "solarradiation":
        preds = np.maximum(preds, 0)

    return preds


# ===============================
# MODEL PARAMETERS
# ===============================
def get_model_params(target, horizon):
    if target == "solarradiation":
        return {
            "objective": "regression",
            "n_estimators": 2500,
            "learning_rate": 0.01,
            "max_depth": 5,
            "num_leaves": 24,
            "min_child_samples": 80,
            "subsample": 0.75,
            "colsample_bytree": 0.75,
            "reg_alpha": 0.5,
            "reg_lambda": 5.0,
            "random_state": 100 + horizon,
            "n_jobs": -1,
            "verbose": -1
        }

    return {
        "objective": "regression",
        "n_estimators": 2000,
        "learning_rate": 0.01,
        "max_depth": 6,
        "num_leaves": 31,
        "min_child_samples": 50,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
        "reg_alpha": 0.3,
        "reg_lambda": 3.0,
        "random_state": 42 + horizon,
        "n_jobs": -1,
        "verbose": -1
    }


# ===============================
# MAIN TRAINING
# ===============================
def main():
    print("🚀 Loading dataset...")
    df = pd.read_csv(DATA_PATH)

    print("⚙️ Creating historical features...")
    base_df, label_encoder = create_base_features(
        df,
        label_encoder=None,
        fit_encoder=True
    )

    base_df = base_df.dropna(subset=BASE_FEATURE_COLUMNS).reset_index(drop=True)

    if base_df.empty:
        raise ValueError(
            "Base dataframe is empty after feature creation. "
            "Check dataset size and missing values."
        )

    split_date = base_df["datetime"].max() - pd.Timedelta(days=VALIDATION_DAYS)

    print(f"📅 Latest data date: {base_df['datetime'].max().date()}")
    print(f"📅 Validation split date: {split_date.date()}")
    print(f"🎯 Max forecast horizon: {MAX_HORIZON} days")

    metrics = []

    for target in TARGETS:
        print("\n===================================")
        print(f"Training DIRECT models for: {target}")
        print("===================================")

        for horizon in range(1, MAX_HORIZON + 1):
            print(f"\n➡️ Training {target} | Horizon: Day +{horizon}")

            data_h = add_horizon_features(base_df, horizon)

            y_col = f"{target}_h{horizon}"

            data_h[y_col] = data_h.groupby("location")[target].shift(-horizon)

            data_h = data_h.dropna(subset=FEATURE_COLUMNS + [y_col]).reset_index(drop=True)

            train = data_h[data_h["target_datetime"] <= split_date].copy()
            test = data_h[data_h["target_datetime"] > split_date].copy()

            if train.empty or test.empty:
                print(f"⚠️ Skipping {target} horizon {horizon}: not enough train/test data.")
                continue

            X_train = train[FEATURE_COLUMNS]
            y_train_raw = train[y_col].values

            X_test = test[FEATURE_COLUMNS]
            y_test_raw = test[y_col].values

            y_train = transform_target(target, y_train_raw)
            y_test = transform_target(target, y_test_raw)

            model = LGBMRegressor(**get_model_params(target, horizon))

            model.fit(
                X_train,
                y_train,
                eval_set=[(X_test, y_test)],
                eval_metric="rmse",
                callbacks=[
                    early_stopping(stopping_rounds=100, verbose=False),
                    log_evaluation(period=0)
                ],
                categorical_feature=["location_enc"]
            )

            preds_transformed = model.predict(X_test)
            preds = inverse_transform_target(target, preds_transformed)
            preds = postprocess_predictions(target, preds)

            baseline_preds = np.full_like(
                y_test_raw,
                fill_value=np.mean(y_train_raw),
                dtype=float
            )

            model_rmse = np.sqrt(mean_squared_error(y_test_raw, preds))
            model_mae = mean_absolute_error(y_test_raw, preds)
            model_r2 = r2_score(y_test_raw, preds)

            baseline_rmse = np.sqrt(mean_squared_error(y_test_raw, baseline_preds))
            baseline_mae = mean_absolute_error(y_test_raw, baseline_preds)
            baseline_r2 = r2_score(y_test_raw, baseline_preds)

            rmse_improvement_percent = (
                ((baseline_rmse - model_rmse) / baseline_rmse) * 100
                if baseline_rmse > 0 else 0
            )

            print(f"Model RMSE    : {model_rmse:.3f}")
            print(f"Baseline RMSE : {baseline_rmse:.3f}")
            print(f"RMSE Improve  : {rmse_improvement_percent:.2f}%")
            print(f"MAE           : {model_mae:.3f}")
            print(f"R²            : {model_r2:.3f}")

            model_path = os.path.join(
                MODEL_DIR,
                f"{target}_h{horizon}_model.pkl"
            )

            joblib.dump(model, model_path)
            print(f"✅ Saved: {model_path}")

            metrics.append({
                "target": target,
                "horizon": horizon,

                "model_rmse": round(model_rmse, 5),
                "model_mae": round(model_mae, 5),
                "model_r2": round(model_r2, 5),

                "baseline_rmse": round(baseline_rmse, 5),
                "baseline_mae": round(baseline_mae, 5),
                "baseline_r2": round(baseline_r2, 5),

                "rmse_improvement_percent": round(rmse_improvement_percent, 2),

                "train_rows": len(train),
                "test_rows": len(test),
                "best_iteration": model.best_iteration_
            })

    encoder_path = os.path.join(MODEL_DIR, "location_encoder.pkl")
    joblib.dump(label_encoder, encoder_path)

    config = {
        "model_type": "direct_multi_step_forecasting",
        "max_horizon": MAX_HORIZON,
        "validation_days": VALIDATION_DAYS,

        "targets": TARGETS,
        "weather_cols": WEATHER_COLS,

        "lags": LAGS,
        "roll_windows": ROLL_WINDOWS,
        "std_windows": STD_WINDOWS,

        "log_targets": LOG_TARGETS,

        "feature_columns": FEATURE_COLUMNS,
        "base_feature_columns": BASE_FEATURE_COLUMNS
    }

    config_path = os.path.join(MODEL_DIR, "forecast_config.json")

    with open(config_path, "w") as f:
        json.dump(config, f, indent=4)

    metrics_df = pd.DataFrame(metrics)
    metrics_path = os.path.join(MODEL_DIR, "direct_forecast_metrics.csv")
    metrics_df.to_csv(metrics_path, index=False)

    print("\n🎉 Direct Multi-Step Training Completed!")
    print(f"✅ Encoder saved: {encoder_path}")
    print(f"✅ Config saved : {config_path}")
    print(f"✅ Metrics saved: {metrics_path}")

    if not metrics_df.empty:
        print("\n--------------------------------")
        print("📊 Average result by target")
        print("--------------------------------")

        summary = metrics_df.groupby("target").agg({
            "model_rmse": "mean",
            "model_mae": "mean",
            "model_r2": "mean",
            "baseline_rmse": "mean",
            "rmse_improvement_percent": "mean"
        }).reset_index()

        print(summary.to_string(index=False))


if __name__ == "__main__":
    main()