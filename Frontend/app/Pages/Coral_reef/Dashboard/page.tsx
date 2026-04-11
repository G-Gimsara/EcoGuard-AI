"use client";

import React, { useEffect, useState } from "react";
import Navbar from "../NavBar/Navbar";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";
import Header from "@/app/Header/page";

/* ------------------ Interfaces ------------------ */
interface PhData        { ph_value: number;       ph_status: string;        recorded_at: string; }
interface TurbidityData { turbidity_ntu: number;  turbidity_status: string; recorded_at: string; }
interface WaterTempData { temperature: number;    temp_status: string;      recorded_at: string; }
interface TrendPoint    { time: string; pH: number; turbidity: number; temperature: number; }

/* ------------------ Sri Lanka Coral Areas + Rivers ------------------ */
const CORAL_AREAS = [
  {
    id: "hikkaduwa", name: "Hikkaduwa", coast: "South West Coast",
    emoji: "🪸", risk: "HIGH",
    rivers: [
      { name: "Gin Ganga",      length_km: 128, basin: "Southern", threat: "Agricultural runoff, sedimentation" },
      { name: "Bentara Ganga",  length_km: 72,  basin: "Southern", threat: "Urban discharge, plastic waste" },
      { name: "Kalu Ganga",     length_km: 129, basin: "Western",  threat: "Industrial effluents, logging" },
    ],
  },
  {
    id: "bar_reef", name: "Bar Reef (Kalpitiya)", coast: "North West Coast",
    emoji: "🪸", risk: "CRITICAL",
    rivers: [
      { name: "Kala Oya",   length_km: 148, basin: "North Western", threat: "Irrigation return flows, agrochemicals" },
      { name: "Deduru Oya", length_km: 144, basin: "North Western", threat: "Sand mining, deforestation" },
      { name: "Mi Oya",     length_km: 105, basin: "North Western", threat: "Catchment degradation, erosion" },
    ],
  },
  {
    id: "kayankerni", name: "Kayankerni", coast: "East Coast",
    emoji: "🪸", risk: "MODERATE",
    rivers: [
      { name: "Maduru Oya",        length_km: 164, basin: "Eastern", threat: "Agricultural chemicals, deforestation" },
      { name: "Valachchenai Oya",  length_km: 72,  basin: "Eastern", threat: "Paper mill discharge, urban waste" },
      { name: "Batticaloa Lagoon", length_km: 55,  basin: "Eastern", threat: "Salinity changes, organic pollution" },
    ],
  },
  {
    id: "passikudah", name: "Passikudah", coast: "East Coast",
    emoji: "🪸", risk: "MODERATE",
    rivers: [
      { name: "Maduru Oya",     length_km: 164, basin: "Eastern", threat: "Agricultural chemicals, deforestation" },
      { name: "Mahaweli Ganga", length_km: 335, basin: "Central",  threat: "Hydropower sediment, thermal pollution" },
      { name: "Heda Oya",       length_km: 45,  basin: "Eastern", threat: "Coastal development runoff" },
    ],
  },
  {
    id: "trincomalee", name: "Trincomalee / Pigeon Island", coast: "East Coast",
    emoji: "🪸", risk: "MODERATE",
    rivers: [
      { name: "Mahaweli Ganga", length_km: 335, basin: "Central",  threat: "Hydropower sediment, thermal changes" },
      { name: "Yan Oya",        length_km: 110, basin: "Northern", threat: "Agricultural return flows" },
      { name: "Nay Aru",        length_km: 88,  basin: "Northern", threat: "Sedimentation, habitat loss" },
    ],
  },
  {
    id: "gulf_mannar", name: "Gulf of Mannar", coast: "North West Coast",
    emoji: "🪸", risk: "HIGH",
    rivers: [
      { name: "Malwathu Oya", length_km: 164, basin: "Northern",      threat: "Irrigation runoff, salinity intrusion" },
      { name: "Aruvi Aru",    length_km: 170, basin: "Northern",      threat: "Agriculture, sedimentation" },
      { name: "Pambar River", length_km: 67,  basin: "Mannar Island", threat: "Coastal erosion, brine discharge" },
    ],
  },
  {
    id: "unawatuna", name: "Unawatuna", coast: "South Coast",
    emoji: "🪸", risk: "HIGH",
    rivers: [
      { name: "Gin Ganga",      length_km: 128, basin: "Southern", threat: "Agricultural runoff, sedimentation" },
      { name: "Nilwala Ganga",  length_km: 72,  basin: "Southern", threat: "Urban discharge, plastics" },
      { name: "Polwatta Ganga", length_km: 35,  basin: "Southern", threat: "Coastal development, solid waste" },
    ],
  },
  {
    id: "weligama", name: "Weligama", coast: "South Coast",
    emoji: "🪸", risk: "MODERATE",
    rivers: [
      { name: "Nilwala Ganga",  length_km: 72, basin: "Southern", threat: "Urban discharge, plastics" },
      { name: "Polwatta Ganga", length_km: 35, basin: "Southern", threat: "Coastal development, solid waste" },
      { name: "Urubokka Oya",   length_km: 48, basin: "Southern", threat: "Rubber plantation effluents" },
    ],
  },
];

