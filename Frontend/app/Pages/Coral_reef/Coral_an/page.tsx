"use client";

import React, { useState, useEffect } from "react";
import { Upload, Sparkles, User, Brain, CheckCircle, Droplets, X, MapPin } from "lucide-react";
import Navbar from "../NavBar/Navbar";
import Header from "@/app/Header/page";

interface PredictionResult {
  prediction: string;
  suggestions: string;
}

interface WaterQuality {
  ph_value?: number;
  ph_status?: string;
  turbidity_ntu?: number;
  turbidity_status?: string;
  temperature?: number;
  temp_status?: string;
}

const CORAL_AREAS = [
  {
    id: "hikkaduwa",
    name: "Hikkaduwa",
    coast: "South West Coast",
    emoji: "🪸",
    risk: "HIGH",
    rivers: ["Gin Ganga", "Bentara Ganga"],
  },
  {
    id: "bar_reef",
    name: "Bar Reef (Kalpitiya)",
    coast: "North West Coast",
    emoji: "🪸",
    risk: "CRITICAL",
    rivers: ["Kala Oya", "Deduru Oya"],
  },
  {
    id: "kayankerni",
    name: "Kayankerni",
    coast: "East Coast",
    emoji: "🪸",
    risk: "MODERATE",
    rivers: ["Maduru Oya", "Valachchenai Oya"],
  },
  {
    id: "passikudah",
    name: "Passikudah",
    coast: "East Coast",
    emoji: "🪸",
    risk: "MODERATE",
    rivers: ["Maduru Oya", "Mahaweli Ganga"],
  },
  {
    id: "trincomalee",
    name: "Trincomalee / Pigeon Island",
    coast: "East Coast",
    emoji: "🪸",
    risk: "MODERATE",
    rivers: ["Mahaweli Ganga", "Yan Oya"],
  },
  {
    id: "gulf_mannar",
    name: "Gulf of Mannar",
    coast: "North West Coast",
    emoji: "🪸",
    risk: "HIGH",
    rivers: ["Malwathu Oya", "Aruvi Aru"],
  },
  {
    id: "unawatuna",
    name: "Unawatuna",
    coast: "South Coast",
    emoji: "🪸",
    risk: "HIGH",
    rivers: ["Gin Ganga", "Nilwala Ganga"],
  },
  {
    id: "weligama",
    name: "Weligama",
    coast: "South Coast",
    emoji: "🪸",
    risk: "MODERATE",
    rivers: ["Nilwala Ganga", "Polwatta Ganga"],
  },
];

const getRiskBadge = (risk: string) => {
  if (risk === "CRITICAL") return "bg-red-600 text-white";
  if (risk === "HIGH")     return "bg-orange-500 text-white";
  return                          "bg-yellow-500 text-white";
};

const getStatusColor = (status: string) => {
  if (!status) return "bg-gray-100 text-gray-600";
  const s = status.toUpperCase();
  if (s === "SAFE")                                 return "bg-green-100 text-green-700";
  if (s.includes("RISK") || s.includes("STRESS"))  return "bg-yellow-100 text-yellow-700";
  if (s.includes("BLEACHING") || s === "TOO COLD") return "bg-red-100 text-red-700";
  return "bg-blue-100 text-blue-700";
};

