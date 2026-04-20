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
from typing import Optional, List, Literal
from pydantic import BaseModel

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

device      = torch.device("cuda" if torch.cuda.is_available() else "cpu")
num_classes = 3

# ✅ FIXED: alphabetical order to match ImageFolder training order
class_names = ["bleach_1_40", "bleach_40_100", "healthy_corals"]

model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
model.fc = nn.Linear(model.fc.in_features, num_classes)
model.load_state_dict(torch.load("my_model.pth", map_location=device))
model = model.to(device)
model.eval()

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])


async def get_coral_suggestions(
    raw_prediction,
    role=None,
    coral_area="", coast="", rivers="",
    ph_value="", ph_status="",
    turbidity_ntu="", turbidity_status="",
    temperature="", temp_status=""
) -> str:

    has_water = any([ph_value, turbidity_ntu, temperature])
    water_section = ""
    if has_water:
        water_section = f"""
Current river water quality at {coral_area}:
- pH         : {ph_value} → status: {ph_status}  (coral safe range: 8.0–8.3)
- Turbidity  : {turbidity_ntu} NTU → status: {turbidity_status}  (coral safe range: 0–10 NTU)
- Temperature: {temperature}°C → status: {temp_status}  (coral safe range: 23–29°C)
Affecting rivers: {rivers}"""

    # ✅ FIXED: updated condition_map keys to match new class_names order
    condition_map = {
        "bleach_1_40":    "BLEACHED 1–40% — partial bleaching detected",
        "bleach_40_100":  "BLEACHED 40–100% — severe bleaching detected",
        "healthy_corals": "HEALTHY — no visible bleaching detected",
    }
    coral_condition = condition_map.get(raw_prediction, raw_prediction)

    core_instruction = f"""
IMPORTANT RULES:
1. The coral condition ({coral_condition}) comes ONLY from image analysis by a trained AI model. Do NOT use water quality to change or doubt this diagnosis.
2. Water quality assessment is SEPARATE — assess whether current water conditions support coral health independently.
3. If coral is bleached but water quality is currently good, explain that bleaching may have been caused by PAST conditions, other stressors (e.g. sedimentation, disease, physical damage), or the bleaching is ongoing and water quality alone does not reverse it.
4. Never say the coral is healthy just because water quality is currently good.
5. Be location-specific for {coral_area}, {coast}, Sri Lanka."""

    if role == "researcher":
        system_prompt = "You are a marine biologist specializing in coral reef ecology in Sri Lanka. Give scientific, evidence-based analysis."
        prompt = f"""Location: {coral_area}, {coast}, Sri Lanka
Coral image AI diagnosis: {coral_condition}
{water_section}
{core_instruction}

Provide a scientific report with:
1. Coral condition analysis — what does {coral_condition} mean for this reef at {coral_area}? What are likely causes specific to this location?
2. Water quality analysis — assess each parameter independently. Is the current river water safe for corals? (Do NOT use this to change the coral diagnosis.)
3. If bleaching is detected despite good water quality — explain possible reasons (past thermal events, disease, physical damage, historical pollution from {rivers}).
4. 3 specific research actions to take at {coral_area}.
Keep responses concise and scientific."""

    elif role == "tourism_guide":
        system_prompt = "You are a marine conservation expert and tourism guide for Sri Lanka coral reefs. Give practical, visitor-friendly advice."
        prompt = f"""Location: {coral_area}, {coast}, Sri Lanka
Coral image AI diagnosis: {coral_condition}
{water_section}
{core_instruction}

Provide tourist-focused guidance:
1. What is the current state of the coral reef at {coral_area}? (Based on the AI image diagnosis — do NOT override with water quality.)
2. Is it worth visiting for snorkeling/diving right now given the coral condition?
3. What does the current water quality mean for the visitor experience?
4. 3 responsible tourism tips specific to {coral_area}.
Use simple, friendly language."""

    else:
        system_prompt = "You are a friendly marine biologist explaining coral reef health to the public in simple language."
        prompt = f"""Location: {coral_area}, {coast}, Sri Lanka
Coral image AI diagnosis: {coral_condition}
{water_section}
{core_instruction}

Explain in simple language:
1. What is happening to the coral at {coral_area}? (Use the AI image diagnosis — do NOT change it based on water quality.)
2. What does the current river water quality mean for this reef? Are conditions safe for coral right now?
3. If the coral is bleached but water looks okay — explain in simple terms why this can happen (e.g. past heatwaves, other damage).
4. 3 simple things the public can do to help protect {coral_area}.
Keep it easy to understand."""

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": prompt}
            ],
            tools=[{"type": "web_search_preview"}],
            max_tokens=600,
            temperature=0.5
        )
        return response.choices[0].message.content.strip()

    except Exception:
        try:
            response = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user",   "content": prompt}
                ],
                max_tokens=600,
                temperature=0.5
            )
            return response.choices[0].message.content.strip()
        except Exception as e2:
            return f"Unable to generate suggestions. Error: {str(e2)}"


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class ChatRequest(BaseModel):
    message: str
    role: Optional[str] = "researcher"
    coral_area: Optional[str] = ""
    coast: Optional[str] = ""
    rivers: Optional[str] = ""
    ph_value: Optional[str] = ""
    ph_status: Optional[str] = ""
    turbidity_ntu: Optional[str] = ""
    turbidity_status: Optional[str] = ""
    temperature: Optional[str] = ""
    temp_status: Optional[str] = ""
    prediction: Optional[str] = ""
    history: Optional[List[ChatMessage]] = None


