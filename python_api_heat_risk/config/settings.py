# config/settings.py

# Open-Meteo does not require an API Key for standard usage.
VISUAL_CROSSING_API_KEY = None 

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
    "jayawardanapura": (6.885, 79.904)
}

CSV_PATH = "data/Weather_2016-01-01_to_2026-01-24.csv"


# Open-Meteo API endpoints
FORECAST_BASE = "https://api.open-meteo.com/v1/forecast"
ARCHIVE_BASE  = "https://archive-api.open-meteo.com/v1/archive"

# Backend API configuration
BACKEND_SENSOR_URL = "http://localhost:5000/api/sensors" 
KADUWELA_DEVICE_ID = "esp32-device-1" 