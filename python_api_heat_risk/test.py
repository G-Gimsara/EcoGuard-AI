import os
import json
import time
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

from sklearn.ensemble import RandomForestRegressor, ExtraTreesRegressor, HistGradientBoostingRegressor
from sklearn.linear_model import Ridge
from lightgbm import LGBMRegressor, early_stopping, log_evaluation

# Import same feature engineering from your final training code
from train_model import (
    DATA_PATH,
    MAX_HORIZON,
    VALIDATION_DAYS,
    TARGETS,
    FEATURE_COLUMNS,
    BASE_FEATURE_COLUMNS,
    create_base_features,
    add_horizon_features,
    transform_target,
    inverse_transform_target,
    postprocess_predictions,
)


# =====================================================
# OUTPUT PATHS
# =====================================================
OUTPUT_DIR = "algorithm_comparison_results"
CHART_DIR = os.path.join(OUTPUT_DIR, "charts")

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(CHART_DIR, exist_ok=True)


# =====================================================
# CONFIG
# =====================================================
# Full proof: all 15 horizons
HORIZONS_TO_TEST = list(range(1, MAX_HORIZON + 1))

# If training is too slow, use this first:
# HORIZONS_TO_TEST = [1, 3, 7, 10, 15]


# =====================================================
# ALGORITHMS
# =====================================================
def get_algorithms(target, horizon):
    algorithms = {
        "LightGBM": LGBMRegressor(
            objective="regression",
            n_estimators=2000,
            learning_rate=0.01,
            max_depth=6,
            num_leaves=31,
            min_child_samples=50,
            subsample=0.8,
            colsample_bytree=0.8,
            reg_alpha=0.3,
            reg_lambda=3.0,
            random_state=42 + horizon,
            n_jobs=-1,
            verbose=-1
        ),

        "RandomForest": RandomForestRegressor(
            n_estimators=200,
            max_depth=14,
            min_samples_leaf=5,
            random_state=42 + horizon,
            n_jobs=-1
        ),

        "ExtraTrees": ExtraTreesRegressor(
            n_estimators=200,
            max_depth=14,
            min_samples_leaf=5,
            random_state=42 + horizon,
            n_jobs=-1
        ),

        "HistGradientBoosting": HistGradientBoostingRegressor(
            max_iter=500,
            learning_rate=0.03,
            max_leaf_nodes=31,
            l2_regularization=1.0,
            early_stopping=True,
            random_state=42 + horizon
        ),

        "RidgeRegression": Ridge(
            alpha=1.0,
            random_state=42
        )
    }

    return algorithms


# =====================================================
# WAPE / ACCURACY
# =====================================================
def accuracy_percent(y_true, y_pred, target=None):
    y_true = np.array(y_true, dtype=float)
    y_pred = np.array(y_pred, dtype=float)

    # Solar radiation has many low/zero values, so WAPE is better
    if target == "solarradiation":
        denominator = np.sum(np.abs(y_true))

        if denominator < 1e-8:
            return 0

        wape = np.sum(np.abs(y_true - y_pred)) / denominator * 100
        return max(0, 100 - wape)

    y_true_safe = np.where(np.abs(y_true) < 1e-8, 1, y_true)
    mape = np.mean(np.abs((y_true - y_pred) / y_true_safe)) * 100

    return max(0, 100 - mape)


# =====================================================
# TRAIN + EVALUATE ONE ALGORITHM
# =====================================================
def train_evaluate_algorithm(
    algorithm_name,
    model,
    X_train,
    y_train,
    X_test,
    y_test,
    y_train_raw,
    y_test_raw,
    target
):
    start_time = time.time()

    if algorithm_name == "LightGBM":
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
    else:
        model.fit(X_train, y_train)

    train_time = time.time() - start_time

    preds_transformed = model.predict(X_test)
    preds = inverse_transform_target(target, preds_transformed)
    preds = postprocess_predictions(target, preds)

    rmse = np.sqrt(mean_squared_error(y_test_raw, preds))
    mae = mean_absolute_error(y_test_raw, preds)
    r2 = r2_score(y_test_raw, preds)
    acc = accuracy_percent(y_test_raw, preds, target)

    baseline_preds = np.full_like(
        y_test_raw,
        fill_value=np.mean(y_train_raw),
        dtype=float
    )

    baseline_rmse = np.sqrt(mean_squared_error(y_test_raw, baseline_preds))
    baseline_mae = mean_absolute_error(y_test_raw, baseline_preds)
    baseline_r2 = r2_score(y_test_raw, baseline_preds)

    improvement = (
        ((baseline_rmse - rmse) / baseline_rmse) * 100
        if baseline_rmse > 0 else 0
    )

    return {
        "algorithm": algorithm_name,
        "model_rmse": round(rmse, 5),
        "model_mae": round(mae, 5),
        "model_r2": round(r2, 5),
        "accuracy_percent": round(acc, 2),
        "baseline_rmse": round(baseline_rmse, 5),
        "baseline_mae": round(baseline_mae, 5),
        "baseline_r2": round(baseline_r2, 5),
        "rmse_improvement_percent": round(improvement, 2),
        "train_time_seconds": round(train_time, 2)
    }


