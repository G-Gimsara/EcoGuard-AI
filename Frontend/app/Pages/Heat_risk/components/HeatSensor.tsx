"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { Thermometer, Droplets, Activity, TrendingUp, Clock, MapPin, AlertTriangle, Volume2, VolumeX, ShieldAlert, Zap } from "lucide-react";

// --- Types & Constants ---
interface SensorData {
  id: number;
  device_id: string;
  temperature: string;
  humidity: string;
  heat_index: string;
  risk_level: string;
}

const locations: Record<string, { lat: number; lon: number; name: string }> = {
  kaduwela: { lat: 6.936, lon: 79.984, name: "Kaduwela" },
  homagama: { lat: 6.845, lon: 80.015, name: "Homagama" },
  kolonnawa: { lat: 6.933, lon: 79.885, name: "Kolonnawa" },
  colombo: { lat: 6.932, lon: 79.846, name: "Colombo" },
  moratuwa: { lat: 6.779, lon: 79.883, name: "Moratuwa" },
  padukka: { lat: 6.841, lon: 80.093, name: "Padukka" },
  dehiwala: { lat: 6.851, lon: 79.866, name: "Dehiwala" },
  kesbawa: { lat: 6.779, lon: 79.947, name: "Kesbawa" },
  rathmalana: { lat: 6.819, lon: 79.881, name: "Rathmalana" },
  seethawaka: { lat: 6.954, lon: 80.205, name: "Seethawaka" },
  thimbirigasyaya: { lat: 6.896, lon: 79.867, name: "Thimbirigasyaya" },
  maharagama: { lat: 6.848, lon: 79.927, name: "Maharagama" },
  jayawardanapura: { lat: 6.885, lon: 79.904, name: "Jayawardanapura" },
};

function calculateHeatIndex(tempC: number, humidity: number) {
  const tempF = (tempC * 9) / 5 + 32;
  let hiF =
    -42.379 +
    2.04901523 * tempF +
    10.14333127 * humidity -
    0.22475541 * tempF * humidity -
    0.00683783 * tempF * tempF -
    0.05481717 * humidity * humidity +
    0.00122874 * tempF * tempF * humidity +
    0.00085282 * tempF * humidity * humidity -
    0.00000199 * tempF * tempF * humidity * humidity;

  const hiC = tempF < 80 ? tempC : (hiF - 32) * 5 / 9;
  return { hiC: hiC.toFixed(1), hiF };
}

