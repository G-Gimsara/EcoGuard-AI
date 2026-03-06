"use client";

import React, { useEffect, useState } from "react";
import Navbar from "../NavBar/Navbar";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Header from "@/app/Header/page";

/* ------------------ Interfaces ------------------ */

interface PhData {
  ph_value: number;
  ph_status: string;
  recorded_at: string;
}

interface TurbidityData {
  turbidity_ntu: number;
  turbidity_status: string;
  recorded_at: string;
}

interface WaterTempData {
  temperature: number;
  temp_status: string;
  recorded_at: string;
}

interface TrendPoint {
  time: string;
  pH: number;
  turbidity: number;
  temperature: number;
}

/* ------------------ Coral Safe Ranges ------------------ */
const CORAL_RANGES = {
  ph: { min: 8.0, max: 8.3, unit: "pH" },
  turbidity: { min: 0, max: 10, unit: "NTU" },
  temperature: { min: 23, max: 29, unit: "°C" },
};

/* ------------------ Helper: Coral Status ---------------*/
const getCoralStatus = (type: "ph" | "turbidity" | "temperature", value: number) => {
  const range = CORAL_RANGES[type];

  if (type === "ph") {
    if (value >= 8.0 && value <= 8.3) return { label: "Safe for Coral",    color: "bg-green-100 text-green-700" };
    if (value >= 7.8 && value < 8.0)  return { label: "Slight Risk",       color: "bg-yellow-100 text-yellow-700" };
    if (value > 8.3  && value <= 8.5) return { label: "Slight Risk",       color: "bg-yellow-100 text-yellow-700" };
    return                                    { label: "Bleaching Risk!",   color: "bg-red-100 text-red-700" };
  }

  if (type === "turbidity") {
    if (value <= 10)  return { label: "Safe for Coral",  color: "bg-green-100 text-green-700" };
    if (value <= 20)  return { label: "Moderate Risk",   color: "bg-yellow-100 text-yellow-700" };
    return                   { label: "Bleaching Risk!", color: "bg-red-100 text-red-700" };
  }

  if (type === "temperature") {
    if (value >= 23 && value <= 29) return { label: "Safe for Coral",    color: "bg-green-100 text-green-700" };
    if (value > 29  && value <= 31) return { label: "Thermal Stress",    color: "bg-yellow-100 text-yellow-700" };
    if (value > 31)                 return { label: "Bleaching Risk!",   color: "bg-red-100 text-red-700" };
    if (value < 23)                 return { label: "Too Cold",           color: "bg-blue-100 text-blue-700" };
  }

  return { label: "Unknown", color: "bg-gray-100 text-gray-600" };
};