/* ------------------ Helpers ------------------ */
const getCoralStatus = (type: "ph" | "turbidity" | "temperature", value: number) => {
  if (type === "ph") {
    if (value >= 8.0 && value <= 8.3) return { label: "Safe",           color: "bg-green-100 text-green-700",   dot: "bg-green-500"  };
    if ((value >= 7.8 && value < 8.0) || (value > 8.3 && value <= 8.5))
                                       return { label: "Slight Risk",    color: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500" };
    return                                    { label: "Bleaching Risk", color: "bg-red-100 text-red-700",       dot: "bg-red-500"    };
  }
  if (type === "turbidity") {
    if (value <= 10)  return { label: "Safe",           color: "bg-green-100 text-green-700",   dot: "bg-green-500"  };
    if (value <= 20)  return { label: "Moderate Risk",  color: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500" };
    return                   { label: "Bleaching Risk", color: "bg-red-100 text-red-700",       dot: "bg-red-500"    };
  }
  if (type === "temperature") {
    if (value >= 23 && value <= 29) return { label: "Safe",           color: "bg-green-100 text-green-700",   dot: "bg-green-500"  };
    if (value > 29  && value <= 31) return { label: "Thermal Stress", color: "bg-orange-100 text-orange-700", dot: "bg-orange-500" };
    if (value > 31)                 return { label: "Bleaching Risk", color: "bg-red-100 text-red-700",       dot: "bg-red-500"    };
    return                                 { label: "Too Cold",       color: "bg-blue-100 text-blue-700",     dot: "bg-blue-500"   };
  }
  return { label: "Unknown", color: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };
};

const getRiskBadge = (risk: string) => {
  if (risk === "CRITICAL") return "bg-red-100 text-red-700 border border-red-200";
  if (risk === "HIGH")     return "bg-orange-100 text-orange-700 border border-orange-200";
  return                          "bg-yellow-100 text-yellow-700 border border-yellow-200";
};

/* ------------------ Custom Tooltip ------------------ */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-bold text-gray-700 mb-2">🕐 {label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value?.toFixed(2)}
        </p>
      ))}
    </div>
  );
};

/* ------------------ River Card ------------------ */
const RiverCard = ({
  river, ph, turbidity, temp, recordedAt,
}: {
  river: { name: string; length_km: number; basin: string; threat: string };
  ph: number | null; turbidity: number | null; temp: number | null;
  recordedAt: string;
}) => {
  const phSt   = ph   !== null ? getCoralStatus("ph",          ph)        : null;
  const turbSt = turbidity !== null ? getCoralStatus("turbidity",   turbidity) : null;
  const tempSt = temp !== null ? getCoralStatus("temperature", temp)       : null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-bold text-gray-800">💧 {river.name}</p>
          <p className="text-xs text-gray-400">{river.basin} Basin · {river.length_km} km</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-red-500 font-medium">⚠️ Threat</p>
          <p className="text-xs text-gray-400 max-w-36 text-right leading-tight">{river.threat}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: "🧪", label: "pH",   val: ph?.toFixed(2),       unit: "",    st: phSt,   range: "8.0–8.3" },
          { icon: "💧", label: "Turb", val: turbidity?.toFixed(1), unit: " NTU", st: turbSt, range: "0–10" },
          { icon: "🌡️", label: "Temp", val: temp?.toFixed(1),     unit: "°C",  st: tempSt, range: "23–29" },
        ].map(c => (
          <div key={c.label} className="bg-gray-50 rounded-lg p-2.5 text-center border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">{c.icon} {c.label}</p>
            <p className="text-base font-bold text-gray-800">{c.val ?? "---"}<span className="text-xs font-normal text-gray-400">{c.unit}</span></p>
            {c.st
              ? <span className={`text-xs px-1.5 py-0.5 rounded-full ${c.st.color}`}>{c.st.label}</span>
              : <span className="text-xs text-gray-400">Waiting…</span>}
            <p className="text-xs text-gray-400 mt-1">{c.range}</p>
          </div>
        ))}
      </div>

      {recordedAt && (
        <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
          🕐 {new Date(recordedAt).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" })}
          {" · "}
          {new Date(recordedAt).toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit", second:"2-digit" })}
        </p>
      )}
      <p className="text-xs text-blue-500 mt-1">📡 IoT Device 4 — same sensor for all rivers</p>
    </div>
  );
};

