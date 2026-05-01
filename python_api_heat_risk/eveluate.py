import os
import json
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score


# ===============================
# PATHS
# ===============================
DATA_PATH = "data/Weather_2016-01-01_to_2026-01-24.csv"
MODEL_DIR = "models/direct_multistep"

OUTPUT_DIR = "evaluation_results"
CHART_DIR = os.path.join(OUTPUT_DIR, "charts")

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(CHART_DIR, exist_ok=True)


# ===============================
# LOAD PACKAGE
# ===============================
def load_model_package():
    config_path = os.path.join(MODEL_DIR, "forecast_config.json")
    encoder_path = os.path.join(MODEL_DIR, "location_encoder.pkl")

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

    return config, label_encoder, models


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

    df["datetime"] = pd.to_datetime(df["datetime"], errors="coerce")
    df = df.dropna(subset=["datetime", "location"])

    df["location"] = df["location"].astype(str)
    df = df.sort_values(["location", "datetime"]).reset_index(drop=True)

    for col in config["weather_cols"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")

        df[col] = (
            df.groupby("location")[col]
            .transform(lambda s: s.ffill().bfill())
        )

    return df


# ===============================
# BASE FEATURES
# ===============================
def create_base_features(df, label_encoder, config):
    df = clean_weather_data(df, config)

    df["location_enc"] = label_encoder.transform(df["location"])

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

    df["temp_humidity_lag0"] = df["tempmax_lag0"] * df["humidity_lag0"]
    df["solar_temp_lag0"] = df["solarradiation_lag0"] * df["tempmax_lag0"]
    df["solar_humidity_lag0"] = df["solarradiation_lag0"] * df["humidity_lag0"]

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
# INVERSE TRANSFORM
# ===============================
def inverse_transform_prediction(target, preds, config):
    preds = np.array(preds, dtype=float)

    if target in config.get("log_targets", []):
        preds = np.expm1(preds)

    return preds


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
# ACCURACY PERCENT
# ===============================
def accuracy_percent(y_true, y_pred, target=None):
    y_true = np.array(y_true, dtype=float)
    y_pred = np.array(y_pred, dtype=float)

    if target == "solarradiation":
        denominator = np.sum(np.abs(y_true))

        if denominator < 1e-8:
            return 0

        wape = np.sum(np.abs(y_true - y_pred)) / denominator * 100
        return max(0, 100 - wape)

    y_true_safe = np.where(np.abs(y_true) < 1e-8, 1, y_true)
    mape = np.mean(np.abs((y_true - y_pred) / y_true_safe)) * 100

    return max(0, 100 - mape)


# ===============================
# EVALUATE ONE TARGET + HORIZON
# ===============================
def evaluate_target_horizon(base_df, target, horizon, model, config, split_date):
    feature_columns = config["feature_columns"]

    data_h = add_horizon_features(base_df, horizon)

    y_col = f"{target}_actual_h{horizon}"
    data_h[y_col] = data_h.groupby("location")[target].shift(-horizon)

    data_h = data_h.dropna(subset=feature_columns + [y_col]).reset_index(drop=True)

    train_part = data_h[data_h["target_datetime"] <= split_date].copy()
    test_part = data_h[data_h["target_datetime"] > split_date].copy()

    if train_part.empty or test_part.empty:
        return None, None

    X_test = test_part[feature_columns]
    y_true = test_part[y_col].values

    preds = model.predict(X_test)
    preds = inverse_transform_prediction(target, preds, config)
    preds = postprocess_predictions(target, preds)

    baseline_preds = np.full_like(
        y_true,
        fill_value=train_part[y_col].mean(),
        dtype=float
    )

    model_rmse = np.sqrt(mean_squared_error(y_true, preds))
    model_mae = mean_absolute_error(y_true, preds)
    model_r2 = r2_score(y_true, preds)

    baseline_rmse = np.sqrt(mean_squared_error(y_true, baseline_preds))
    baseline_mae = mean_absolute_error(y_true, baseline_preds)
    baseline_r2 = r2_score(y_true, baseline_preds)

    improvement = (
        ((baseline_rmse - model_rmse) / baseline_rmse) * 100
        if baseline_rmse > 0 else 0
    )

    acc = accuracy_percent(y_true, preds, target)

    metric = {
        "target": target,
        "horizon": horizon,

        "model_rmse": round(model_rmse, 5),
        "model_mae": round(model_mae, 5),
        "model_r2": round(model_r2, 5),

        "baseline_rmse": round(baseline_rmse, 5),
        "baseline_mae": round(baseline_mae, 5),
        "baseline_r2": round(baseline_r2, 5),

        "rmse_improvement_percent": round(improvement, 2),
        "accuracy_percent": round(acc, 2),

        "test_rows": len(test_part)
    }

    predictions = pd.DataFrame({
        "location": test_part["location"].values,
        "anchor_datetime": test_part["datetime"].values,
        "target_datetime": test_part["target_datetime"].values,
        "target": target,
        "horizon": horizon,
        "actual": y_true,
        "predicted": preds,
        "baseline_predicted": baseline_preds,
        "error": y_true - preds,
        "absolute_error": np.abs(y_true - preds)
    })

    return metric, predictions


# ===============================
# CHARTS
# ===============================
def plot_metric_by_horizon(metrics_df, metric_name, ylabel):
    for target in metrics_df["target"].unique():
        df_t = metrics_df[metrics_df["target"] == target].sort_values("horizon")

        plt.figure(figsize=(10, 5))
        plt.plot(df_t["horizon"], df_t[metric_name], marker="o")
        plt.title(f"{ylabel} by Forecast Horizon - {target}")
        plt.xlabel("Forecast Horizon")
        plt.ylabel(ylabel)
        plt.grid(True)
        plt.tight_layout()

        path = os.path.join(CHART_DIR, f"{target}_{metric_name}_by_horizon.png")
        plt.savefig(path, dpi=300)
        plt.close()


def plot_model_vs_baseline_rmse(metrics_df):
    for target in metrics_df["target"].unique():
        df_t = metrics_df[metrics_df["target"] == target].sort_values("horizon")

        plt.figure(figsize=(10, 5))
        plt.plot(df_t["horizon"], df_t["model_rmse"], marker="o", label="Model RMSE")
        plt.plot(df_t["horizon"], df_t["baseline_rmse"], marker="o", label="Baseline RMSE")
        plt.title(f"Model RMSE vs Baseline RMSE - {target}")
        plt.xlabel("Forecast Horizon")
        plt.ylabel("RMSE")
        plt.legend()
        plt.grid(True)
        plt.tight_layout()

        path = os.path.join(CHART_DIR, f"{target}_model_vs_baseline_rmse.png")
        plt.savefig(path, dpi=300)
        plt.close()


# ===============================
# MAIN
# ===============================
def main():
    print("🚀 Loading dataset...")
    df = pd.read_csv(DATA_PATH)

    print("📦 Loading models...")
    config, label_encoder, models = load_model_package()

    print("⚙️ Creating base features...")
    base_df = create_base_features(df, label_encoder, config)

    base_df = base_df.dropna(subset=config["base_feature_columns"]).reset_index(drop=True)

    validation_days = config.get("validation_days", 365)
    split_date = base_df["datetime"].max() - pd.Timedelta(days=validation_days)

    print(f"📅 Latest date: {base_df['datetime'].max().date()}")
    print(f"📅 Validation split date: {split_date.date()}")

    all_metrics = []
    all_predictions = []

    for target in config["targets"]:
        print("\n==============================")
        print(f"Evaluating target: {target}")
        print("==============================")

        for horizon in range(1, config["max_horizon"] + 1):
            if target not in models or horizon not in models[target]:
                print(f"⚠️ Missing model for {target}, horizon {horizon}")
                continue

            metric, predictions = evaluate_target_horizon(
                base_df=base_df,
                target=target,
                horizon=horizon,
                model=models[target][horizon],
                config=config,
                split_date=split_date
            )

            if metric is None:
                continue

            all_metrics.append(metric)
            all_predictions.append(predictions)

            print(
                f"H+{horizon:02d} | "
                f"Model RMSE: {metric['model_rmse']:.3f} | "
                f"Baseline RMSE: {metric['baseline_rmse']:.3f} | "
                f"Improve: {metric['rmse_improvement_percent']:.2f}% | "
                f"R²: {metric['model_r2']:.3f}"
            )

    metrics_df = pd.DataFrame(all_metrics)
    predictions_df = pd.concat(all_predictions, ignore_index=True)

    metrics_path = os.path.join(OUTPUT_DIR, "direct_multistep_horizon_metrics.csv")
    predictions_path = os.path.join(OUTPUT_DIR, "direct_multistep_predictions.csv")
    summary_path = os.path.join(OUTPUT_DIR, "overall_summary.csv")

    metrics_df.to_csv(metrics_path, index=False)
    predictions_df.to_csv(predictions_path, index=False)

    summary = metrics_df.groupby("target").agg({
        "model_rmse": "mean",
        "model_mae": "mean",
        "model_r2": "mean",
        "baseline_rmse": "mean",
        "rmse_improvement_percent": "mean",
        "accuracy_percent": "mean",
        "test_rows": "sum"
    }).reset_index()

    summary.to_csv(summary_path, index=False)

    print("\n--------------------------------")
    print("✅ OVERALL SUMMARY")
    print("--------------------------------")
    print(summary.to_string(index=False))

    print("\n📊 Generating charts...")

    plot_metric_by_horizon(metrics_df, "model_rmse", "Model RMSE")
    plot_metric_by_horizon(metrics_df, "model_mae", "Model MAE")
    plot_metric_by_horizon(metrics_df, "model_r2", "Model R²")
    plot_metric_by_horizon(metrics_df, "accuracy_percent", "Accuracy %")
    plot_metric_by_horizon(metrics_df, "rmse_improvement_percent", "RMSE Improvement %")
    plot_model_vs_baseline_rmse(metrics_df)

    print("\n🎉 Evaluation completed!")
    print(f"✅ Metrics saved     : {metrics_path}")
    print(f"✅ Predictions saved : {predictions_path}")
    print(f"✅ Summary saved     : {summary_path}")
    print(f"✅ Charts saved in   : {CHART_DIR}")


if __name__ == "__main__":
    main()