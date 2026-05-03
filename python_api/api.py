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

class_names = ["bleach_11_50", "bleach_50_100", "healthy_corals"]

model = models.efficientnet_b0(weights=None)
model.classifier[1] = nn.Linear(
    model.classifier[1].in_features,
    num_classes
)
model.load_state_dict(
    torch.load("efficientnetb0_model.pth", map_location=device)
)
model = model.to(device)
model.eval()

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# ─────────────────────────────────────────────────────────────
#  RESEARCH CONTEXT
#  IoT sensors measure INLAND river water quality.
#  Degraded inland water flows downstream into coral reef zones.
#  pH < 6.5  = acidic (agri/industrial runoff, acid rain)
#  pH > 8.5  = alkaline (household soap/detergent, sewage)
#  Both extremes stress/bleach coral when they reach the reef.
# ─────────────────────────────────────────────────────────────

CORE_RULES = """Rules:
- Coral diagnosis comes from the AI image model only — do not override with water data.
- Sensor data is INLAND river water, not seawater. Explain the inland-to-reef pollution pathway.
- pH < 6.5 = acidic pollution (agri chemicals, acid rain, industrial waste).
- pH > 8.5 = alkaline pollution (household soap, detergent, sewage effluent).
- Connect inland pH extremes to coral bleaching where relevant.
- If coral is bleached but water is currently safe, consider past pollution events or other stressors."""


def inland_ph_label(ph_str: str) -> str:
    """One-line pH label — concise, low token cost."""
    try:
        ph = float(ph_str)
    except (ValueError, TypeError):
        return ""
    if ph < 6.5:
        return f"ACIDIC ({ph}) — likely agri/industrial runoff; acidifies reef water downstream"
    elif ph > 8.5:
        return f"ALKALINE ({ph}) — likely household soap/detergent/sewage; chemical stress to reef"
    return f"SAFE ({ph}) — within 6.5–8.5 inland safe range"


def build_water_section(
    coral_area: str, rivers: str,
    ph_value: str, ph_status: str,
    turbidity_ntu: str, turbidity_status: str,
    temperature: str, temp_status: str,
) -> str:
    """Build the water quality block. Returns empty string if no data."""
    if not any([ph_value, turbidity_ntu, temperature]):
        return ""
    ph_label = inland_ph_label(ph_value) if ph_value else "N/A"
    return (
        f"Inland river sensor readings (rivers flowing INTO {coral_area} reef — not seawater):\n"
        f"  pH         : {ph_value or 'N/A'} — {ph_label}\n"
        f"  Turbidity  : {turbidity_ntu or 'N/A'} NTU ({turbidity_status}) — safe ≤10 NTU\n"
        f"  Temperature: {temperature or 'N/A'}°C ({temp_status}) — safe 23–29°C\n"
        f"  Rivers     : {rivers}\n"
        f"Research context: acidic (<6.5) or alkaline (>8.5) inland water flows downstream and stresses coral."
    )


async def call_openai(messages: list, max_tokens: int = 500, temperature: float = 0.5) -> str:
    """Call gpt-4o-mini with web search fallback. Returns text content."""
    for use_tools in [True, False]:
        try:
            kwargs = dict(
                model="gpt-4o-mini",
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )
            if use_tools:
                kwargs["tools"] = [{"type": "web_search_preview"}]
            response = openai_client.chat.completions.create(**kwargs)
            return (response.choices[0].message.content or "").strip()
        except Exception as e:
            if not use_tools:
                return f"Unable to generate response. Error: {str(e)}"
    return "Unable to generate response."