export default function AnalyzeCoral() {
  const [file,         setFile]         = useState<File | null>(null);
  const [preview,      setPreview]      = useState<string | null>(null);
  const [role,         setRole]         = useState<string>("researcher");
  const [loading,      setLoading]      = useState<boolean>(false);
  const [result,       setResult]       = useState<PredictionResult | null>(null);
  const [waterQuality, setWaterQuality] = useState<WaterQuality>({});
  const [showBanner,   setShowBanner]   = useState<boolean>(false);
  const [selectedArea, setSelectedArea] = useState<typeof CORAL_AREAS[0] | null>(null);
  const [showRivers,   setShowRivers]   = useState<boolean>(false);

  // ── Fetch water quality silently ─────────
  useEffect(() => {
    const fetchWaterQuality = async () => {
      try {
        const [phRes, turbRes, tempRes] = await Promise.all([
          fetch("http://localhost:5000/api/ph"),
          fetch("http://localhost:5000/api/turbidity"),
          fetch("http://localhost:5000/api/water-temp"),
        ]);
        const phJson   = await phRes.json();
        const turbJson = await turbRes.json();
        const tempJson = await tempRes.json();
        setWaterQuality({
          ph_value:         phJson[0]?.ph_value,
          ph_status:        phJson[0]?.ph_status,
          turbidity_ntu:    turbJson[0]?.turbidity_ntu,
          turbidity_status: turbJson[0]?.turbidity_status,
          temperature:      tempJson[0]?.temperature,
          temp_status:      tempJson[0]?.temp_status,
        });
      } catch (err) {
        console.error("Error fetching water quality:", err);
      }
    };
    fetchWaterQuality();
  }, []);

  // ── Banner ────────────────────────────────
  const getBanner = () => {
    const statuses = [
      waterQuality.ph_status,
      waterQuality.turbidity_status,
      waterQuality.temp_status,
    ].filter(Boolean).map(s => s!.toUpperCase());

    if (statuses.some(s => s.includes("BLEACHING")))
      return { label: "🚨 HIGH BLEACHING RISK — Water conditions are critical!", color: "bg-red-600 text-white" };
    if (statuses.some(s => s.includes("STRESS") || s.includes("RISK")))
      return { label: "⚠️ MODERATE RISK — Water conditions show coral stress!", color: "bg-orange-500 text-white" };
    if (statuses.length > 0)
      return { label: "✅ SAFE — Current water conditions are good for corals.", color: "bg-green-600 text-white" };
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    }
    setResult(null);
    setShowBanner(false);
    setShowRivers(false);
  };

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!file)         return alert("Please select an image.");
    if (!selectedArea) return alert("Please select a coral area.");

    const formData = new FormData();
    formData.append("file",              file);
    formData.append("role",              role);
    formData.append("coral_area",        selectedArea.name);
    formData.append("coast",             selectedArea.coast);
    formData.append("rivers",            selectedArea.rivers.join(", "));
    formData.append("ph_value",          String(waterQuality.ph_value         ?? ""));
    formData.append("ph_status",         String(waterQuality.ph_status         ?? ""));
    formData.append("turbidity_ntu",     String(waterQuality.turbidity_ntu     ?? ""));
    formData.append("turbidity_status",  String(waterQuality.turbidity_status  ?? ""));
    formData.append("temperature",       String(waterQuality.temperature       ?? ""));
    formData.append("temp_status",       String(waterQuality.temp_status       ?? ""));

    setLoading(true);
    try {
      const res  = await fetch("http://localhost:8000/predict", {
        method: "POST",
        body:   formData,
      });
      const data: PredictionResult = await res.json();
      setResult(data);
      setShowBanner(true);
      setShowRivers(true); // ← show rivers ONLY after analysis
    } catch (err) {
      console.error(err);
      alert("Error predicting coral image.");
    }
    setLoading(false);
  };

  const banner = getBanner();

  const roleDescriptions: { [key: string]: string } = {
    researcher:    "Get detailed scientific analysis and metrics",
    tourism_guide: "Receive tourist-friendly insights and facts",
    general:       "Get simplified information about coral health",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 text-black">
      <Header />
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* ── TOP BANNER — only after result ── */}
        {showBanner && banner && (
          <div className={`${banner.color} rounded-2xl px-6 py-4 mb-6 shadow-lg`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-bold text-lg">{banner.label}</p>
                <div className="flex flex-wrap gap-3 mt-3">
                  <div className="bg-white bg-opacity-20 rounded-lg px-3 py-2 text-sm">
                    <span className="opacity-75">pH</span>
                    <span className="font-bold ml-2">{waterQuality.ph_value?.toFixed(2) ?? "---"}</span>
                    <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-white bg-opacity-30">
                      {waterQuality.ph_status}
                    </span>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg px-3 py-2 text-sm">
                    <span className="opacity-75">Turbidity</span>
                    <span className="font-bold ml-2">{waterQuality.turbidity_ntu?.toFixed(1) ?? "---"} NTU</span>
                    <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-white bg-opacity-30">
                      {waterQuality.turbidity_status}
                    </span>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg px-3 py-2 text-sm">
                    <span className="opacity-75">Temp</span>
                    <span className="font-bold ml-2">{waterQuality.temperature?.toFixed(1) ?? "---"}°C</span>
                    <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-white bg-opacity-30">
                      {waterQuality.temp_status}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowBanner(false)} className="ml-4 mt-1 opacity-80 hover:opacity-100">
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        {/* ── Upload Card ── */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8 print:hidden">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2"></div>
          <div className="p-10 space-y-8">

            {/* Upload */}
            <div>
              <label className="block text-lg font-semibold mb-4 text-black">
                <Upload size={20} className="inline mr-2 text-blue-600" />
                Upload Coral Image
              </label>
              <input type="file" accept="image/*" onChange={handleFileChange} id="file-input" className="hidden" />
              <label
                htmlFor="file-input"
                className="block border-2 border-dashed border-blue-300 rounded-2xl p-10 text-center cursor-pointer hover:bg-blue-50"
              >
                {preview ? (
                  <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg shadow" />
                ) : (
                  <p className="text-black">Click or drag image here (PNG / JPG)</p>
                )}
              </label>
            </div>

            {/* ── Coral Area Selection ── */}
            <div>
              <label className="block text-lg font-semibold mb-4 text-black">
                <MapPin size={20} className="inline mr-2 text-red-500" />
                Select Coral Area in Sri Lanka
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CORAL_AREAS.map((area) => (
                  <div
                    key={area.id}
                    onClick={() => { setSelectedArea(area); setShowRivers(false); setResult(null); setShowBanner(false); }}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                      selectedArea?.id === area.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-black">{area.emoji} {area.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${getRiskBadge(area.risk)}`}>
                        {area.risk}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{area.coast}</p>
                    {/* Just show river names — no water data yet */}
                    <p className="text-xs text-blue-600 mt-1">
                      🌊 {area.rivers.join(" · ")}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-lg font-semibold mb-4 text-black">
                <User size={20} className="inline mr-2 text-green-600" />
                Select Your Role
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { value: "researcher",    label: "Researcher",    emoji: "🔬" },
                  { value: "tourism_guide", label: "Tourism Guide", emoji: "🗺️" },
                  { value: "general",       label: "General User",  emoji: "👤" },
                ].map((option) => (
                  <div
                    key={option.value}
                    onClick={() => setRole(option.value)}
                    className={`p-4 rounded-xl border-2 cursor-pointer ${
                      role === option.value ? "border-blue-500 bg-blue-50" : "border-gray-200"
                    }`}
                  >
                    <p className="text-2xl">{option.emoji}</p>
                    <p className="font-semibold text-black">{option.label}</p>
                    <p className="text-xs text-black">{roleDescriptions[option.value]}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading || !file || !selectedArea}
              className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 text-white disabled:opacity-50"
            >
              <Sparkles className="inline mr-2" />
              {loading ? "Analyzing..." : "Analyze Coral"}
            </button>
            {!selectedArea && file && (
              <p className="text-center text-sm text-red-500">⚠️ Please select a coral area</p>
            )}
          </div>
        </div>

        {/* ── Results ── */}
        {result && showRivers && selectedArea && (
          <div className="print-area space-y-6 text-black">

            {/* Report Header */}
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold">Coral Reef Health Assessment Report</h1>
              <p className="mt-1 text-gray-500">{selectedArea.emoji} {selectedArea.name} — {selectedArea.coast}</p>
              <p className="mt-1 text-gray-400 text-sm">AI Analysis + Live IoT Water Quality Data</p>
              <hr className="mt-4" />
            </div>

            {/* ── River Water Quality — shown AFTER analysis ── */}
            <div className="bg-blue-50 rounded-xl shadow p-6 border-l-4 border-blue-400">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
                <Droplets className="text-blue-600" />
                River Water Quality — {selectedArea.name}
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                ⚠️ IoT Device 4 monitors water quality. Same readings applied to all rivers in this area.
              </p>

              <div className="space-y-3">
                {selectedArea.rivers.map((river, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 border shadow-sm">
                    <p className="font-bold text-blue-800 mb-3">💧 {river}</p>
                    <div className="grid grid-cols-3 gap-3 text-center">

                      {/* pH */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-1">pH Level</p>
                        <p className="text-xl font-bold text-blue-700">
                          {waterQuality.ph_value?.toFixed(2) ?? "---"}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(waterQuality.ph_status ?? "")}`}>
                          {waterQuality.ph_status ?? "N/A"}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">Safe: 8.0–8.3</p>
                      </div>

                      {/* Turbidity */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-1">Turbidity</p>
                        <p className="text-xl font-bold text-blue-700">
                          {waterQuality.turbidity_ntu?.toFixed(1) ?? "---"}
                          <span className="text-sm font-normal"> NTU</span>
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(waterQuality.turbidity_status ?? "")}`}>
                          {waterQuality.turbidity_status ?? "N/A"}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">Safe: 0–10 NTU</p>
                      </div>

                      {/* Temperature */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-1">Temperature</p>
                        <p className="text-xl font-bold text-blue-700">
                          {waterQuality.temperature?.toFixed(1) ?? "---"}
                          <span className="text-sm font-normal">°C</span>
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(waterQuality.temp_status ?? "")}`}>
                          {waterQuality.temp_status ?? "N/A"}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">Safe: 23–29°C</p>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prediction */}
            <div className="bg-white rounded-xl shadow p-6 border-l-4 border-green-500">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CheckCircle className="text-green-600" />
                Prediction Result
              </h2>
              <p className="mt-4 text-black whitespace-pre-line">{result.prediction}</p>
            </div>

            {/* AI Suggestions */}
            <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Brain className="text-blue-600" />
                AI Recommendations
              </h2>
              <p className="text-xs text-gray-400 mb-3">
                Based on coral image + {selectedArea.name} location + live river water quality
              </p>
              <p className="mt-2 text-black whitespace-pre-line">{result.suggestions}</p>
            </div>

            {/* Print */}
            <button
              onClick={() => window.print()}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold print:hidden"
            >
              🖨️ Print Report
            </button>

            {/* Reset */}
            <button
              onClick={() => {
                setFile(null); setPreview(null);
                setResult(null); setShowBanner(false);
                setShowRivers(false); setSelectedArea(null);
              }}
              className="w-full py-3 bg-gray-200 rounded-xl print:hidden text-black"
            >
              Analyze Another Image
            </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; color: black !important; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 40px; background: white; }
        }
      `}</style>
    </div>
  );
}