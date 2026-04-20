"use client";

import React, { useEffect, useState } from 'react';
import { 
  RefreshCw, AlertTriangle, ThermometerSun, Droplets, 
  Clock, Wind, Sun, Info, ShieldAlert, WifiOff,
  Activity, ShieldCheck, HeartPulse, AlertCircle
} from 'lucide-react';

interface HeatAlertData {
  hasDanger: boolean;
  warning: string;
  period: string;
  generatedAt: string;
  dangerCount: number;
}

const detailedClassification = [
  { 
    level: "Caution", 
    range: "27°C - 32°C",
    effects: "Fatigue possible with prolonged exposure and/or physical activity.",
    mitigation: [
      "Drink water frequently (250ml every 20 mins)",
      "Wear lightweight, light-colored clothing",
      "Take regular rest breaks in shaded areas"
    ],
    icon: <Activity className="h-5 w-5 text-yellow-700" />, 
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    accent: "bg-yellow-400",
    text: "text-yellow-900"
  },
  { 
    level: "Extreme Caution", 
    range: "32°C - 39°C",
    effects: "Heat stroke, heat cramps, or heat exhaustion possible with prolonged exposure and/or physical activity.",
    mitigation: [
      "Use electrolyte-replacement drinks",
      "Limit strenuous activities to early morning",
      "Monitor vulnerable peers, children, and elderly"
    ],
    icon: <ShieldCheck className="h-5 w-5 text-amber-700" />, 
    bg: "bg-amber-50",
    border: "border-amber-200",
    accent: "bg-amber-500",
    text: "text-amber-900"
  },
  { 
    level: "Danger", 
    range: "39°C - 51°C",
    effects: "Heat cramps or heat exhaustion likely, and heat stroke possible with prolonged exposure and/or physical activity.",
    mitigation: [
      "Strict work/rest cycles (15 min rest per 45 min work)",
      "Stay in air-conditioned environments if possible",
      "Wet skin with cool water or use damp cloths"
    ],
    icon: <HeartPulse className="h-5 w-5 text-orange-700" />, 
    bg: "bg-orange-50",
    border: "border-orange-200",
    accent: "bg-orange-600",
    text: "text-orange-900"
  },
  { 
    level: "Extreme Danger", 
    range: "52°C or Higher",
    effects: "Heat stroke highly likely. High risk of severe organ damage or failure.",
    mitigation: [
      "Cease all outdoor activity immediately",
      "Call emergency services if symptoms appear",
      "Evacuate to designated cooling centers"
    ],
    icon: <AlertCircle className="h-5 w-5 text-rose-700" />, 
    bg: "bg-rose-50",
    border: "border-rose-300",
    accent: "bg-rose-700",
    text: "text-rose-950"
  },
];

