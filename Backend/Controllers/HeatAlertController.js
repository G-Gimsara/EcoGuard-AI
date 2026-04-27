// Controllers/HeatAlertController.js

const Subscriber = require("../Models/subscriber.model");
const { sendSMS, normalizePhone } = require("../Services/sms.service");

const ML_PREDICT_URL = 'http://localhost:8000/predict';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = "gpt-4";

// In-memory cache for last generated warning + timestamp
let cachedWarningResult = null;
let lastLlmGenerationTime = 0; // milliseconds since epoch
const LLM_REFRESH_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
const smsDispatchDedup = new Map();

if (!OPENAI_API_KEY) {
  console.warn('[HeatAlert] OPENAI_API_KEY is not set in environment variables');
}


function getDatePart(datetime = "") {
  return String(datetime).split("T")[0];
}

function formatShortDate(dateStr) {
  if (!dateStr) return "Unknown date";
  const parsed = new Date(`${dateStr}T00:00:00Z`);
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function roundHeatIndex(value) {
  const num = Number(value);
  return Number.isFinite(num) ? Math.round(num) : null;
}

function formatListWithAnd(items) {
  if (!items.length) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function formatDatesWithHeatIndex(entries = []) {
  const byDate = new Map();

  for (const entry of entries) {
    const date = getDatePart(entry?.datetime);
    if (!date) continue;
    const roundedHi = roundHeatIndex(entry?.heat_index_C);
    if (!byDate.has(date)) {
      byDate.set(date, roundedHi);
      continue;
    }
    const current = byDate.get(date);
    if (roundedHi !== null && (current === null || roundedHi > current)) {
      byDate.set(date, roundedHi);
    }
  }

  const dateItems = Array.from(byDate.keys())
    .sort((a, b) => new Date(`${a}T00:00:00Z`) - new Date(`${b}T00:00:00Z`))
    .map((date) => {
      const hi = byDate.get(date);
      const hiLabel = hi === null ? "N/A" : `${hi}\u00B0C`;
      return `${formatShortDate(date)} (HI: ${hiLabel})`;
    });

  return formatListWithAnd(dateItems);
}

function calculateMetrics(entries) {
  const uniqueDates = new Set(entries.map(e => e.datetime.split("T")[0]));
  const sortedDates = Array.from(uniqueDates).sort();

  const heatIndexes = entries
    .map(e => Number(e.heat_index_C))
    .filter(n => !isNaN(n));

  const avgHI = heatIndexes.length
    ? Math.round(heatIndexes.reduce((a, b) => a + b, 0) / heatIndexes.length)
    : null;

  const maxHI = heatIndexes.length ? Math.max(...heatIndexes) : null;

  return {
    totalDays: uniqueDates.size,
    startDate: sortedDates[0],
    endDate: sortedDates[sortedDates.length - 1],
    avgHI,
    maxHI
  };
}

function buildFixedSms(trend) {
  const location = trend?.location || "your area";
  const metrics = calculateMetrics(trend.entries);

  const formatDate = (d) => {
    return new Date(d + "T00:00:00Z").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC"
    });
  };

  const start = formatDate(metrics.startDate);
  const end = formatDate(metrics.endDate);

  if (trend.type === "HEATWAVE") {
    return `EcoGuard Heat Alert: ${location}

⚠️ Heatwave expected from ${start} to ${end} (${metrics.totalDays} days).

Heat index up to ${metrics.maxHI}°C.

Risk: Severe heat stress and dehydration.

Stay hydrated and avoid midday sun.`;
  }

  if (trend.type === "SCATTERED_DAYS_ALERT") {
    return `EcoGuard Heat Alert: ${location}

Frequent high heat risk expected between ${start} and ${end} (${metrics.totalDays} days).

Average heat index around ${metrics.avgHI}°C.

Risk: Heat stress and dehydration.

Stay hydrated and avoid midday sun.`;
  }

  if (trend.type === "MULTI_DAY") {
    return `EcoGuard Heat Alert: ${location}

High heat risk from ${start} to ${end} (${metrics.totalDays} days).

Heat index up to ${metrics.maxHI}°C.

Risk: Heat stress and dehydration.

Stay hydrated and avoid midday sun.`;
  }

  return `EcoGuard Heat Alert: ${location}

High heat risk expected.

Stay hydrated and avoid direct sun.`;
}

