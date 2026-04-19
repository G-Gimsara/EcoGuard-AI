""" from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import pandas as pd

from utils.prediction_logic import load_models, run_predictions
from services.weather_updater import update_weather_csv
from config.settings import CSV_PATH

app = FastAPI()
templates = Jinja2Templates(directory="templates")

# -----------------------------
# Startup event
# -----------------------------
@app.on_event("startup")
def startup_tasks():
    print("🚀 FastAPI starting...")

    # 1️⃣ Update CSV using Weather API
    update_weather_csv()

    # 2️⃣ Load updated dataset
    global df
    df = pd.read_csv(CSV_PATH)

    # 3️⃣ Load ML models
    global models
    models = load_models()

    print("✅ Startup tasks completed")


# -----------------------------
# Root check
# -----------------------------
@app.get("/")
def root():
    return {"status": "FastAPI ML service running!"}

@app.get("/predict")
def predict_json():
    predictions = run_predictions(df, models)
    return predictions


# -----------------------------
# Prediction UI
# -----------------------------
@app.get("/predict/ui", response_class=HTMLResponse)
def predict_ui(request: Request):
    predictions = run_predictions(df, models)

    return templates.TemplateResponse(
        "predictions.html",
        {
            "request": request,
            "predictions": predictions
        }
    )

 """
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import pandas as pd
import os
from apscheduler.schedulers.background import BackgroundScheduler

from utils.prediction_logic import load_models, run_predictions
from services.weather_updater import update_weather_csv
from config.settings import CSV_PATH

app = FastAPI()
templates = Jinja2Templates(directory="templates")

scheduler = BackgroundScheduler()

# -----------------------------
# Function to run every 10 min
# -----------------------------
def periodic_weather_update():
    global df

    print("⏱ Running scheduled weather update...")

    try:
        update_weather_csv()
        df = pd.read_csv(CSV_PATH)
        print("✅ Dataset updated")
    except Exception as e:
        print("❌ Scheduled update failed:", e)


# -----------------------------
# Startup event
# -----------------------------
@app.on_event("startup")
def startup_tasks():
    print("🚀 FastAPI starting...")

    # 1️⃣ Run update once at startup
    update_weather_csv()

    # 2️⃣ Load dataset
    global df
    df = pd.read_csv(CSV_PATH)

    # 3️⃣ Load ML models
    global models
    models = load_models()

    # 4️⃣ Start scheduler ONLY in main process
    if os.environ.get("RUN_MAIN") == "true" or not app.debug:

        scheduler.add_job(
            periodic_weather_update,
            "interval",
            minutes=2
        )

        scheduler.start()
        print("⏰ Scheduler started (30 min interval)")

    print("✅ Startup tasks completed")


# -----------------------------
# Shutdown event
# -----------------------------
@app.on_event("shutdown")
def shutdown_event():
    scheduler.shutdown()


# -----------------------------
# Root check
# -----------------------------
@app.get("/")
def root():
    return {"status": "FastAPI ML service running!"}


@app.get("/predict")
def predict_json():
    predictions = run_predictions(df, models)
    return predictions


# -----------------------------
# Prediction UI
# -----------------------------
@app.get("/predict/ui", response_class=HTMLResponse)
def predict_ui(request: Request):
    predictions = run_predictions(df, models)

    return templates.TemplateResponse(
        "predictions.html",
        {
            "request": request,
            "predictions": predictions
        }
    )