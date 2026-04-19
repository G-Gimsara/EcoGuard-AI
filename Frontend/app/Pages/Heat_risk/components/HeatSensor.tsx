"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { Thermometer, Droplets, Activity, TrendingUp, Clock, MapPin, AlertTriangle, Volume2, VolumeX, ShieldAlert } from "lucide-react";

// --- Types & Constants ---
interface SensorData {
  id: number;
  device_id: string;
  temperature: string;
  humidity: string;
  heat_index: string;
  risk_level: string;
}

const locations: Record<string, { lat: number; lon: number }> = {
  kaduwela: { lat: 6.936, lon: 79.984 },
  homagama: { lat: 6.845, lon: 80.015 },
  kolonnawa: { lat: 6.933, lon: 79.885 },
  colombo: { lat: 6.932, lon: 79.846 },
  moratuwa: { lat: 6.779, lon: 79.883 },
  padukka: { lat: 6.841, lon: 80.093 },
  dehiwala: { lat: 6.851, lon: 79.866 },
  kesbawa: { lat: 6.779, lon: 79.947 },
  rathmalana: { lat: 6.819, lon: 79.881 },
  seethawaka: { lat: 6.954, lon: 80.205 },
  thimbirigasyaya: { lat: 6.896, lon: 79.867 },
  maharagama: { lat: 6.848, lon: 79.927 },
  jayawardanapura: { lat: 6.885, lon: 79.904 },
};