export default function LiveMonitoringCard() {
  const [data, setData] = useState<SensorData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>("kaduwela");
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("/warning.mp3");
    audioRef.current.loop = true;
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const fetchData = async () => {
    try {
      let sData: SensorData | null = null;

      if (selectedLocation === "kaduwela") {
        const res = await fetch("http://localhost:5000/api/sensors/latest");
        const json = await res.json();
        sData = json[0] || null;
      } else {
        const { lat, lon } = locations[selectedLocation];
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m&timezone=auto`
        );
        const json = await res.json();
        const { temperature_2m: temp, relative_humidity_2m: hum } = json.current;

        const { hiC, hiF } = calculateHeatIndex(temp, hum);

        let risk = "Normal";
        if (hiF >= 125) risk = "Extreme Danger";
        else if (hiF >= 103) risk = "Danger";
        else if (hiF >= 90) risk = "Extreme Caution";
        else if (hiF >= 80) risk = "Caution";

        sData = {
          id: 0,
          device_id: selectedLocation,
          temperature: temp.toFixed(1),
          humidity: hum.toFixed(1),
          heat_index: hiC,
          risk_level: risk,
        };
      }

      setData(sData);
      setLastUpdate(new Date());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 3000);
    return () => clearInterval(timer);
  }, [selectedLocation]);

  useEffect(() => {
    const isDanger = data?.risk_level.toLowerCase().includes("danger");
    if (isDanger && !isMuted) {
      audioRef.current?.play().catch(() => {});
    } else {
      audioRef.current?.pause();
    }
  }, [data?.risk_level, isMuted]);

  const riskTheme = useMemo(() => {
    const level = data?.risk_level.toLowerCase() || "";
    const isCritical = level.includes("danger") || level.includes("extreme");

    if (level === "normal")
      return { color: "emerald", bg: "bg-emerald-500", text: "text-emerald-600", isCritical };
    if (level === "caution")
      return { color: "amber", bg: "bg-amber-500", text: "text-amber-600", isCritical };
    if (level === "extreme caution")
      return { color: "orange", bg: "bg-orange-500", text: "text-orange-600", isCritical };
    if (level === "danger")
      return { color: "red", bg: "bg-red-600", text: "text-red-600", isCritical: true };
    if (level === "extreme danger")
      return { color: "rose", bg: "bg-rose-700", text: "text-rose-700", isCritical: true };

    return { color: "red", bg: "bg-red-600", text: "text-red-600", isCritical: true };
  }, [data?.risk_level]);

  if (!data) {
    return (
      <div className="w-full max-w-11xl mx-auto p-6">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-12 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-5"></div>
          <h3 className="text-xl font-semibold text-slate-800">Connecting to EcoGuard Network</h3>
          <p className="text-slate-500 mt-2">Initializing real-time monitoring...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-11xl mx-auto p-4">
      <div
        className={`relative overflow-hidden rounded-3xl shadow-2xl border transition-all duration-700
          ${riskTheme.isCritical 
            ? 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200' 
            : 'bg-white border-slate-100'
          }`}
      >
        {/* Top Navigation */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${riskTheme.bg} text-white`}>
              <ShieldAlert size={24} />
            </div>
            <div>
              <h1 className="font-bold text-xl text-slate-900">EcoGuard Live Monitoring</h1>
              <p className="text-sm text-emerald-600 font-medium -mt-1">Real-Time Heat Risk Surveillance</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5">
              <MapPin size={18} className="text-emerald-600" />
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                {Object.entries(locations).map(([key, loc]) => (
                  <option key={key} value={key}>{loc.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3 rounded-2xl border transition-all ${
                isMuted 
                  ? 'bg-slate-100 text-slate-400 border-slate-200' 
                  : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
              }`}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          </div>
        </div>

        {/* Monitoring Grid */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Temperature Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                  <Thermometer size={24} />
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  LIVE
                </div>
              </div>
              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-500 mb-2">AIR TEMPERATURE</p>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-slate-900">{data.temperature}</span>
                  <span className="text-lg text-slate-400 ml-1">°C</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div 
                  className="h-3 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min((parseFloat(data.temperature) / 50) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Humidity Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-cyan-100 rounded-xl text-cyan-600">
                  <Droplets size={24} />
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  LIVE
                </div>
              </div>
              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-500 mb-2">HUMIDITY</p>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-slate-900">{data.humidity}</span>
                  <span className="text-lg text-slate-400 ml-1">%</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div 
                  className="h-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-700"
                  style={{ width: `${data.humidity}%` }}
                />
              </div>
            </div>

            {/* Heat Index Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 rounded-xl text-orange-600">
                  <Activity size={24} />
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                  <Zap size={14} />
                  Feels Like
                </div>
              </div>
              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-500 mb-2">HEAT INDEX</p>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-slate-900">{data.heat_index}</span>
                  <span className="text-lg text-slate-400 ml-1">°C</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div 
                  className="h-3 bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min((parseFloat(data.heat_index) / 50) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Risk Level Card */}
            <div className={`rounded-2xl border p-6 shadow-sm hover:shadow-lg transition-all duration-300 ${
              riskTheme.isCritical 
                ? 'bg-red-50 border-red-200' 
                : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl text-white ${riskTheme.bg}`}>
                  <AlertTriangle size={24} />
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  riskTheme.isCritical 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {riskTheme.isCritical ? 'ALERT' : 'NORMAL'}
                </div>
              </div>
              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-500 mb-2">RISK LEVEL</p>
                <div className="flex items-baseline">
                  <span className={`text-2xl font-bold ${riskTheme.text}`}>{data.risk_level}</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-700 ${
                    riskTheme.color === 'emerald' ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
                    riskTheme.color === 'amber' ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
                    riskTheme.color === 'orange' ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                    riskTheme.color === 'red' ? 'bg-gradient-to-r from-red-400 to-red-600' :
                    'bg-gradient-to-r from-rose-400 to-rose-600'
                  }`}
                  style={{ width: `${
                    data.risk_level === 'Normal' ? 25 :
                    data.risk_level === 'Caution' ? 50 :
                    data.risk_level === 'Extreme Caution' ? 75 :
                    data.risk_level === 'Danger' ? 90 :
                    100
                  }%` }}
                />
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="mt-8 flex items-center justify-between bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${riskTheme.isCritical ? 'bg-red-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
              <span className="font-medium text-slate-700">Live Pulse Monitoring Active</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500">
            
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>Last updated: {lastUpdate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}