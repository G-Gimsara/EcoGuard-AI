"use client";

import React, { useState, useEffect } from "react";
import {
  Upload, Sparkles, User, Brain, CheckCircle, Droplets, X, MapPin,
  Image as ImageIcon, AlertTriangle
} from "lucide-react";
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

interface ImageQualityScore {
  brightness: number;
  contrast: number;
  sharpness: number;
  overall: "poor" | "fair" | "good";
}

const CORAL_AREAS = [
  { id: "hikkaduwa",   name: "Hikkaduwa",                coast: "South West Coast", emoji: "🪸", risk: "HIGH",     rivers: ["Gin Ganga", "Bentara Ganga"] },
  { id: "bar_reef",    name: "Bar Reef (Kalpitiya)",     coast: "North West Coast", emoji: "🪸", risk: "CRITICAL", rivers: ["Kala Oya", "Deduru Oya"] },
  { id: "kayankerni",  name: "Kayankerni",               coast: "East Coast",       emoji: "🪸", risk: "MODERATE", rivers: ["Maduru Oya", "Valachchenai Oya"] },
  { id: "passikudah",  name: "Passikudah",               coast: "East Coast",       emoji: "🪸", risk: "MODERATE", rivers: ["Maduru Oya", "Mahaweli Ganga"] },
  { id: "trincomalee", name: "Trincomalee / Pigeon Island", coast: "East Coast",    emoji: "🪸", risk: "MODERATE", rivers: ["Mahaweli Ganga", "Yan Oya"] },
  { id: "gulf_mannar", name: "Gulf of Mannar",           coast: "North West Coast", emoji: "🪸", risk: "HIGH",     rivers: ["Malwathu Oya", "Aruvi Aru"] },
  { id: "unawatuna",   name: "Unawatuna",                coast: "South Coast",      emoji: "🪸", risk: "HIGH",     rivers: ["Gin Ganga", "Nilwala Ganga"] },
  { id: "weligama",    name: "Weligama",                 coast: "South Coast",      emoji: "🪸", risk: "MODERATE", rivers: ["Nilwala Ganga", "Polwatta Ganga"] },
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

function analyzeImageQuality(canvas: HTMLCanvasElement): ImageQualityScore {
  const ctx = canvas.getContext("2d")!;
  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;
  const total = width * height;
  let sumLum = 0, sumSqLum = 0;
  const lums: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    lums.push(lum); sumLum += lum; sumSqLum += lum * lum;
  }
  const meanLum = sumLum / total;
  const stdDev  = Math.sqrt(sumSqLum / total - meanLum * meanLum);
  let edgeSum = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const c = lums[y * width + x];
      edgeSum += Math.abs(4*c - lums[(y-1)*width+x] - lums[(y+1)*width+x] - lums[y*width+(x+1)] - lums[y*width+(x-1)]);
    }
  }
  const brightness = Math.min(100, Math.round((meanLum / 255) * 100));
  const contrast   = Math.min(100, Math.round((stdDev / 80) * 100));
  const sharpness  = Math.min(100, Math.round((edgeSum / ((width-2)*(height-2)) / 12) * 100));
  const avg = (brightness + contrast + sharpness) / 3;
  const overall: ImageQualityScore["overall"] = avg >= 60 ? "good" : avg >= 35 ? "fair" : "poor";
  return { brightness, contrast, sharpness, overall };
}

function imageToCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const scale  = Math.min(1, 1024 / Math.max(img.naturalWidth, img.naturalHeight));
  canvas.width  = Math.round(img.naturalWidth  * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export default function AnalyzeCoral() {
  const [file,         setFile]         = useState<File | null>(null);
  const [preview,      setPreview]      = useState<string | null>(null);
  const [quality,      setQuality]      = useState<ImageQualityScore | null>(null);
  const [role,         setRole]         = useState<string>("researcher");
  const [loading,      setLoading]      = useState<boolean>(false);
  const [result,       setResult]       = useState<PredictionResult | null>(null);
  const [waterQuality, setWaterQuality] = useState<WaterQuality>({});
  const [showBanner,   setShowBanner]   = useState<boolean>(false);
  const [selectedArea, setSelectedArea] = useState<typeof CORAL_AREAS[0] | null>(null);
  const [showRivers,   setShowRivers]   = useState<boolean>(false);
  const [qualityError,    setQualityError]    = useState<boolean>(false);
  const [overrideQuality, setOverrideQuality] = useState<boolean>(false);

  const isQualityTooLow = (q: ImageQualityScore | null) => {
    if (!q) return false;
    return q.overall === "poor" && [q.brightness, q.contrast, q.sharpness].filter(v => v < 25).length >= 2;
  };

  useEffect(() => {
    const fetchWQ = async () => {
      const safeJson = async (url: string) => {
        try {
          const res = await fetch(url);
          return JSON.parse(await res.text());
        } catch { return null; }
      };
      const [phJ, turbJ, tempJ] = await Promise.all([
        safeJson("http://localhost:5000/api/water-quality/ph"),
        safeJson("http://localhost:5000/api/water-quality/turbidity"),
        safeJson("http://localhost:5000/api/water-quality/water-temp"),
      ]);
      setWaterQuality({
        ph_value:         phJ?.[0]?.ph_value,
        ph_status:        phJ?.[0]?.ph_status,
        turbidity_ntu:    turbJ?.[0]?.turbidity_ntu,
        turbidity_status: turbJ?.[0]?.turbidity_status,
        temperature:      tempJ?.[0]?.temperature,
        temp_status:      tempJ?.[0]?.temp_status,
      });
    };
    fetchWQ();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const f = e.target.files[0];
    setFile(f);
    setResult(null); setShowBanner(false); setShowRivers(false);
    setQualityError(false); setOverrideQuality(false); setQuality(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      const img = new Image();
      img.onload = () => setQuality(analyzeImageQuality(imageToCanvas(img)));
      img.src = dataUrl;
    };
    reader.readAsDataURL(f);
  };

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!file)         return alert("Please select an image.");
    if (!selectedArea) return alert("Please select a coral area.");
    if (isQualityTooLow(quality) && !overrideQuality) { setQualityError(true); return; }
    setQualityError(false);
    setLoading(true);
    const formData = new FormData();
    formData.append("file",             file, file.name);
    formData.append("role",             role);
    formData.append("coral_area",       selectedArea.name);
    formData.append("coast",            selectedArea.coast);
    formData.append("rivers",           selectedArea.rivers.join(", "));
    formData.append("ph_value",         String(waterQuality.ph_value         ?? ""));
    formData.append("ph_status",        String(waterQuality.ph_status        ?? ""));
    formData.append("turbidity_ntu",    String(waterQuality.turbidity_ntu    ?? ""));
    formData.append("turbidity_status", String(waterQuality.turbidity_status ?? ""));
    formData.append("temperature",      String(waterQuality.temperature      ?? ""));
    formData.append("temp_status",      String(waterQuality.temp_status      ?? ""));
    try {
      const res  = await fetch("http://localhost:8000/predict", { method: "POST", body: formData });
      const data: PredictionResult = await res.json();
      setResult(data); setShowBanner(true); setShowRivers(true);
    } catch (err) {
      console.error(err);
      alert("Error predicting coral image.");
    }
    setLoading(false);
  };

  const getBanner = () => {
    const statuses = [waterQuality.ph_status, waterQuality.turbidity_status, waterQuality.temp_status]
      .filter(Boolean).map(s => s!.toUpperCase());
    if (statuses.some(s => s.includes("BLEACHING")))
      return { label: "🚨 HIGH BLEACHING RISK — Water conditions are critical!", color: "bg-red-600 text-white" };
    if (statuses.some(s => s.includes("STRESS") || s.includes("RISK")))
      return { label: "⚠️ MODERATE RISK — Water conditions show coral stress!", color: "bg-orange-500 text-white" };
    if (statuses.length > 0)
      return { label: "✅ SAFE — Current water conditions are good for corals.", color: "bg-green-600 text-white" };
    return null;
  };
  const banner = getBanner();

  const roleDescriptions: Record<string, string> = {
    researcher:    "Get detailed scientific analysis and metrics",
    tourism_guide: "Receive tourist-friendly insights and facts",
    general:       "Get simplified information about coral health",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 text-black">
      <Header />
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Banner */}
        {showBanner && banner && (
          <div className={`${banner.color} rounded-2xl px-6 py-4 mb-6 shadow-lg`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-bold text-lg">{banner.label}</p>
                <div className="flex flex-wrap gap-3 mt-3">
                  {[
                    { label: "pH",        val: waterQuality.ph_value?.toFixed(2),      unit: "",     status: waterQuality.ph_status },
                    { label: "Turbidity", val: waterQuality.turbidity_ntu?.toFixed(1), unit: " NTU", status: waterQuality.turbidity_status },
                    { label: "Temp",      val: waterQuality.temperature?.toFixed(1),   unit: "°C",   status: waterQuality.temp_status },
                  ].map(chip => (
                    <div key={chip.label} className="bg-white bg-opacity-20 rounded-lg px-3 py-2 text-sm">
                      <span className="opacity-75">{chip.label}</span>
                      <span className="font-bold ml-2">{chip.val ?? "---"}{chip.unit}</span>
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-white bg-opacity-30">{chip.status}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => setShowBanner(false)} className="ml-4 mt-1 opacity-80 hover:opacity-100"><X size={20} /></button>
            </div>
          </div>
        )}

        {/* Upload Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8 print:hidden">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2" />
          <div className="p-10 space-y-8">

            {/* Upload */}
            <div>
              <label className="block text-lg font-semibold mb-4 text-black">
                <Upload size={20} className="inline mr-2 text-blue-600" />Upload Coral Image
              </label>
              <input type="file" accept="image/*" onChange={handleFileChange} id="file-input" className="hidden" />
              <label htmlFor="file-input" className="block border-2 border-dashed border-blue-300 rounded-2xl p-8 text-center cursor-pointer hover:bg-blue-50 transition">
                {preview ? <p className="text-sm text-blue-600 font-medium">Click to change image</p>
                         : <p className="text-black">Click or drag image here (PNG / JPG)</p>}
              </label>

              {preview && (
                <div className="mt-5 space-y-4">
                  <div className="relative rounded-xl overflow-hidden shadow border border-gray-200 bg-black">
                    <img src={preview} alt="Coral" className="w-full h-64 object-contain" />
                    <div className="absolute top-2 left-2 bg-black bg-opacity-55 text-white text-xs px-2 py-0.5 rounded-full">📷 Original</div>
                  </div>
                  {quality && (
                    <div className={`rounded-xl p-4 border text-xs space-y-3 ${
                      quality.overall === "good" ? "bg-green-50 border-green-200"
                      : quality.overall === "fair" ? "bg-yellow-50 border-yellow-200"
                      : "bg-red-50 border-red-200"}`}>
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-xs px-2 py-0.5 rounded-full ${
                          quality.overall === "good"  ? "bg-green-200 text-green-800"
                          : quality.overall === "fair" ? "bg-yellow-200 text-yellow-800"
                          : "bg-red-200 text-red-800"}`}>
                          {quality.overall === "good" ? "✅ Good" : quality.overall === "fair" ? "⚠️ Fair" : "🚨 Poor"} Image Quality
                        </span>
                        <span className="text-gray-400">Pre-analysis check</span>
                      </div>
                      {[
                        { label: "Brightness", val: quality.brightness },
                        { label: "Contrast",   val: quality.contrast },
                        { label: "Sharpness",  val: quality.sharpness },
                      ].map(m => (
                        <div key={m.label}>
                          <div className="flex justify-between text-gray-500 mb-1">
                            <span>{m.label}</span><span className="font-medium">{m.val}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${m.val >= 60 ? "bg-green-500" : m.val >= 35 ? "bg-yellow-500" : "bg-red-500"}`}
                              style={{ width: `${m.val}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Coral Area */}
            <div>
              <label className="block text-lg font-semibold mb-4 text-black">
                <MapPin size={20} className="inline mr-2 text-red-500" />Select Coral Area in Sri Lanka
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CORAL_AREAS.map(area => (
                  <div key={area.id}
                    onClick={() => { setSelectedArea(area); setShowRivers(false); setResult(null); setShowBanner(false); }}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition ${selectedArea?.id === area.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"}`}>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-black">{area.emoji} {area.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${getRiskBadge(area.risk)}`}>{area.risk}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{area.coast}</p>
                    <p className="text-xs text-blue-600 mt-1">🌊 {area.rivers.join(" · ")}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-lg font-semibold mb-4 text-black">
                <User size={20} className="inline mr-2 text-green-600" />Select Your Role
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { value: "researcher",    label: "Researcher",    emoji: "🔬" },
                  { value: "tourism_guide", label: "Tourism Guide", emoji: "🗺️" },
                  { value: "general",       label: "General User",  emoji: "👤" },
                ].map(option => (
                  <div key={option.value} onClick={() => setRole(option.value)}
                    className={`p-4 rounded-xl border-2 cursor-pointer ${role === option.value ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
                    <p className="text-2xl">{option.emoji}</p>
                    <p className="font-semibold text-black">{option.label}</p>
                    <p className="text-xs text-black">{roleDescriptions[option.value]}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button onClick={handleSubmit} disabled={loading || !file || !selectedArea}
              className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 text-white disabled:opacity-50 transition">
              <Sparkles className="inline mr-2" />
              {loading ? "🧠 Analyzing coral…" : "Analyze Coral"}
            </button>

            {/* Quality Error */}
            {qualityError && quality && (
              <div className="rounded-2xl border-2 border-red-400 bg-red-50 overflow-hidden">
                <div className="bg-red-500 px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={20} className="text-white" />
                    <p className="font-bold text-white text-sm">Image Quality Too Low for AI Analysis</p>
                  </div>
                  <button onClick={() => setQualityError(false)} className="text-white opacity-80 hover:opacity-100"><X size={18} /></button>
                </div>
                <div className="px-5 py-4 space-y-4">
                  <p className="text-red-800 text-sm font-medium">
                    The uploaded image cannot be reliably analysed. The AI model requires clear, well-lit coral images.
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Brightness", val: quality.brightness, icon: "☀️", tip: quality.brightness < 25 ? "Image is too dark" : "Acceptable" },
                      { label: "Contrast",   val: quality.contrast,   icon: "◑",  tip: quality.contrast   < 25 ? "Too little contrast" : "Acceptable" },
                      { label: "Sharpness",  val: quality.sharpness,  icon: "🔍", tip: quality.sharpness  < 25 ? "Image is too blurry" : "Acceptable" },
                    ].map(m => (
                      <div key={m.label} className={`rounded-xl p-3 border text-center ${m.val < 25 ? "bg-red-100 border-red-300" : "bg-green-50 border-green-200"}`}>
                        <p className="text-lg mb-1">{m.icon}</p>
                        <p className="text-xs font-bold text-gray-700">{m.label}</p>
                        <p className={`text-xl font-bold ${m.val < 25 ? "text-red-600" : "text-green-600"}`}>{m.val}%</p>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden my-1.5">
                          <div className={`h-full rounded-full ${m.val < 25 ? "bg-red-500" : "bg-green-500"}`} style={{ width: `${m.val}%` }} />
                        </div>
                        <p className={`text-xs leading-tight ${m.val < 25 ? "text-red-700" : "text-green-700"}`}>{m.tip}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <label htmlFor="file-input" className="flex-1 py-2.5 rounded-xl border-2 border-red-400 text-red-600 font-semibold text-sm text-center cursor-pointer hover:bg-red-100 transition">
                      📂 Upload a Better Image
                    </label>
                    <button onClick={() => { setQualityError(false); setOverrideQuality(true); }}
                      className="flex-1 py-2.5 rounded-xl bg-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-300 transition">
                      Dismiss &amp; Try Anyway
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!selectedArea && file && <p className="text-center text-sm text-red-500">⚠️ Please select a coral area</p>}
          </div>
        </div>

        {/* Results */}
        {result && showRivers && selectedArea && (
          <div className="print-area space-y-6 text-black">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold">Coral Reef Health Assessment Report</h1>
              <p className="mt-1 text-gray-500">{selectedArea.emoji} {selectedArea.name} — {selectedArea.coast}</p>
              <p className="mt-1 text-gray-400 text-sm">AI Analysis + Live IoT Water Quality Data</p>
              <hr className="mt-4" />
            </div>

            <div className="bg-blue-50 rounded-xl shadow p-6 border-l-4 border-blue-400">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
                <Droplets className="text-blue-600" />River Water Quality — {selectedArea.name}
              </h2>
              <p className="text-xs text-gray-500 mb-4">⚠️ IoT Device monitors water quality. Same readings applied to all rivers in this area.</p>
              <div className="space-y-3">
                {selectedArea.rivers.map((river, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 border shadow-sm">
                    <p className="font-bold text-blue-800 mb-3">💧 {river}</p>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      {[
                        { label: "pH Level",    val: waterQuality.ph_value?.toFixed(2),      unit: "",     status: waterQuality.ph_status,        range: "Safe: 8.0–8.3" },
                        { label: "Turbidity",   val: waterQuality.turbidity_ntu?.toFixed(1), unit: " NTU", status: waterQuality.turbidity_status, range: "Safe: 0–10 NTU" },
                        { label: "Temperature", val: waterQuality.temperature?.toFixed(1),   unit: "°C",   status: waterQuality.temp_status,       range: "Safe: 23–29°C" },
                      ].map(c => (
                        <div key={c.label} className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">{c.label}</p>
                          <p className="text-xl font-bold text-blue-700">{c.val ?? "---"}<span className="text-sm font-normal">{c.unit}</span></p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(c.status ?? "")}`}>{c.status ?? "N/A"}</span>
                          <p className="text-xs text-gray-400 mt-1">{c.range}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6 border-l-4 border-green-500">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CheckCircle className="text-green-600" /> Prediction Result
              </h2>
              <p className="mt-4 text-black whitespace-pre-line">{result.prediction}</p>
            </div>

            <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Brain className="text-blue-600" /> AI Recommendations
              </h2>
              <p className="text-xs text-gray-400 mb-3">Based on coral image + {selectedArea.name} + live river water quality</p>
              <p className="mt-2 text-black whitespace-pre-line">{result.suggestions}</p>
            </div>

            <button onClick={() => window.print()} className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold print:hidden">
              🖨️ Print Report
            </button>
            <button onClick={() => { setFile(null); setPreview(null); setResult(null); setShowBanner(false); setShowRivers(false); setSelectedArea(null); setQuality(null); }}
              className="w-full py-3 bg-gray-200 rounded-xl print:hidden text-black">
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