async def get_coral_suggestions(
    raw_prediction: str,
    role: str = None,
    coral_area: str = "",
    coast: str = "",
    rivers: str = "",
    ph_value: str = "",
    ph_status: str = "",
    turbidity_ntu: str = "",
    turbidity_status: str = "",
    temperature: str = "",
    temp_status: str = "",
) -> str:

    condition_map = {
        "bleach_11_50":   "partial bleaching (11–50%)",
        "bleach_50_100":  "severe bleaching (50–100%)",
        "healthy_corals": "healthy — no visible bleaching",
    }
    coral_condition = condition_map.get(raw_prediction, raw_prediction)

    water = build_water_section(
        coral_area, rivers,
        ph_value, ph_status,
        turbidity_ntu, turbidity_status,
        temperature, temp_status,
    )

    header = (
        f"Location: {coral_area}, {coast}, Sri Lanka\n"
        f"Coral AI image diagnosis: {coral_condition}\n"
        f"{water}\n"
        f"{CORE_RULES}\n\n"
    )

    if role == "researcher":
        system_prompt = (
            "You are a marine biologist specializing in inland-to-reef "
            "pollution pathways in Sri Lanka. Be scientific and concise."
        )
        user_prompt = header + (
            "Provide a concise scientific report:\n"
            "1. Coral condition — what does this diagnosis mean for this reef and what are likely causes?\n"
            "2. Inland water quality — is pH acidic or alkaline, what pollution source is likely, "
            "and how does it threaten the reef when it arrives downstream?\n"
            "3. Inland-to-reef pathway — how does river water travel to the reef and what lag time exists?\n"
            "4. Three specific field research actions for this site."
        )

    elif role == "tourism_guide":
        system_prompt = (
            "You are an eco-tourism and marine conservation guide for Sri Lanka coral reefs. "
            "Use clear, visitor-friendly language."
        )
        user_prompt = header + (
            "Provide visitor-focused guidance:\n"
            "1. Is the reef worth visiting for snorkeling/diving based on the coral diagnosis?\n"
            "2. Explain what the inland river readings mean for the visitor experience — "
            "if pH < 6.5 describe it as farm/acid runoff; if pH > 8.5 describe it as "
            "soapy household or detergent waste flowing toward the reef.\n"
            "3. Three responsible tourism tips specific to this reef site."
        )

    else:
        system_prompt = (
            "You are a friendly marine biologist explaining coral reef health "
            "and river pollution to the Sri Lankan public. Use simple, clear language."
        )
        user_prompt = header + (
            "Explain in simple language:\n"
            "1. What is happening to the coral here based on the AI diagnosis?\n"
            "2. What do the river readings mean — if pH < 6.5 say it is acidic runoff from "
            "farms or factories; if pH > 8.5 say it is soapy or detergent-like household "
            "waste — and explain how this travels downstream and affects the reef.\n"
            "3. Three everyday actions the public can take to reduce inland pollution "
            "reaching this reef."
        )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user",   "content": user_prompt},
    ]
    return await call_openai(messages, max_tokens=500, temperature=0.5)


# ── Pydantic models ──────────────────────────────────────────

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


# ── Endpoints ────────────────────────────────────────────────

@app.post("/chat")
async def chat(req: ChatRequest):

    water = build_water_section(
        req.coral_area, req.rivers,
        req.ph_value, req.ph_status,
        req.turbidity_ntu, req.turbidity_status,
        req.temperature, req.temp_status,
    )

    base_rules = (
        f"You are a coral reef and inland water quality assistant for Sri Lanka.\n"
        f"Location: {req.coral_area}, {req.coast}. Rivers: {req.rivers}.\n"
        f"Coral image diagnosis: {req.prediction or 'N/A'}.\n"
        f"{water}\n"
        f"{CORE_RULES}\n"
        "Be concise. State when a value is missing rather than guessing."
    )

    if req.role == "tourism_guide":
        system_prompt = (
            "You are an eco-tourism and marine conservation guide for Sri Lanka coral reefs."
        )
    elif req.role == "general":
        system_prompt = (
            "You are a friendly marine biologist explaining reef health "
            "and river pollution to the Sri Lankan public."
        )
    else:
        system_prompt = (
            "You are a marine biologist specializing in inland-to-reef "
            "pollution pathways in Sri Lanka."
        )

    messages = [{"role": "system", "content": system_prompt + "\n" + base_rules}]

    if req.history:
        for m in req.history[-12:]:
            messages.append({"role": m.role, "content": m.content})

    messages.append({"role": "user", "content": req.message})

    reply = await call_openai(messages, max_tokens=400, temperature=0.4)
    if reply.startswith("Unable to generate"):
        return JSONResponse({"error": reply}, status_code=500)
    return JSONResponse({"reply": reply})


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

        friendly_messages = {
            "bleach_11_50":   "Coral bleached 11–50%",
            "bleach_50_100":  "Coral bleached 50–100%",
            "healthy_corals": "Healthy coral",
        }
        raw_prediction = class_names[pred_idx]
        prediction     = friendly_messages.get(raw_prediction, raw_prediction)

        suggestions = await get_coral_suggestions(
            raw_prediction, role,
            coral_area, coast, rivers,
            ph_value, ph_status,
            turbidity_ntu, turbidity_status,
            temperature, temp_status,
        )

        return JSONResponse({
            "prediction":  prediction,
            "suggestions": suggestions,
        })

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)