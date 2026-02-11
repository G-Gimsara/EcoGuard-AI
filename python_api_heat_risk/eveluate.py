import pandas as pd
import numpy as np
import joblib
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

DATA_PATH = "data/train-all 13 division 2016-2025 weather data (location,date,tempmax,humidity,dew,solarradiation).csv"

# ---------------------------------
# Create required features
# ---------------------------------
def create_required_features(df, feature_names):
    df = df.sort_values(["location", "datetime"]).copy()
    g = df.groupby("location")

    if "location_enc" in feature_names:
        df["location_enc"] = df["location"].astype("category").cat.codes

    if "month" in feature_names:
        df["month"] = df["datetime"].dt.month
        df["month_sin"] = np.sin(2*np.pi*df["month"]/12)
        df["month_cos"] = np.cos(2*np.pi*df["month"]/12)

    if "dayofyear" in feature_names:
        df["dayofyear"] = df["datetime"].dt.dayofyear
        df["doy_sin"] = np.sin(2*np.pi*df["dayofyear"]/365)
        df["doy_cos"] = np.cos(2*np.pi*df["dayofyear"]/365)

    # LAGS
    for lag in [1, 7, 14]:
        for col in ["tempmax", "humidity", "dew", "solarradiation"]:
            if f"{col}_lag{lag}" in feature_names:
                df[f"{col}_lag{lag}"] = g[col].shift(lag)

    # ROLLING
    if "temp_roll3" in feature_names:
        df["temp_roll3"] = g["tempmax"].rolling(3).mean().reset_index(level=0, drop=True)
    if "hum_roll3" in feature_names:
        df["hum_roll3"] = g["humidity"].rolling(3).mean().reset_index(level=0, drop=True)
    if "dew_roll3" in feature_names:
        df["dew_roll3"] = g["dew"].rolling(3).mean().reset_index(level=0, drop=True)

    return df.dropna()


# ---------------------------------
# Accuracy %
# ---------------------------------
def accuracy_percent(y_true, y_pred):
    y_true_safe = np.where(y_true == 0, 1, y_true)  # prevent division by zero
    mape = np.mean(np.abs((y_true - y_pred) / y_true_safe)) * 100
    return max(0, 100 - mape)


# ---------------------------------
# MAIN
# ---------------------------------
def main():
    print("🚀 Loading dataset...")
    df = pd.read_csv(DATA_PATH)
    df["datetime"] = pd.to_datetime(df["datetime"], errors="coerce")

    models = {
        "tempmax": joblib.load("models/tempmax_model.pkl"),
        "humidity": joblib.load("models/humidity_model.pkl"),
        "dew": joblib.load("models/dew_model.pkl"),
        "solarradiation": joblib.load("models/solarradiation_model.pkl"),
    }

    split_date = df["datetime"].max() - pd.Timedelta(days=60)
    df_test_raw = df[df["datetime"] > split_date]

    all_acc = []

    for target, model in models.items():
        print("\n==============================")
        print(f"Evaluating model: {target}")
        print("==============================")

        required_features = model.booster_.feature_name()
        test = create_required_features(df_test_raw.copy(), required_features)

        X_test = test[required_features]
        y_test = test[target]

        preds = model.predict(X_test)

        # optional: log-transform for solar
        if target == "solarradiation":
            y_test = np.log1p(y_test)
            preds = np.log1p(preds)

        rmse = np.sqrt(mean_squared_error(y_test, preds))
        mae = mean_absolute_error(y_test, preds)
        r2 = r2_score(y_test, preds)
        acc = accuracy_percent(y_test.values, preds)

        all_acc.append(acc)

        print(f"Number of Features                : {len(required_features)}")
        print(f"Root Mean Squared Error (RMSE)    : {rmse:.3f}")
        print(f"Mean Absolute Error (MAE)         : {mae:.3f}")
        print(f"Coefficient of Determination (R²) : {r2:.3f}")
        print(f"Accuracy (%)                      : {acc:.2f}%")

    print("\n--------------------------------")
    print(f"✅ OVERALL ACCURACY : {np.mean(all_acc):.2f}%")
    print("--------------------------------")
    print("🍃 Evaluation completed successfully ✅")


if __name__ == "__main__":
    main()
