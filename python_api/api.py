from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse
from PIL import Image
import torch
from torchvision import models, transforms
import torch.nn as nn
from openai import OpenAI
import os
from dotenv import load_dotenv
from typing import Optional

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY not found in .env file")
openai_client = OpenAI(api_key=OPENAI_API_KEY)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

device     = torch.device("cuda" if torch.cuda.is_available() else "cpu")
num_classes = 3
class_names = ["healthy_corals", "bleach_1_40", "bleach_40_100"]

model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
model.fc = nn.Linear(model.fc.in_features, num_classes)
model.load_state_dict(torch.load("my_model.pth", map_location=device))
model = model.to(device)
model.eval()

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])
])

# ── AI suggestions with water quality data ──
async def get_coral_suggestions(
    prediction: str,
    role: str = None,
    ph_value: str = "",
    ph_status: str = "",
    turbidity_ntu: str = "",
    turbidity_status: str = "",
    temperature: str = "",
    temp_status: str = ""
) -> str:
    try:
        # Build water quality context
        water_context = ""
        if ph_value or turbidity_ntu or temperature:
            water_context = f"""
Current live water quality readings from IoT sensors:
- pH Level      : {ph_value} ({ph_status}) — Safe range: 8.0–8.3
- Turbidity     : {turbidity_ntu} NTU ({turbidity_status}) — Safe range: 0–10 NTU
- Water Temp    : {temperature} °C ({temp_status}) — Safe range: 23–29 °C
"""

        # Build prompts based on role
        if role == "researcher":
            system_prompt = "You are a marine biologist. Be concise and scientific."
            if prediction == "healthy_corals":
                prompt = f"Coral image shows healthy coral.{water_context}\nGive 3 short scientific monitoring actions considering the water quality data (1 sentence each)."
            elif prediction == "bleach_1_40":
                prompt = f"Coral image shows 1-40% bleaching.{water_context}\nGive 3 short scientific research actions considering the water quality data (1 sentence each)."
            else:
                prompt = f"Coral image shows 40-100% bleaching (severe).{water_context}\nGive 3 urgent scientific actions considering the water quality data (1 sentence each)."

        elif role == "tourism_guide":
            system_prompt = "You are a marine conservation expert. Keep advice simple and visitor-friendly."
            if prediction == "healthy_corals":
                prompt = f"Coral image shows healthy coral.{water_context}\nGive 3 short tourist-friendly tips considering the water quality (1 sentence each)."
            elif prediction == "bleach_1_40":
                prompt = f"Coral image shows 1-40% bleaching.{water_context}\nGive 3 short responsible tourism tips considering the water quality (1 sentence each)."
            else:
                prompt = f"Coral image shows 40-100% bleaching (severe).{water_context}\nGive 3 short visitor warnings considering the water quality (1 sentence each)."

        else:
            system_prompt = "You are a marine biologist. Give short, practical, friendly advice."
            if prediction == "healthy_corals":
                prompt = f"Coral image shows healthy coral.{water_context}\nGive 3 short tips to protect it considering the water quality (1 sentence each)."
            elif prediction == "bleach_1_40":
                prompt = f"Coral image shows 1-40% bleaching.{water_context}\nGive 3 short recovery tips considering the water quality data (1 sentence each)."
            else:
                prompt = f"Coral image shows 40-100% bleaching (critical).{water_context}\nGive 3 urgent actions considering the water quality data (1 sentence each)."

        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": prompt}
            ],
            max_tokens=300,
            temperature=0.6
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        return f"Unable to generate suggestions. Error: {str(e)}"


# ── Prediction endpoint ────────────────────
@app.post("/predict")
async def predict(
    file:              UploadFile       = File(...),
    role:              str              = Form(None),
    ph_value:          Optional[str]    = Form(""),
    ph_status:         Optional[str]    = Form(""),
    turbidity_ntu:     Optional[str]    = Form(""),
    turbidity_status:  Optional[str]    = Form(""),
    temperature:       Optional[str]    = Form(""),
    temp_status:       Optional[str]    = Form(""),
):
    try:
        image      = Image.open(file.file).convert("RGB")
        img_tensor = transform(image).unsqueeze(0).to(device)

        with torch.no_grad():
            outputs  = model(img_tensor)
            pred_idx = torch.argmax(outputs, 1).item()

        friendly_messages = {
            "healthy_corals": "Healthy coral",
            "bleach_1_40":    "Coral bleached 1–40%",
            "bleach_40_100":  "Coral bleached 40–100%"
        }

        raw_prediction = class_names[pred_idx]
        prediction     = friendly_messages.get(raw_prediction, raw_prediction)

        # Pass water quality to AI suggestions
        suggestions = await get_coral_suggestions(
            raw_prediction,
            role,
            ph_value,
            ph_status,
            turbidity_ntu,
            turbidity_status,
            temperature,
            temp_status
        )

        return JSONResponse({
            "prediction":  prediction,
            "suggestions": suggestions
        })

    except Exception as e:
        return JSONResponse({"error": str(e)})