@app.post("/chat")
async def chat(req: ChatRequest):
    has_water = any([req.ph_value, req.turbidity_ntu, req.temperature])
    water_section = ""
    if has_water:
        water_section = f"""
Current river water quality at {req.coral_area}:
- pH         : {req.ph_value} → status: {req.ph_status}  (coral safe range: 8.0–8.3)
- Turbidity  : {req.turbidity_ntu} NTU → status: {req.turbidity_status}  (coral safe range: 0–10 NTU)
- Temperature: {req.temperature}°C → status: {req.temp_status}  (coral safe range: 23–29°C)
Affecting rivers: {req.rivers}"""

    base_rules = f"""
You are a coral reef assistant for Sri Lanka.
You must answer using the given location and real-time IoT water-quality values.
If a value is missing, say it's not available.
Be concise, practical, and avoid guessing numbers.
Location: {req.coral_area}, {req.coast}, Sri Lanka.
If provided, image diagnosis/prediction is: {req.prediction or "N/A"}.
{water_section}
"""

    if req.role == "tourism_guide":
        system_prompt = "You are a marine conservation expert and tourism guide for Sri Lanka coral reefs. Give practical, visitor-friendly advice."
    elif req.role == "general":
        system_prompt = "You are a friendly marine biologist explaining coral reef health to the public in simple language."
    else:
        system_prompt = "You are a marine biologist specializing in coral reef ecology in Sri Lanka. Give scientific, evidence-based analysis."

    messages = [{"role": "system", "content": system_prompt + "\n" + base_rules}]
    if req.history:
        for m in req.history[-12:]:
            messages.append({"role": m.role, "content": m.content})
    messages.append({"role": "user", "content": req.message})

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            tools=[{"type": "web_search_preview"}],
            max_tokens=500,
            temperature=0.4,
        )
        content = (response.choices[0].message.content or "").strip()
        return JSONResponse({"reply": content})
    except Exception:
        try:
            response = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                max_tokens=500,
                temperature=0.4,
            )
            content = (response.choices[0].message.content or "").strip()
            return JSONResponse({"reply": content})
        except Exception as e2:
            return JSONResponse({"error": str(e2)}, status_code=500)


@app.post("/predict")
async def predict(
    file:             UploadFile    = File(...),
    role:             str           = Form(None),
    coral_area:       Optional[str] = Form(""),
    coast:            Optional[str] = Form(""),
    rivers:           Optional[str] = Form(""),
    ph_value:         Optional[str] = Form(""),
    ph_status:        Optional[str] = Form(""),
    turbidity_ntu:    Optional[str] = Form(""),
    turbidity_status: Optional[str] = Form(""),
    temperature:      Optional[str] = Form(""),
    temp_status:      Optional[str] = Form(""),
):
    try:
        image      = Image.open(file.file).convert("RGB")
        img_tensor = transform(image).unsqueeze(0).to(device)

        with torch.no_grad():
            outputs  = model(img_tensor)
            pred_idx = torch.argmax(outputs, 1).item()

        # ✅ FIXED: friendly_messages keys match new class_names order
        friendly_messages = {
            "bleach_1_40":    "Coral bleached 1–40%",
            "bleach_40_100":  "Coral bleached 40–100%",
            "healthy_corals": "Healthy coral",
        }
        raw_prediction = class_names[pred_idx]
        prediction     = friendly_messages.get(raw_prediction, raw_prediction)

        suggestions = await get_coral_suggestions(
            raw_prediction, role,
            coral_area, coast, rivers,
            ph_value, ph_status,
            turbidity_ntu, turbidity_status,
            temperature, temp_status
        )

        return JSONResponse({
            "prediction":  prediction,
            "suggestions": suggestions
        })

    except Exception as e:
        return JSONResponse({"error": str(e)})