const HeatAlert: React.FC = () => {
  const [data, setData] = useState<HeatAlertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHeatWarning = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('http://localhost:5000/api/heat-warning');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: HeatAlertData = await res.json();
      setData(json);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to fetch live data:", err);
      setError(true);
      setData(null); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeatWarning();
    const interval = setInterval(fetchHeatWarning, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const dayWarnings = data?.warning
    ?.split('──────────────────────────────')
    ?.map((msg) => msg.trim())
    ?.filter((msg) => msg.length > 0) || [];

  const hasDanger = data?.hasDanger || false;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* TOP SECTION: Live Status Dashboard */}
        <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Main Status Card */}
          <div className={`lg:col-span-3 rounded-3xl shadow-lg overflow-hidden relative transition-colors duration-500 ${
            error ? 'bg-gradient-to-br from-slate-600 to-slate-800' :
            hasDanger ? 'bg-gradient-to-br from-red-500 via-red-600 to-orange-600' : 
            'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500'
          }`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
            <div className="relative p-8 flex flex-col h-full justify-between">
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
                  {error ? <WifiOff className="h-7 w-7 text-white" /> : 
                   hasDanger ? <AlertTriangle className="h-7 w-7 text-white" /> : 
                   <Sun className="h-7 w-7 text-white" />}
                </div>
                <button
                  onClick={fetchHeatWarning}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-xl font-medium transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Syncing...' : 'Refresh'}
                </button>
              </div>
              
              <div>
                {error ? (
                  <>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Live Data Unavailable</h1>
                    <p className="text-white/90 text-lg mb-4">Cannot connect to the weather server. Displaying standard heat safety guidelines below.</p>
                  </>
                ) : hasDanger ? (
                  <>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Heat Danger Alert</h1>
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className="text-6xl font-bold text-white">{data?.dangerCount}</span>
                      <span className="text-xl text-white/90">dangerous day{data?.dangerCount !== 1 ? 's' : ''} ahead</span>
                    </div>
                    <p className="text-white/90 text-lg">{data?.period}</p>
                  </>
                ) : (
                  <>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Safe Conditions</h1>
                    <p className="text-white/90 text-lg mb-2">
                      {data?.period || 'Next 15 days - No extreme heat danger detected in forecast.'}
                    </p>
                  </>
                )}
                
                {lastUpdated && !error && (
                  <div className="flex items-center gap-2 text-white/70 text-sm mt-6">
                    <Clock className="h-4 w-4" />
                    Last synced: {lastUpdated.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Safety Tips Widget */}
          <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6 flex flex-col justify-center">
            <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-blue-500" /> Quick Actions
            </h3>
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Droplets className="h-5 w-5" /></div>
                <div>
                  <p className="font-semibold text-slate-800">Hydrate Often</p>
                  <p className="text-sm text-slate-500">Every 15-20 minutes</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-50 rounded-xl text-orange-600"><Sun className="h-5 w-5" /></div>
                <div>
                  <p className="font-semibold text-slate-800">Avoid Peak Sun</p>
                  <p className="text-sm text-slate-500">Between 10 AM - 4 PM</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-teal-50 rounded-xl text-teal-600"><Wind className="h-5 w-5" /></div>
                <div>
                  <p className="font-semibold text-slate-800">Cool Spaces</p>
                  <p className="text-sm text-slate-500">Seek AC or shade</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MIDDLE SECTION: Live Warnings */}
        {!error && hasDanger && dayWarnings.length > 0 && (
          <section className="bg-white rounded-3xl shadow-lg border border-red-100 p-6 lg:p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-500" /> Specific Day Alerts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dayWarnings.map((warning, index) => {
                const lines = warning.split('\n');
                const title = lines[0] || `Alert ${index + 1}`;
                const content = lines.slice(1).join('\n').trim();

                return (
                  <div key={index} className="bg-red-50/50 border border-red-100 rounded-2xl overflow-hidden">
                    <details open={index === 0} className="group">
                      <summary className="flex justify-between items-center p-5 cursor-pointer hover:bg-red-50 transition-colors">
                        <span className="font-bold text-red-900">{title}</span>
                        <span className="text-red-500 transform group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <div className="p-5 pt-0 text-sm text-red-800 whitespace-pre-wrap leading-relaxed border-t border-red-100/50 mt-2">
                        {content}
                      </div>
                    </details>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* REDESIGNED BOTTOM SECTION: Guidelines */}
        <section className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
          <div className="bg-slate-900 p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <ThermometerSun className="h-7 w-7 text-orange-400" /> 
                <span className="tracking-tight uppercase">Heat Index Protocol</span>
              </h2>
               <p className="text-slate-400 text-sm font-medium text-xl"> what the temperature feels like to the human body when relative humidity is combined with the air temperature.</p>
              <p className="text-slate-400 text-sm font-medium text-xl">Standardized safety thresholds for physiological heat stress.</p>
            </div>
            <a 
              href="https://www.weather.gov/ama/heatindex" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-xs font-bold bg-slate-800 px-5 py-2.5 rounded-xl transition-all border border-slate-700"
            >
              <Info className="h-4 w-4" /> 
              NOAA / NWS SOURCE
            </a>
          </div>
          
          <div className="p-6 lg:p-10">
            <div className="flex flex-col gap-6">
              {detailedClassification.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`group relative flex flex-col lg:flex-row rounded-2xl border-2 ${item.border} ${item.bg} transition-all duration-300 hover:shadow-lg`}
                >
                  {/* Vertical Level Indicator (Visual Reference to Image) */}
                  <div className={`w-full lg:w-4 min-h-[10px] lg:min-h-full ${item.accent} rounded-t-xl lg:rounded-l-xl lg:rounded-tr-none`} />

                  <div className="grid grid-cols-1 lg:grid-cols-12 w-full">
                    
                    {/* Classification Column */}
                    <div className="lg:col-span-3 p-6 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-black/5">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white rounded-lg shadow-sm">{item.icon}</div>
                        <h3 className={`font-black text-xl uppercase tracking-tighter ${item.text}`}>{item.level}</h3>
                      </div>
                      <div className="inline-flex items-center px-3 py-1 bg-white/50 rounded-lg border border-black/5 w-fit">
                        <span className={`text-lg font-black tracking-tight ${item.text}`}>{item.range}</span>
                      </div>
                    </div>

                    {/* Effect Column */}
                    <div className="lg:col-span-4 p-6 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-black/5">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Physiological Effect</h4>
                      <p className="text-sm font-bold text-slate-800 leading-relaxed italic">
                        "{item.effects}"
                      </p>
                    </div>

                    {/* Mitigation Column */}
                    <div className="lg:col-span-5 p-6 flex flex-col justify-center bg-white/30">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Mitigation Strategy</h4>
                      <ul className="space-y-2">
                        {item.mitigation.map((step, i) => (
                          <li key={i} className="flex items-start gap-2 text-[13px] font-semibold text-slate-700">
                            <div className={`mt-1.5 h-1.5 w-1.5 rounded-full ${item.accent} shrink-0`} />
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* UX Enhancement: Footer Tip */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                <ShieldAlert size={20} />
              </div>
              <p className="text-xs font-bold text-blue-800 leading-relaxed">
                PRO TIP: The Heat Index indicates how hot it feels when relative humidity is factored in with the actual air temperature. Note that exposure to full sunshine can increase heat index values by up to 8°C.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default HeatAlert;