# =====================================================
# PLOT: AVERAGE RMSE BY ALGORITHM
# =====================================================
def plot_average_rmse(summary_df):
    plt.figure(figsize=(10, 5))
    plt.bar(summary_df["algorithm"], summary_df["model_rmse"])
    plt.title("Average RMSE by Algorithm")
    plt.xlabel("Algorithm")
    plt.ylabel("Average RMSE")
    plt.xticks(rotation=30)
    plt.grid(axis="y")
    plt.tight_layout()

    path = os.path.join(CHART_DIR, "average_rmse_by_algorithm.png")
    plt.savefig(path, dpi=300)
    plt.close()


# =====================================================
# PLOT: AVERAGE R2 BY ALGORITHM
# =====================================================
def plot_average_r2(summary_df):
    plt.figure(figsize=(10, 5))
    plt.bar(summary_df["algorithm"], summary_df["model_r2"])
    plt.title("Average R² by Algorithm")
    plt.xlabel("Algorithm")
    plt.ylabel("Average R²")
    plt.xticks(rotation=30)
    plt.grid(axis="y")
    plt.tight_layout()

    path = os.path.join(CHART_DIR, "average_r2_by_algorithm.png")
    plt.savefig(path, dpi=300)
    plt.close()


# =====================================================
# PLOT: RMSE BY HORIZON FOR EACH TARGET
# =====================================================
def plot_rmse_by_horizon(results_df):
    for target in results_df["target"].unique():
        df_t = results_df[results_df["target"] == target]

        plt.figure(figsize=(12, 6))

        for algorithm in df_t["algorithm"].unique():
            df_a = df_t[df_t["algorithm"] == algorithm].sort_values("horizon")

            plt.plot(
                df_a["horizon"],
                df_a["model_rmse"],
                marker="o",
                label=algorithm
            )

        plt.title(f"RMSE by Forecast Horizon - {target}")
        plt.xlabel("Forecast Horizon")
        plt.ylabel("RMSE")
        plt.legend()
        plt.grid(True)
        plt.tight_layout()

        path = os.path.join(CHART_DIR, f"{target}_rmse_by_horizon_algorithm_comparison.png")
        plt.savefig(path, dpi=300)
        plt.close()