/* ------------------ Main Page ------------------ */
export default function CoralReef() {
  const [phData,        setPhData]        = useState<PhData | null>(null);
  const [turbidityData, setTurbidityData] = useState<TurbidityData | null>(null);
  const [waterTempData, setWaterTempData] = useState<WaterTempData | null>(null);
  const [trendData,     setTrendData]     = useState<TrendPoint[]>([]);
  const [wsConnected,   setWsConnected]   = useState(false);
  const [lastUpdated,   setLastUpdated]   = useState("");
  const [loading,       setLoading]       = useState(true);
  const [activeArea,    setActiveArea]    = useState("hikkaduwa");

  const BASE = "http://localhost:5000/api/water-quality";

  /* ── Overall risk ── */
  const getOverallRisk = () => {
    const labels = [
      phData        ? getCoralStatus("ph",          phData.ph_value).label              : "",
      turbidityData ? getCoralStatus("turbidity",   turbidityData.turbidity_ntu).label  : "",
      waterTempData ? getCoralStatus("temperature", waterTempData.temperature).label    : "",
    ];
    if (labels.includes("Bleaching Risk")) return { label: "HIGH BLEACHING RISK", text: "text-red-700",    bg: "bg-red-50",    border: "border-red-200",    icon: "🚨", desc: "Immediate action required — coral bleaching conditions detected!" };
    if (labels.includes("Thermal Stress")) return { label: "THERMAL STRESS",       text: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", icon: "🌡️", desc: "Water temperature is stressing coral — monitor closely." };
    if (labels.some(l => l.includes("Risk") || l.includes("Stress")))
                                           return { label: "MODERATE RISK",         text: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200", icon: "⚠️", desc: "Some parameters outside safe range — action recommended." };
    if (labels.some(l => l === "Safe"))    return { label: "CONDITIONS SAFE",       text: "text-green-700",  bg: "bg-green-50",  border: "border-green-200",  icon: "✅", desc: "All water quality parameters are within safe coral ranges." };
    return                                        { label: "AWAITING DATA",         text: "text-gray-600",   bg: "bg-gray-50",   border: "border-gray-200",   icon: "⏳", desc: "Waiting for sensor data from Device 4…" };
  };

  /* ── Fetch ── */
  const fetchLatest = async () => {
    try {
      const [phRes, turbRes, tempRes] = await Promise.all([
        fetch(`${BASE}/ph`),
        fetch(`${BASE}/turbidity`),
        fetch(`${BASE}/water-temp`),
      ]);
      const phJson   = await phRes.json();
      const turbJson = await turbRes.json();
      const tempJson = await tempRes.json();

      if (phJson.length   > 0) setPhData(phJson[0]);
      if (turbJson.length > 0) setTurbidityData(turbJson[0]);
      if (tempJson.length > 0) setWaterTempData(tempJson[0]);

      const len = Math.min(phJson.length, turbJson.length, tempJson.length, 10);
      const trend: TrendPoint[] = Array.from({ length: len }, (_, i) => ({
        time:        new Date(phJson[i].recorded_at).toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" }),
        pH:          phJson[i].ph_value,
        turbidity:   turbJson[i]?.turbidity_ntu ?? 0,
        temperature: tempJson[i]?.temperature   ?? 0,
      })).reverse();

      setTrendData(trend);
      setLastUpdated(new Date().toLocaleTimeString());
      setLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setLoading(false);
    }
  };

  useEffect(() => { fetchLatest(); }, []);

  /* ── WebSocket ── */
  useEffect(() => {
    let ws: WebSocket;
    const connect = () => {
      ws = new WebSocket("ws://localhost:5000");
      ws.onopen    = () => setWsConnected(true);
      ws.onclose   = () => { setWsConnected(false); setTimeout(connect, 3000); };
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "PH_DATA")        { setPhData(msg.data);        setLastUpdated(new Date().toLocaleTimeString()); }
          if (msg.type === "TURBIDITY_DATA") { setTurbidityData(msg.data); setLastUpdated(new Date().toLocaleTimeString()); }
          if (msg.type === "WATER_TEMP")     { setWaterTempData(msg.data); fetchLatest(); }
        } catch {}
      };
    };
    connect();
    return () => ws?.close();
  }, []);

  const risk         = getOverallRisk();
  const selectedArea = CORAL_AREAS.find(a => a.id === activeArea) ?? CORAL_AREAS[0];

  return (
    <div className="min-h-screen bg-white text-gray-800">
      <Header />
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── Page Header ── */}
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🪸</span>
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">IoT Environmental Monitoring · ESP32 Device 4</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Coral Bleaching Detection Dashboard</h1>
            <p className="text-gray-500 mt-1 max-w-2xl text-sm">
              Real-time water quality monitoring for Sri Lanka coral reef health across 8 reef areas and 24 connected rivers.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${wsConnected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              <span className={`w-2 h-2 rounded-full ${wsConnected ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}/>
              {wsConnected ? "Live WebSocket" : "Connecting…"}
            </span>
            {lastUpdated && <span className="text-xs text-gray-400">Updated: {lastUpdated}</span>}
            <button onClick={fetchLatest} className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg px-3 py-1 hover:bg-blue-50 transition">
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* ── Overall Risk Banner ── */}
        <div className={`${risk.bg} ${risk.border} border-2 rounded-2xl p-6 mb-8 shadow-sm`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Overall Coral Health Status</p>
              <h2 className={`text-3xl font-bold ${risk.text}`}>{risk.label}</h2>
              <p className="text-gray-600 mt-1 text-sm">{risk.desc}</p>
            </div>
            <div className="text-6xl">{risk.icon}</div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-200">
            {[
              { label: "pH",          status: phData        ? getCoralStatus("ph",          phData.ph_value)              : null },
              { label: "Turbidity",   status: turbidityData ? getCoralStatus("turbidity",   turbidityData.turbidity_ntu)  : null },
              { label: "Temperature", status: waterTempData ? getCoralStatus("temperature", waterTempData.temperature)    : null },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 flex-wrap">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${item.status?.dot ?? "bg-gray-300"}`}/>
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ml-auto ${item.status?.color ?? "bg-gray-100 text-gray-500"}`}>
                  {item.status?.label ?? "Waiting…"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Live Sensor Cards ── */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Live Water Quality — Device 4</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">📡 ESP32 Device 4</span>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[1,2,3].map(i => <div key={i} className="bg-gray-50 rounded-2xl p-6 h-44 animate-pulse border border-gray-100"/>)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { title: "pH Level", icon: "🧪", type: "ph" as const, val: phData?.ph_value, fmt: (v:number)=>v.toFixed(2), unit: "pH", range: "8.0 – 8.3", at: phData?.recorded_at },
                { title: "Turbidity", icon: "💧", type: "turbidity" as const, val: turbidityData?.turbidity_ntu, fmt: (v:number)=>v.toFixed(2), unit: "NTU", range: "0 – 10 NTU", at: turbidityData?.recorded_at },
                { title: "Water Temperature", icon: "🌡️", type: "temperature" as const, val: waterTempData?.temperature, fmt: (v:number)=>v.toFixed(1), unit: "°C", range: "23 – 29°C", at: waterTempData?.recorded_at },
              ].map(c => {
                const st = c.val !== undefined ? getCoralStatus(c.type, c.val) : null;
                return (
                  <div key={c.title} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2"><span className="text-xl">{c.icon}</span><p className="text-sm font-semibold text-gray-600">{c.title}</p></div>
                      {st && <span className={`text-xs font-bold px-3 py-1 rounded-full ${st.color}`}>{st.label}</span>}
                    </div>
                    <p className="text-4xl font-bold text-gray-900">{c.val !== undefined ? c.fmt(c.val) : "---"} <span className="text-lg font-normal text-gray-400">{c.unit}</span></p>
                    <p className="text-xs text-green-600 font-medium mt-2">✅ Safe: {c.range}</p>
                    {c.at && <p className="text-xs text-gray-400 mt-2 border-t border-gray-100 pt-2">🕐 {new Date(c.at).toLocaleTimeString("en-GB")}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Trend Chart ── */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Water Quality Trend</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Last {trendData.length} readings</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            {trendData.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-gray-400 text-sm">⏳ Waiting for data to build trend…</div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top:5, right:20, left:0, bottom:5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" tick={{ fontSize:11, fill:"#9ca3af" }} />
                    <YAxis tick={{ fontSize:11, fill:"#9ca3af" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize:"12px" }} />
                    <ReferenceLine y={8.0} stroke="#22c55e" strokeDasharray="4 4" label={{ value:"pH min", position:"right", fontSize:10 }} />
                    <ReferenceLine y={8.3} stroke="#22c55e" strokeDasharray="4 4" label={{ value:"pH max", position:"right", fontSize:10 }} />
                    <ReferenceLine y={29}  stroke="#f97316" strokeDasharray="4 4" label={{ value:"Temp warn", position:"right", fontSize:10 }} />
                    <Line type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2.5} dot={{ r:3 }} name="Temperature °C" />
                    <Line type="monotone" dataKey="pH"          stroke="#7c3aed" strokeWidth={2.5} dot={{ r:3 }} name="pH Level" />
                    <Line type="monotone" dataKey="turbidity"   stroke="#16a34a" strokeWidth={2.5} dot={{ r:3 }} name="Turbidity NTU" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>

        {/* ── Sri Lanka Coral Areas + River Water Quality ── */}
        <section className="mb-10">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-800">🗺️ Sri Lanka Coral Areas — River Water Quality</h2>
            <p className="text-sm text-gray-500 mt-1">
              Select a reef area to view all connected rivers and their current water quality.
              All rivers use the same IoT Device 4 readings from <code className="bg-gray-100 px-1 rounded text-xs">http://localhost:5000/api/water-quality/</code>
            </p>
          </div>

          {/* Area selector tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {CORAL_AREAS.map(area => (
              <button key={area.id} onClick={() => setActiveArea(area.id)}
                className={`px-3 py-2 rounded-xl text-sm font-semibold border-2 transition ${
                  activeArea === area.id ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-600 hover:border-blue-300"
                }`}>
                {area.emoji} {area.name}
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${getRiskBadge(area.risk)}`}>{area.risk}</span>
              </button>
            ))}
          </div>

          {/* Selected area header */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-lg font-bold text-blue-800">{selectedArea.emoji} {selectedArea.name}</h3>
                <p className="text-sm text-blue-600">{selectedArea.coast}</p>
              </div>
              <span className={`text-sm font-bold px-4 py-1.5 rounded-full ${getRiskBadge(selectedArea.risk)}`}>
                {selectedArea.risk} RISK
              </span>
            </div>
            <p className="text-xs text-blue-600 mt-3">
              📡 All {selectedArea.rivers.length} rivers below use the same IoT Device 4 sensor readings.
              API: <code className="bg-blue-100 px-1 rounded">http://localhost:5000/api/water-quality/ph</code>
              · <code className="bg-blue-100 px-1 rounded">/turbidity</code>
              · <code className="bg-blue-100 px-1 rounded">/water-temp</code>
            </p>
          </div>

          {/* River cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {selectedArea.rivers.map((river, i) => (
              <RiverCard
                key={i}
                river={river}
                ph={phData?.ph_value ?? null}
                turbidity={turbidityData?.turbidity_ntu ?? null}
                temp={waterTempData?.temperature ?? null}
                recordedAt={phData?.recorded_at ?? ""}
              />
            ))}
          </div>
        </section>

        {/* ── All Areas Summary Table ── */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📊 All Sri Lanka Coral Areas — Summary</h2>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 text-gray-600 font-semibold">Reef Area</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-semibold">Coast</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-semibold">Connected Rivers</th>
                    <th className="text-center px-4 py-3 text-gray-600 font-semibold">pH</th>
                    <th className="text-center px-4 py-3 text-gray-600 font-semibold">Turbidity</th>
                    <th className="text-center px-4 py-3 text-gray-600 font-semibold">Temp</th>
                    <th className="text-center px-4 py-3 text-gray-600 font-semibold">Area Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {CORAL_AREAS.map(area => {
                    const phSt   = phData        ? getCoralStatus("ph",          phData.ph_value)              : null;
                    const turbSt = turbidityData ? getCoralStatus("turbidity",   turbidityData.turbidity_ntu)  : null;
                    const tempSt = waterTempData ? getCoralStatus("temperature", waterTempData.temperature)    : null;
                    return (
                      <tr key={area.id}
                        className={`border-b border-gray-100 hover:bg-blue-50 transition cursor-pointer ${activeArea===area.id?"bg-blue-50 font-semibold":""}`}
                        onClick={() => setActiveArea(area.id)}>
                        <td className="px-4 py-3 font-semibold text-gray-800">{area.emoji} {area.name}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{area.coast}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{area.rivers.map(r=>r.name).join(", ")}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${phSt?.color ?? "bg-gray-100 text-gray-500"}`}>
                            {phData?.ph_value.toFixed(2) ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${turbSt?.color ?? "bg-gray-100 text-gray-500"}`}>
                            {turbidityData?.turbidity_ntu.toFixed(1) ?? "—"} NTU
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tempSt?.color ?? "bg-gray-100 text-gray-500"}`}>
                            {waterTempData?.temperature.toFixed(1) ?? "—"}°C
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getRiskBadge(area.risk)}`}>{area.risk}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            📡 Same IoT Device 4 readings for all areas · Click any row to view river details above
          </p>
        </section>

        {/* ── Coral Safe Ranges ── */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🪸 Coral Reef Safe Parameter Ranges</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title:"pH Level", icon:"🧪",
                rows:[
                  {color:"text-green-600", bg:"bg-green-50",  label:"✅ Safe",           val:"8.0 – 8.3 pH"},
                  {color:"text-yellow-600",bg:"bg-yellow-50", label:"⚠️ Slight Risk",    val:"7.8–8.0 or 8.3–8.5"},
                  {color:"text-red-600",   bg:"bg-red-50",    label:"🚨 Bleaching Risk", val:"Below 7.8 or Above 8.5"},
                ],
                note:"Ocean acidification weakens coral skeletons and prevents growth.",
              },
              { title:"Turbidity", icon:"💧",
                rows:[
                  {color:"text-green-600", bg:"bg-green-50",  label:"✅ Safe",           val:"0 – 10 NTU"},
                  {color:"text-yellow-600",bg:"bg-yellow-50", label:"⚠️ Moderate Risk",  val:"10 – 20 NTU"},
                  {color:"text-red-600",   bg:"bg-red-50",    label:"🚨 Bleaching Risk", val:"Above 20 NTU"},
                ],
                note:"High turbidity blocks sunlight needed for zooxanthellae photosynthesis.",
              },
              { title:"Water Temperature", icon:"🌡️",
                rows:[
                  {color:"text-green-600",  bg:"bg-green-50",  label:"✅ Safe",           val:"23 – 29 °C"},
                  {color:"text-orange-600", bg:"bg-orange-50", label:"⚠️ Thermal Stress", val:"29 – 31 °C"},
                  {color:"text-red-600",    bg:"bg-red-50",    label:"🚨 Bleaching Risk", val:"Above 31 °C"},
                ],
                note:"Temps above 29°C cause coral to expel zooxanthellae, causing bleaching.",
              },
            ].map(card => (
              <div key={card.title} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">{card.icon}</span>
                  <p className="font-bold text-gray-800">{card.title}</p>
                </div>
                <div className="space-y-2">
                  {card.rows.map(r => (
                    <div key={r.label} className={`${r.bg} rounded-lg px-3 py-2 flex justify-between items-center`}>
                      <span className={`text-xs font-semibold ${r.color}`}>{r.label}</span>
                      <span className="text-xs text-gray-600 font-medium">{r.val}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-3 leading-relaxed">{card.note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer ── */}
        <section className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📡</span>
            <div>
              <h3 className="font-bold text-blue-800 mb-1">About This Dashboard</h3>
              <p className="text-sm text-blue-700 leading-relaxed">
                Data from <strong>ESP32 Device 4</strong> (turbidity sensor, pH BNC probe, DS18B20 temperature).
                Readings posted every 10 seconds to Node.js backend via HTTP POST and stored in PostgreSQL.
                WebSocket provides instant live updates. One device monitors all 8 Sri Lanka reef areas —
                same readings applied to all 24 connected river systems.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {["ESP32 Device 4","pH BNC Probe","Turbidity Sensor","DS18B20","Node.js","WebSocket","PostgreSQL","8 Coral Areas","24 Rivers"].map(tag=>(
                  <span key={tag} className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}