/* ------------------ Sensor Card ------------------ */
const SensorCard = ({
  title,
  value,
  unit,
  coralStatus,
  idealRange,
  recorded_at,
}: {
  title: string;
  value: string;
  unit: string;
  coralStatus: { label: string; color: string };
  idealRange: string;
  recorded_at: string;
}) => (
  <div className="bg-white border rounded-lg p-5 shadow-sm hover:shadow-md transition">
    <p className="text-sm text-gray-500 mb-1">{title}</p>
    <p className="text-3xl font-bold text-blue-700">
      {value} <span className="text-base font-normal text-gray-400">{unit}</span>
    </p>
    <span className={`text-xs font-semibold px-2 py-1 rounded-full mt-2 inline-block ${coralStatus.color}`}>
      {coralStatus.label}
    </span>
    <p className="text-xs text-gray-400 mt-2">Ideal: {idealRange}</p>
    {recorded_at && (
      <p className="text-xs text-gray-400 mt-1">
        {new Date(recorded_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        {" "}
        {new Date(recorded_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </p>
    )}
  </div>
);

/* ------------------ Main Page ------------------ */
export default function CoralReef() {
  const [phData,      setPhData]      = useState<PhData | null>(null);
  const [turbidity,   setTurbidity]   = useState<TurbidityData | null>(null);
  const [waterTemp,   setWaterTemp]   = useState<WaterTempData | null>(null);
  const [trendData,   setTrendData]   = useState<TrendPoint[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // ── Overall coral risk ────────────────────
  const getOverallRisk = () => {
    const risks = [];
    if (phData)    risks.push(getCoralStatus("ph",          phData.ph_value).label);
    if (turbidity) risks.push(getCoralStatus("turbidity",   turbidity.turbidity_ntu).label);
    if (waterTemp) risks.push(getCoralStatus("temperature", waterTemp.temperature).label);

    if (risks.includes("Bleaching Risk!")) return { label: "HIGH BLEACHING RISK",  color: "bg-red-600",    icon: "🚨" };
    if (risks.includes("Thermal Stress"))  return { label: "THERMAL STRESS",        color: "bg-orange-500", icon: "⚠️" };
    if (risks.includes("Slight Risk"))     return { label: "SLIGHT RISK",           color: "bg-yellow-500", icon: "⚠️" };
    if (risks.includes("Moderate Risk"))   return { label: "MODERATE RISK",         color: "bg-orange-400", icon: "⚠️" };
    if (risks.length > 0)                  return { label: "CONDITIONS SAFE",       color: "bg-green-600",  icon: "✅" };
    return                                        { label: "AWAITING DATA",         color: "bg-gray-400",   icon: "⏳" };
  };

  // ── Fetch latest ──────────────────────────
  const fetchLatest = async () => {
    try {
      const [phRes, turbRes, tempRes] = await Promise.all([
        fetch("http://localhost:5000/api/ph"),
        fetch("http://localhost:5000/api/turbidity"),
        fetch("http://localhost:5000/api/water-temp"),
      ]);

      const phJson   = await phRes.json();
      const turbJson = await turbRes.json();
      const tempJson = await tempRes.json();

      if (phJson.length > 0)   setPhData(phJson[0]);
      if (turbJson.length > 0) setTurbidity(turbJson[0]);
      if (tempJson.length > 0) setWaterTemp(tempJson[0]);

      // Build trend
      const trend: TrendPoint[] = phJson.slice(0, 10).map((ph: PhData, i: number) => ({
        time:        new Date(ph.recorded_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        pH:          ph.ph_value,
        turbidity:   turbJson[i]?.turbidity_ntu  ?? 0,
        temperature: tempJson[i]?.temperature    ?? 0,
      })).reverse();

      setTrendData(trend);
      setLastUpdated(new Date().toLocaleTimeString());

    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => { fetchLatest(); }, []);

  // ── WebSocket ─────────────────────────────
  useEffect(() => {
    let ws: WebSocket;
    const connect = () => {
      ws = new WebSocket("ws://localhost:5000");
      ws.onopen  = () => setWsConnected(true);
      ws.onclose = () => { setWsConnected(false); setTimeout(connect, 3000); };
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === "PH_DATA")        { setPhData(msg.data);    setLastUpdated(new Date().toLocaleTimeString()); }
        if (msg.type === "TURBIDITY_DATA") { setTurbidity(msg.data); setLastUpdated(new Date().toLocaleTimeString()); }
        if (msg.type === "WATER_TEMP")     { setWaterTemp(msg.data); fetchLatest(); }
      };
    };
    connect();
    return () => ws?.close();
  }, []);

  const overallRisk = getOverallRisk();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-800">
              Coral Bleaching Detection Dashboard
            </h1>
            <p className="text-gray-600 mt-2 max-w-3xl">
              Real-time water quality monitoring to detect coral bleaching risk
              based on pH, turbidity and temperature thresholds.
            </p>
          </div>
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${
            wsConnected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}>
            {wsConnected ? "● Live" : "● Connecting..."}
          </span>
        </div>

        {/* ── Overall Risk Banner ── */}
        <div className={`${overallRisk.color} rounded-2xl p-6 text-white mb-8 shadow-md`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80 mb-1">Overall Coral Health Status</p>
              <h2 className="text-4xl font-bold">{overallRisk.label}</h2>
              {lastUpdated && (
                <p className="text-sm opacity-70 mt-2">Last updated: {lastUpdated}</p>
              )}
            </div>
            <div className="text-7xl">{overallRisk.icon}</div>
          </div>
        </div>

        {/* ── Live Sensor Cards ── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Live Water Quality Readings — Device 4
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

            <SensorCard
              title="pH Level"
              value={phData ? phData.ph_value.toFixed(2) : "---"}
              unit="pH"
              coralStatus={phData ? getCoralStatus("ph", phData.ph_value) : { label: "Waiting...", color: "bg-gray-100 text-gray-500" }}
              idealRange="8.0 – 8.3 pH"
              recorded_at={phData?.recorded_at ?? ""}
            />

            <SensorCard
              title="Turbidity"
              value={turbidity ? turbidity.turbidity_ntu.toFixed(2) : "---"}
              unit="NTU"
              coralStatus={turbidity ? getCoralStatus("turbidity", turbidity.turbidity_ntu) : { label: "Waiting...", color: "bg-gray-100 text-gray-500" }}
              idealRange="0 – 10 NTU"
              recorded_at={turbidity?.recorded_at ?? ""}
            />

            <SensorCard
              title="Water Temperature"
              value={waterTemp ? waterTemp.temperature.toFixed(1) : "---"}
              unit="°C"
              coralStatus={waterTemp ? getCoralStatus("temperature", waterTemp.temperature) : { label: "Waiting...", color: "bg-gray-100 text-gray-500" }}
              idealRange="23 – 29 °C"
              recorded_at={waterTemp?.recorded_at ?? ""}
            />

          </div>
        </section>

        {/* ── Coral Safe Ranges Info ── */}
        <section className="mb-10">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-bold text-blue-800 mb-4">
              🪸 Coral Reef Safe Parameter Ranges
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">

              <div className="bg-white rounded-lg p-4 border">
                <p className="font-semibold text-blue-700 mb-2">pH Level</p>
                <p className="text-green-600 font-bold">✅ Safe: 8.0 – 8.3</p>
                <p className="text-yellow-600">⚠️ Slight Risk: 7.8 – 8.0 or 8.3 – 8.5</p>
                <p className="text-red-600">🚨 Bleaching Risk: Below 7.8 or Above 8.5</p>
                <p className="text-gray-500 mt-2 text-xs">
                  Ocean acidification (low pH) weakens coral skeletons and prevents growth.
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border">
                <p className="font-semibold text-blue-700 mb-2">Turbidity</p>
                <p className="text-green-600 font-bold">✅ Safe: 0 – 10 NTU</p>
                <p className="text-yellow-600">⚠️ Moderate Risk: 10 – 20 NTU</p>
                <p className="text-red-600">🚨 Bleaching Risk: Above 20 NTU</p>
                <p className="text-gray-500 mt-2 text-xs">
                  High turbidity blocks sunlight needed for coral photosynthesis (zooxanthellae).
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border">
                <p className="font-semibold text-blue-700 mb-2">Water Temperature</p>
                <p className="text-green-600 font-bold">✅ Safe: 23 – 29 °C</p>
                <p className="text-yellow-600">⚠️ Thermal Stress: 29 – 31 °C</p>
                <p className="text-red-600">🚨 Bleaching Risk: Above 31 °C</p>
                <p className="text-gray-500 mt-2 text-xs">
                  Temperatures above 29°C cause coral to expel zooxanthellae leading to bleaching.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ── Trend Chart ── */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Water Quality Trend (Last 10 Readings)
          </h2>
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} name="Temperature °C" />
                  <Line type="monotone" dataKey="pH"          stroke="#7c3aed" strokeWidth={2} name="pH Level" />
                  <Line type="monotone" dataKey="turbidity"   stroke="#16a34a" strokeWidth={2} name="Turbidity NTU" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Future Scope */}
        <section className="bg-white border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Future Enhancements
          </h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Real-time IoT sensor integration using MQTT or REST APIs.</li>
            <li>Automated alerts for abnormal water quality conditions.</li>
            <li>AI-driven coral health prediction and risk assessment.</li>
            <li>Role-based dashboards for researchers and authorities.</li>
            <li>Mobile and email notifications for conservation teams.</li>
          </ul>
        </section>

      </div>
    </div>
  );
}