# =====================================================
# MAIN
# =====================================================
def main():
    print("🚀 Loading dataset...")
    df = pd.read_csv(DATA_PATH)

    print("⚙️ Creating same features used by final model...")
    base_df, label_encoder = create_base_features(
        df,
        label_encoder=None,
        fit_encoder=True
    )

    base_df = base_df.dropna(subset=BASE_FEATURE_COLUMNS).reset_index(drop=True)

    if base_df.empty:
        raise ValueError("Base dataframe is empty after feature creation.")

    split_date = base_df["datetime"].max() - pd.Timedelta(days=VALIDATION_DAYS)

    print(f"📅 Latest date: {base_df['datetime'].max().date()}")
    print(f"📅 Validation split date: {split_date.date()}")
    print(f"🔮 Horizons tested: {HORIZONS_TO_TEST}")

    all_results = []

    for target in TARGETS:
        print("\n=====================================")
        print(f"Target: {target}")
        print("=====================================")

        for horizon in HORIZONS_TO_TEST:
            print(f"\n➡️ Horizon +{horizon}")

            data_h = add_horizon_features(base_df, horizon)

            y_col = f"{target}_h{horizon}"
            data_h[y_col] = data_h.groupby("location")[target].shift(-horizon)

            data_h = data_h.dropna(subset=FEATURE_COLUMNS + [y_col]).reset_index(drop=True)

            train = data_h[data_h["target_datetime"] <= split_date].copy()
            test = data_h[data_h["target_datetime"] > split_date].copy()

            if train.empty or test.empty:
                print(f"⚠️ Skipping {target} horizon {horizon}: not enough data.")
                continue

            X_train = train[FEATURE_COLUMNS]
            y_train_raw = train[y_col].values

            X_test = test[FEATURE_COLUMNS]
            y_test_raw = test[y_col].values

            y_train = transform_target(target, y_train_raw)
            y_test = transform_target(target, y_test_raw)

            algorithms = get_algorithms(target, horizon)

            for algorithm_name, model in algorithms.items():
                print(f"Training {algorithm_name}...")

                try:
                    result = train_evaluate_algorithm(
                        algorithm_name=algorithm_name,
                        model=model,
                        X_train=X_train,
                        y_train=y_train,
                        X_test=X_test,
                        y_test=y_test,
                        y_train_raw=y_train_raw,
                        y_test_raw=y_test_raw,
                        target=target
                    )

                    result.update({
                        "target": target,
                        "horizon": horizon,
                        "train_rows": len(train),
                        "test_rows": len(test)
                    })

                    all_results.append(result)

                    print(
                        f"{algorithm_name} | "
                        f"RMSE: {result['model_rmse']:.3f} | "
                        f"MAE: {result['model_mae']:.3f} | "
                        f"R²: {result['model_r2']:.3f} | "
                        f"Improve: {result['rmse_improvement_percent']:.2f}%"
                    )

                except Exception as e:
                    print(f"❌ {algorithm_name} failed: {e}")

    results_df = pd.DataFrame(all_results)

    if results_df.empty:
        raise ValueError("No algorithm comparison results generated.")

    full_path = os.path.join(OUTPUT_DIR, "algorithm_comparison_full.csv")
    results_df.to_csv(full_path, index=False)

    summary_df = (
        results_df
        .groupby("algorithm")
        .agg({
            "model_rmse": "mean",
            "model_mae": "mean",
            "model_r2": "mean",
            "accuracy_percent": "mean",
            "baseline_rmse": "mean",
            "rmse_improvement_percent": "mean",
            "train_time_seconds": "mean"
        })
        .reset_index()
        .sort_values("model_rmse", ascending=True)
    )

    summary_path = os.path.join(OUTPUT_DIR, "algorithm_comparison_summary.csv")
    summary_df.to_csv(summary_path, index=False)

    target_summary_df = (
        results_df
        .groupby(["target", "algorithm"])
        .agg({
            "model_rmse": "mean",
            "model_mae": "mean",
            "model_r2": "mean",
            "rmse_improvement_percent": "mean",
            "accuracy_percent": "mean"
        })
        .reset_index()
        .sort_values(["target", "model_rmse"], ascending=[True, True])
    )

    target_summary_path = os.path.join(OUTPUT_DIR, "algorithm_comparison_by_target.csv")
    target_summary_df.to_csv(target_summary_path, index=False)

    best_by_target = (
        target_summary_df
        .sort_values(["target", "model_rmse"], ascending=[True, True])
        .groupby("target")
        .head(1)
        .reset_index(drop=True)
    )

    best_by_target_path = os.path.join(OUTPUT_DIR, "best_algorithm_by_target.csv")
    best_by_target.to_csv(best_by_target_path, index=False)

    print("\n--------------------------------")
    print("✅ OVERALL ALGORITHM SUMMARY")
    print("--------------------------------")
    print(summary_df.to_string(index=False))

    print("\n--------------------------------")
    print("✅ BEST ALGORITHM BY TARGET")
    print("--------------------------------")
    print(best_by_target.to_string(index=False))

    print("\n📊 Generating charts...")
    plot_average_rmse(summary_df)
    plot_average_r2(summary_df)
    plot_rmse_by_horizon(results_df)

    print("\n🎉 Algorithm comparison completed!")
    print(f"✅ Full results saved       : {full_path}")
    print(f"✅ Summary saved            : {summary_path}")
    print(f"✅ Target summary saved     : {target_summary_path}")
    print(f"✅ Best algorithm saved     : {best_by_target_path}")
    print(f"✅ Charts saved inside      : {CHART_DIR}")


if __name__ == "__main__":
    main()