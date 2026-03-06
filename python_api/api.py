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
    prediction, role=None,
    coral_area="", coast="", rivers="",
    ph_value="", ph_status="",
    turbidity_ntu="", turbidity_status="",
    temperature="", temp_status=""
) -> str:
    try:
        location_context = ""
        if coral_area:
            location_context = f"\nLocation: {coral_area}, {coast}, Sri Lanka"
        if rivers:
            location_context += f"\nAffecting rivers: {rivers}"

        water_context = ""
        if ph_value or turbidity_ntu or temperature:
            water_context = f"""
Live IoT river water quality readings:
- pH         : {ph_value} ({ph_status})        — Coral safe range: 8.0–8.3
- Turbidity  : {turbidity_ntu} NTU ({turbidity_status}) — Coral safe range: 0–10 NTU
- Temperature: {temperature}°C ({temp_status})  — Coral safe range: 23–29°C"""

        if role == "researcher":
            system_prompt = """You are a marine biologist specializing in coral reef ecology in Sri Lanka.
Use your knowledge and the latest research to give scientific, specific advice.
Always consider both the image analysis and the live water quality data provided."""

            prompt = f"""Coral image at {coral_area}, Sri Lanka shows: {prediction}.
{location_context}
{water_context}

Based on this location, the affecting rivers ({rivers}), and the live water quality:
1. What are the likely causes of this coral condition at {coral_area}?
2. Give 3 specific scientific actions researchers should take.
3. How do the current river water quality readings relate to the coral condition?
Keep each point to 1-2 sentences."""

        elif role == "tourism_guide":
            system_prompt = """You are a marine conservation expert and tourism guide for Sri Lanka coral reefs.
Give practical, visitor-friendly advice based on the coral condition and water quality."""

            prompt = f"""Coral image at {coral_area}, Sri Lanka shows: {prediction}.
{location_context}
{water_context}

Based on this location and current water quality:
1. What should tourists know about visiting {coral_area} right now?
2. Give 3 responsible tourism tips to protect this reef.
3. Is it safe for snorkeling/diving given current water conditions?
Keep each point to 1-2 sentences."""

        else:
            system_prompt = """You are a friendly marine biologist explaining coral reef health to the public.
Use simple language and give practical advice about Sri Lanka coral reefs."""

            prompt = f"""Coral image at {coral_area}, Sri Lanka shows: {prediction}.
{location_context}
{water_context}

Based on this location and water quality data:
1. Explain simply what is happening to this coral and why.
2. Give 3 simple things the public can do to help protect {coral_area}.
3. How does river water quality affect this coral reef?
Keep each point to 1-2 sentences."""

        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": prompt}
            ],
            tools=[{
                "type": "web_search_preview"
            }],
            max_tokens=500,
            temperature=0.6
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        # fallback without web search if not supported
        try:
            response = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user",   "content": prompt}
                ],
                max_tokens=500,
                temperature=0.6
            )
            return response.choices[0].message.content.strip()
        except Exception as e2:
            return f"Unable to generate suggestions. Error: {str(e2)}"


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