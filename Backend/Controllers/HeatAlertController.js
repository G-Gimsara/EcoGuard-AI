// Controllers/HeatAlertController.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

const ML_PREDICT_URL = 'http://localhost:8000/predict';
const MODEL = "gemini-1.5-flash";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('[HeatAlert] GEMINI_API_KEY is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL });

async function fetchAndFilterDanger() {
  try {
    const res = await fetch(ML_PREDICT_URL);
    if (!res.ok) {
      throw new Error(`ML predict endpoint failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const dangerEntries = data.filter(item => item.risk_level === 'Danger');
    return dangerEntries;
  } catch (err) {
    console.error('[HeatAlert] Failed to fetch predictions:', err.message);
    return [];
  }
}

// NEW: Helper for background refresh (exported)
async function getRawDangerData() {
  try {
    const res = await fetch(ML_PREDICT_URL);
    if (!res.ok) {
      throw new Error(`ML predict failed: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    return data.filter(item => item.risk_level === 'Danger');
  } catch (err) {
    console.error('[getRawDangerData]', err.message);
    return [];
  }
}

/**
 * Generate warning for ONE danger entry
 */
async function generateSingleDayWarning(entry) {
  const dateStr = new Date(entry.datetime).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const dataSnippet = JSON.stringify(entry, null, 2);

  const systemInstruction = `
You are a public health and weather expert giving advice for Sri Lanka.

Create a short, clear HEAT DANGER WARNING message for the general public using very simple English.

Use this data:
${dataSnippet}

Rules:
- Start exactly with: "URGENT HEAT DANGER WARNING – ${entry.location} on ${dateStr}"
- Then write exactly this sentence: "This is what could happen on this day. Be careful, consider the following points and follow those steps."
- Mention briefly: maximum temperature, heat index, humidity and main health risks (heatstroke, exhaustion, danger especially to children, elderly, outdoor workers)
- List 4–6 short practical safety steps (hydration, avoid sun, clothing, symptoms, help vulnerable people)
- Keep total message short — 120–180 words
- Tone: serious, helpful, no panic
- End exactly with: "Stay safe. Look after children and elderly."
`;

  try {
    const result = await model.generateContent([
      { role: "model", parts: [{ text: systemInstruction }] },
      { role: "user",   parts: [{ text: "Generate the warning now." }] }
    ]);

    let text = result.response.text()?.trim() || '';

    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    text = text.replace(/\n{3,}/g, '\n\n').trim();
    return text;

  } catch (err) {
    console.error(`[Gemini single day failed] ${entry.location} ${entry.datetime}:`, err.message);
    return `URGENT HEAT DANGER WARNING – ${entry.location} on ${dateStr}\n\n` +
           `This is what could happen on this day. Very high heat risk (heat index ~${Math.round(entry.heat_index_C)}°C).\n\n` +
           `Be careful, consider the following points and follow these steps:\n` +
           `• Drink water often\n` +
           `• Avoid sun between 10am–4pm\n` +
           `• Stay in cool places\n` +
           `• Wear light clothes\n` +
           `• Watch for dizziness or nausea – get help if needed\n\n` +
           `Stay safe. Look after children and elderly.`;
  }
}

async function generateHeatWarning(dangerData) {
  if (!dangerData || dangerData.length === 0) {
    return {
      hasDanger: false,
      warning: 'No "Danger" level heat risk is predicted in the next 15 days.',
      generatedAt: new Date().toISOString(),
      dangerCount: 0
    };
  }

  // Sort chronologically
  dangerData.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

  // Generate one warning per danger day
  const warnings = [];
  for (const entry of dangerData) {
    const msg = await generateSingleDayWarning(entry);
    warnings.push(msg);
  }

  const combinedWarning = warnings.join('\n\n──────────────────────────────\n\n');

  return {
    hasDanger: true,
    warning: combinedWarning,
    period: dangerData.map(d => `${d.location} ${new Date(d.datetime).toLocaleDateString('en-GB')}`).join(' • '),
    generatedAt: new Date().toISOString(),
    dangerCount: dangerData.length
  };
}

async function getHeatWarning(req, res) {
  try {
    const dangerData = await fetchAndFilterDanger();
    const result = await generateHeatWarning(dangerData);
    res.status(200).json(result);
  } catch (err) {
    console.error('[getHeatWarning]', err);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate heat warning'
    });
  }
}

module.exports = {
  getHeatWarning,
  getRawDangerData   // ← NEW export
};