function calculateHeatIndex(tempC: number, humidity: number) {
  const tempF = (tempC * 9) / 5 + 32;
  let hiF = -42.379 + 2.04901523 * tempF + 10.14333127 * humidity - 0.22475541 * tempF * humidity - 0.00683783 * tempF * tempF - 0.05481717 * humidity * humidity + 0.00122874 * tempF * tempF * humidity + 0.00085282 * tempF * humidity * humidity - 0.00000199 * tempF * tempF * humidity * humidity;
  if (humidity < 13 && tempF >= 80 && tempF <= 112) hiF -= ((13 - humidity) / 4) * Math.sqrt((17 - Math.abs(tempF - 95)) / 17);
  else if (humidity > 85 && tempF >= 80 && tempF <= 87) hiF += ((humidity - 85) / 10) * ((87 - tempF) / 5);
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
    return () => { audioRef.current?.pause(); audioRef.current = null; };
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
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m&timezone=auto`);
        const json = await res.json();
        const { temperature_2m: temp, relative_humidity_2m: hum } = json.current;
        const { hiC, hiF } = calculateHeatIndex(temp, hum);
        let risk = hiF >= 103 ? "Danger" : hiF >= 90 ? "Extreme Caution" : hiF >= 80 ? "Caution" : "Normal";
        sData = { id: 0, device_id: selectedLocation, temperature: temp.toFixed(1), humidity: hum.toFixed(0), heat_index: hiC, risk_level: risk };
      }
      setData(sData);
      setLastUpdate(new Date());
    } catch (e) { console.error(e); }
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
    const isCritical = level.includes("danger");
    if (level === "normal") return { color: "emerald", bg: "bg-emerald-500", isCritical };
    if (level === "caution") return { color: "yellow", bg: "bg-yellow-500", isCritical };
    if (level === "extreme caution") return { color: "orange", bg: "bg-orange-500", isCritical };
    return { color: "red", bg: "bg-red-600", isCritical: true };
  }, [data?.risk_level]);

  if (!data) return <div className="p-6 text-center text-slate-400 font-bold">Syncing EcoGuard System...</div>;

  return (
    <div className={`relative w-full max-w-[95%] mx-auto transition-all duration-700 rounded-[2rem] p-1 
      ${riskTheme.isCritical ? 'bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.3)]' : 'bg-slate-200 shadow-xl'}`}>
      
      <style jsx global>{`
        @keyframes alert-soft-flash {
          0% { background-color: #ffffff; }
          50% { background-color: #fff5f5; }
          100% { background-color: #ffffff; }
        }
        .animate-alert-soft { animation: alert-soft-flash 1.2s infinite ease-in-out; }
      `}</style>

      <div className={`relative overflow-hidden rounded-[1.9rem] transition-colors duration-500 
        ${riskTheme.isCritical ? 'animate-alert-soft' : 'bg-white'}`}>
        
        {/* Top Slim Navigation Bar */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-lg ${riskTheme.bg} text-white shadow-sm`}>
              <ShieldAlert size={18} />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900 tracking-widest uppercase italic">Realtime Monitoring <span className="text-slate-400 font-normal"></span></h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm">
               <MapPin size={12} className="text-blue-500" />
               <select 
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="bg-transparent font-bold text-slate-600 text-[11px] focus:outline-none cursor-pointer uppercase tracking-tight"
              >
                {Object.keys(locations).map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-full transition-all border ${isMuted ? 'bg-slate-100 text-slate-300' : 'bg-red-50 text-red-500 border-red-100 animate-pulse'}`}
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          </div>
        </div>

        {/* Main Horizontal Content Area */}
        <div className="flex flex-col xl:flex-row items-stretch">
          
          {/* Section 1: Temperature Hero (Left Column) */}
          <div className="xl:w-1/3 p-8 border-b xl:border-b-0 xl:border-r border-slate-100 bg-slate-900 rounded-2xl ml-4 mr-4 text-white relative overflow-hidden flex flex-col justify-center min-h-[220px]">
            <div className="absolute -right-10 -bottom-10 opacity-10 rotate-12"><Thermometer size={200} /></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="h-[2px] w-4 bg-blue-500 rounded-full"></span>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Air Temperature</p>
              </div>
              <div className="flex items-baseline">
                <span className="text-8xl font-black tracking-tighter">{data.temperature}</span>
                <span className="text-2xl font-light text-slate-500 ml-2">°C</span>
              </div>
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-md">
                <TrendingUp size={12} className="text-orange-400" />
                <span className="text-[11px] font-bold">Index: {data.heat_index}°C</span>
              </div>
            </div>
          </div>

          {/* Section 2: Environment Stats (Middle Column) */}
          <div className="xl:w-1/3 p-8 border-b xl:border-b-0 xl:border-r border-slate-100 grid grid-cols-2 gap-6 items-center">
             {/* Humidity Card */}
             <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-500"><Droplets size={16} /></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Humidity</span>
                </div>
                <div>
                  <span className="text-4xl font-black text-slate-800">{data.humidity}%</span>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full transition-all duration-1000" style={{ width: `${data.humidity}%` }} />
                  </div>
                </div>
             </div>

             {/* Heat Index Info */}
             <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-50 rounded-lg text-orange-500"><Activity size={16} /></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Intensity</span>
                </div>
                <div>
                  <span className="text-4xl font-black text-slate-800">{data.heat_index}</span>
                  <span className="text-lg font-bold text-slate-300 ml-1">°C</span>
                  <p className="text-[9px] font-bold text-slate-400 mt-3 uppercase">Calculated Feel</p>
                </div>
             </div>
          </div>

          {/* Section 3: Status & Safety (Right Column) */}
          <div className={`xl:w-1/3 p-8 flex flex-col justify-center space-y-6 transition-colors ${riskTheme.isCritical ? 'bg-red-50/50' : 'bg-slate-50/30'}`}>
             <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Status Analysis</p>
                  <h2 className={`text-3xl font-black tracking-tighter uppercase ${riskTheme.isCritical ? 'text-red-600' : 'text-slate-800'}`}>
                    {data.risk_level}
                  </h2>
                </div>
                <div className={`p-4 rounded-2xl ${riskTheme.bg} text-white shadow-lg ${riskTheme.isCritical ? 'animate-bounce' : ''}`}>
                  <AlertTriangle size={24} />
                </div>
             </div>

             <div className="flex items-center gap-4">
                <div className="flex-1 h-12 bg-white border border-slate-200 rounded-xl flex items-center px-4 gap-3 shadow-sm">
                  <div className={`w-2 h-2 rounded-full ${riskTheme.isCritical ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
                  <span className="text-[10px] font-black text-slate-500 uppercase">Live Pulse Monitoring</span>
                </div>
                <div className="h-12 w-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
                   <Clock size={16} className="text-slate-300" />
                </div>
             </div>
          </div>
        </div>

        {/* Ultra Slim Footer */}
        <div className="px-8 py-3 bg-white border-t border-slate-100 flex justify-between items-center text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">
          <span>System ID: {data.device_id}</span>
          <div className="flex items-center gap-2">
            <span className="h-1 w-1 bg-slate-200 rounded-full"></span>
            <span>Last Packet Received: {lastUpdate?.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}