async function fetchAndFilterDanger() {
  try {
    const res = await fetch(ML_PREDICT_URL);
    if (!res.ok) {
      throw new Error(`ML predict endpoint failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const dangerEntries = data.filter(item => item.risk_level === 'Danger' || item.risk_level === 'Extreme Danger');
    return dangerEntries;
  } catch (err) {
    console.error('[HeatAlert] Failed to fetch predictions:', err.message);
    return [];
  }
}

// Helper for background refresh (exported) - same as fetchAndFilterDanger
async function getRawDangerData() {
  return await fetchAndFilterDanger();
}

function groupByLocationAndDetectTrends(dangerData) {
  const trends = [];
  const groupedByLocation = {};

  // Group by location
  dangerData.forEach(entry => {
    if (!groupedByLocation[entry.location]) {
      groupedByLocation[entry.location] = [];
    }
    groupedByLocation[entry.location].push(entry);
  });

  // For each location, detect consecutive periods
  Object.keys(groupedByLocation).forEach(location => {
    const entries = groupedByLocation[location].sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    let currentPeriod = null;

    entries.forEach(entry => {
      const date = new Date(entry.datetime.split('T')[0]);

      if (!currentPeriod) {
        currentPeriod = {
          location,
          start_date: entry.datetime.split('T')[0],
          end_date: entry.datetime.split('T')[0],
          days: 1,
          entries: [entry]
        };
      } else {
        const lastDate = new Date(currentPeriod.end_date);
        const diffTime = date - lastDate;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        if (diffDays === 1) {
          // Consecutive
          currentPeriod.end_date = entry.datetime.split('T')[0];
          currentPeriod.days += 1;
          currentPeriod.entries.push(entry);
        } else {
          // New period
          trends.push(currentPeriod);
          currentPeriod = {
            location,
            start_date: entry.datetime.split('T')[0],
            end_date: entry.datetime.split('T')[0],
            days: 1,
            entries: [entry]
          };
        }
      }
    });

    if (currentPeriod) {
      trends.push(currentPeriod);
    }
  });

  return trends;
}

function detectScatteredDaysTrends(dangerData) {
  const groupedByLocation = {};

  for (const entry of dangerData) {
    if (!groupedByLocation[entry.location]) {
      groupedByLocation[entry.location] = [];
    }
    groupedByLocation[entry.location].push(entry);
  }

  const trends = [];

  for (const location of Object.keys(groupedByLocation)) {
    const entries = groupedByLocation[location];
    const uniqueDateMap = new Map();

    for (const entry of entries) {
      const date = getDatePart(entry.datetime);
      if (!date) continue;
      if (!uniqueDateMap.has(date)) uniqueDateMap.set(date, []);
      uniqueDateMap.get(date).push(entry);
    }

    const uniqueDates = Array.from(uniqueDateMap.keys()).sort(
      (a, b) => new Date(`${a}T00:00:00Z`) - new Date(`${b}T00:00:00Z`)
    );

    if (uniqueDates.length < 3) continue;

    let hasNonConsecutiveGap = false;
    for (let i = 1; i < uniqueDates.length; i += 1) {
      const prev = new Date(`${uniqueDates[i - 1]}T00:00:00Z`);
      const curr = new Date(`${uniqueDates[i]}T00:00:00Z`);
      const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);
      if (diffDays > 1) {
        hasNonConsecutiveGap = true;
        break;
      }
    }

    if (!hasNonConsecutiveGap) continue;

    trends.push({
      type: "SCATTERED_DAYS_ALERT",
      location,
      start_date: uniqueDates[0],
      end_date: uniqueDates[uniqueDates.length - 1],
      days: uniqueDates.length,
      entries: uniqueDates.flatMap((date) => uniqueDateMap.get(date)),
    });
  }

  return trends;
}

function selectBestTrend(trends) {
  const heatwave = trends.find(t => t.type === "HEATWAVE");
  if (heatwave) return heatwave;

  const scattered = trends.find(t => t.type === "SCATTERED_DAYS_ALERT");
  const multiDay = trends.find(t => t.type === "MULTI_DAY");

  if (scattered && multiDay) {
    const scatteredDays = new Set(scattered.entries.map(e => e.datetime.split("T")[0])).size;
    const multiDays = new Set(multiDay.entries.map(e => e.datetime.split("T")[0])).size;

    if (scatteredDays >= multiDays * 2) {
      return scattered;
    }
    return multiDay;
  }

  return scattered || multiDay || trends[0];
}

async function sendWarningViaAPI(trend) {
  const location = trend?.location;

  try {
    const subscribers = await Subscriber.findAll({
      where: { isSubscribed: true },
      attributes: ["phoneNumber"],
    });

    const recipients = Array.from(
      new Set(
        subscribers
          .map((subscriber) => normalizePhone(subscriber.phoneNumber))
          .filter((phone) => /^94\d{9}$/.test(phone))
      )
    );

    if (recipients.length === 0) {
      console.log("[HeatAlert] No active SMS subscribers found.");
      return;
    }

    const dedupeKey = `${trend?.type || "UNKNOWN"}|${location || "unknown"}|${trend?.start_date || "na"}|${trend?.end_date || "na"}`;
    if (smsDispatchDedup.has(dedupeKey)) {
      console.log(`[HeatAlert] Duplicate SMS skipped for ${location || "unknown location"}`);
      return;
    }

    const message = buildFixedSms(trend);
    await sendSMS(recipients, message);

    smsDispatchDedup.set(dedupeKey, true);
    console.log(`[HeatAlert] SMS sent to ${recipients.length} subscriber(s) for ${location || "unknown location"}`);
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    console.error("[HeatAlert] Failed to send SMS via Text.lk:", status || "", data || err.message);
  }
}

/**
 * Generate one warning message per unique date (all danger locations for that date)
 */
async function generateWarningForDate(date, entriesForDate) {
  const dateObj = new Date(date);
  const dateStr = dateObj.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Build data for LLM
  const dangerDataSummary = entriesForDate.map(entry => ({
    location: entry.location,
    datetime: entry.datetime,
    tempmax: entry.tempmax,
    humidity: entry.humidity,
    solarradiation: entry.solarradiation,
    heat_index_C: entry.heat_index_C,
    risk_level: entry.risk_level
  }));

  const dataForPrompt = JSON.stringify(dangerDataSummary, null, 2);

  const systemInstruction = `
You are a friendly weather and health advisor for Sri Lanka. Your role is to provide clear, helpful warnings about heat risks to the general public.

Based on the following heat prediction data for ${dateStr}, create a well-structured warning message. The data includes locations with Danger or Extreme Danger risk levels.

Data:
${dataForPrompt}

Structure your response as a JSON object with the following keys:
- "risky_day": The date in a friendly format, e.g., "April 18, 2026"
- "location": A list of affected locations, e.g., "Colombo, Kandy"
- "main_warning_message": A brief, friendly warning about the heat risk, mentioning high temperatures and heat index.
- "possible_situations": A short list of situations where people might be at risk, like outdoor activities, elderly, children.
- "mitigation_strategies": A list of 4-6 practical, easy-to-follow strategies to stay safe, such as staying hydrated, wearing light clothing, avoiding sun exposure.

Keep the entire message friendly, easy to understand, and encouraging. Act as a caring advisor. Total response should be concise, under 300 words.
`;

  const messages = [
    { role: "system", content: systemInstruction },
    { role: "user", content: "Generate the warning message in JSON format." }
  ];

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI failed: ${response.status} - ${errText}`);
    }

    const result = await response.json();
    let text = result?.choices?.[0]?.message?.content?.trim() || '';

    if (!text) {
      throw new Error("Empty response from OpenAI");
    }

    // Parse the JSON response
    const parsed = JSON.parse(text);
    return parsed;

  } catch (err) {
    console.error(`[OpenAI failed for date ${date}]:`, err.message);

    // Minimal placeholder
    return {
      risky_day: dateStr,
      location: entriesForDate.map(e => e.location).join(', '),
      main_warning_message: "High heat risk expected. Stay cool and hydrated.",
      possible_situations: ["Outdoor work", "Elderly and children at risk"],
      mitigation_strategies: ["Drink plenty of water", "Wear light clothing", "Avoid direct sun", "Check on vulnerable people"]
    };
  }
}

async function generateTrendWarning(trend) {
  const { location, start_date, end_date, days, entries, type } = trend;
  const startDateObj = new Date(start_date);
  const endDateObj = new Date(end_date);
  const startStr = startDateObj.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const endStr = endDateObj.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Build data for LLM
  const dangerDataSummary = entries.map(entry => ({
    location: entry.location,
    datetime: entry.datetime,
    tempmax: entry.tempmax,
    humidity: entry.humidity,
    solarradiation: entry.solarradiation,
    heat_index_C: entry.heat_index_C,
    risk_level: entry.risk_level
  }));

  const dataForPrompt = JSON.stringify(dangerDataSummary, null, 2);

  let systemInstruction = '';

  if (type === 'HEATWAVE') {
    systemInstruction = `
You are a friendly weather and health advisor for Sri Lanka. Your role is to provide clear, helpful warnings about heatwaves to the general public.

Based on the following heat prediction data for a heatwave in ${location} from ${startStr} to ${endStr} (${days} days), create a well-structured warning message. The data includes locations with Danger or Extreme Danger risk levels.

Data:
${dataForPrompt}

Structure your response as a JSON object with the following keys:
- "risky_day": "Heatwave from ${startStr} to ${endStr}"
- "location": "${location}"
- "main_warning_message": A brief, friendly warning about the prolonged heatwave, mentioning high temperatures, duration, and long exposure risks like cumulative health impact.
- "possible_situations": A short list of situations where people might be at risk, like outdoor activities, elderly, children, especially during prolonged heat.
- "mitigation_strategies": A list of 5-7 practical, easy-to-follow strategies to stay safe, such as staying hydrated, wearing light clothing, avoiding sun, monitoring health, seeking cool spaces.

Keep the entire message friendly, easy to understand, and encouraging. Act as a caring advisor. Total response should be concise, under 300 words.
`;
  } else if (type === 'MULTI_DAY') {
    systemInstruction = `
You are a friendly weather and health advisor for Sri Lanka. Your role is to provide clear, helpful warnings about multi-day heat risks to the general public.

Based on the following heat prediction data for several days of heat in ${location} from ${startStr} to ${endStr} (${days} days), create a well-structured warning message. The data includes locations with Danger or Extreme Danger risk levels.

Data:
${dataForPrompt}

Structure your response as a JSON object with the following keys:
- "risky_day": "Multi-day heat from ${startStr} to ${endStr}"
- "location": "${location}"
- "main_warning_message": A brief, friendly warning about the several days of heat, mentioning moderate sustained risk.
- "possible_situations": A short list of situations where people might be at risk, like outdoor activities, elderly, children.
- "mitigation_strategies": A list of 4-6 practical, easy-to-follow strategies to stay safe.

Keep the entire message friendly, easy to understand, and encouraging. Act as a caring advisor. Total response should be concise, under 300 words.
`;
  } else if (type === 'SCATTERED_DAYS_ALERT') {
    const daysWithHeat = formatDatesWithHeatIndex(entries);
    systemInstruction = `
You are a friendly weather and health advisor for Sri Lanka. Your role is to provide clear, helpful warnings about non-consecutive high-heat days to the general public.

Based on the following heat prediction data for scattered heat-risk days in ${location} between ${startStr} and ${endStr} (${days} days), create a well-structured warning message. The data includes locations with Danger or Extreme Danger risk levels.

Days with highest heat index:
${daysWithHeat}

Data:
${dataForPrompt}

Structure your response as a JSON object with the following keys:
- "risky_day": "Scattered heat-risk days between ${startStr} and ${endStr}"
- "location": "${location}"
- "main_warning_message": A brief, friendly warning about repeated but non-consecutive heat-risk days.
- "possible_situations": A short list of situations where people might be at risk.
- "mitigation_strategies": A list of 4-6 practical, easy-to-follow strategies to stay safe.

Keep the entire message friendly, easy to understand, and encouraging. Act as a caring advisor. Total response should be concise, under 300 words.
`;
  } else {
    systemInstruction = `
You are a friendly weather and health advisor for Sri Lanka. Your role is to provide clear, helpful warnings about heat risks to the general public.

Based on the following heat prediction data for ${location} from ${startStr} to ${endStr}, create a well-structured warning message.

Data:
${dataForPrompt}

Structure your response as a JSON object with keys: "risky_day", "location", "main_warning_message", "possible_situations", "mitigation_strategies".
`;
  }

  const messages = [
    { role: "system", content: systemInstruction },
    { role: "user", content: "Generate the warning message in JSON format." }
  ];

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI failed: ${response.status} - ${errText}`);
    }

    const result = await response.json();
    let text = result?.choices?.[0]?.message?.content?.trim() || '';

    if (!text) {
      throw new Error("Empty response from OpenAI");
    }

    // Parse the JSON response
    const parsed = JSON.parse(text);
    return parsed;

  } catch (err) {
    console.error(`[OpenAI failed for trend ${location} ${start_date}-${end_date}]:`, err.message);

    // Minimal placeholder
    return {
      risky_day: type === 'HEATWAVE'
        ? `Heatwave from ${startStr} to ${endStr}`
        : type === 'SCATTERED_DAYS_ALERT'
          ? `Scattered heat-risk days between ${startStr} and ${endStr}`
          : `Multi-day heat from ${startStr} to ${endStr}`,
      location,
      main_warning_message: "High heat risk expected over multiple days. Stay cool and hydrated.",
      possible_situations: ["Outdoor work", "Elderly and children at risk"],
      mitigation_strategies: ["Drink plenty of water", "Wear light clothing", "Avoid direct sun", "Check on vulnerable people"]
    };
  }
}

async function generateHeatWarning(dangerData) {
  if (!dangerData || dangerData.length === 0) {
    return {
      hasDanger: false,
      warnings: [],
      generatedAt: new Date().toISOString(),
      dangerCount: 0
    };
  }

  // Sort chronologically
  dangerData.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

  // Group by location and detect trends
  const trends = groupByLocationAndDetectTrends(dangerData);
  const scatteredTrends = detectScatteredDaysTrends(dangerData);

  // Classify trends
  const classifiedConsecutiveTrends = trends.map(trend => {
    let type;
    if (trend.days >= 7) {
      type = 'HEATWAVE';
    } else if (trend.days >= 3) {
      type = 'MULTI_DAY';
    } else {
      type = 'DAILY';
    }
    return { ...trend, type };
  });
  const classifiedTrends = [...classifiedConsecutiveTrends, ...scatteredTrends];

  // Group by location
  const trendsByLocation = {};
  for (const trend of classifiedTrends) {
    if (!trendsByLocation[trend.location]) {
      trendsByLocation[trend.location] = [];
    }
    trendsByLocation[trend.location].push(trend);
  }

  const warnings = [];

  for (const location of Object.keys(trendsByLocation)) {
    const locationTrends = trendsByLocation[location];
    const bestTrend = selectBestTrend(locationTrends);

    if (bestTrend) {
      let message;

      if (bestTrend.type === "DAILY") {
        message = await generateWarningForDate(bestTrend.start_date, bestTrend.entries);
      } else {
        message = await generateTrendWarning(bestTrend);
      }

      warnings.push({
        type: bestTrend.type,
        location: bestTrend.location,
        start_date: bestTrend.start_date,
        end_date: bestTrend.end_date,
        message
      });

      await sendWarningViaAPI(bestTrend);
    }
  }

  return {
    hasDanger: true,
    warnings,
    generatedAt: new Date().toISOString(),
    dangerCount: dangerData.length
  };
}

async function getHeatWarning(req, res) {
  try {
    const dangerData = await fetchAndFilterDanger();

    const now = Date.now();

    // Check if we need to regenerate LLM warnings (only every hour)
    if (!cachedWarningResult || (now - lastLlmGenerationTime >= LLM_REFRESH_INTERVAL_MS)) {
      console.log('[HeatAlert] Generating fresh LLM warnings (hourly refresh)');
      const result = await generateHeatWarning(dangerData);
      cachedWarningResult = result;
      lastLlmGenerationTime = now;
    } else {
      console.log('[HeatAlert] Returning cached warnings (within last hour)');
    }

    res.status(200).json(cachedWarningResult);
  } catch (err) {
    console.error('[getHeatWarning]', err);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate heat warnings'
    });
  }
}

module.exports = {
  getHeatWarning,
  getRawDangerData
};
