"use client";

import React, { useEffect, useState } from 'react';
import { RefreshCw, AlertTriangle, ThermometerSun, Droplets, Clock } from 'lucide-react';

interface HeatAlertData {
  hasDanger: boolean;
  warning: string;
  period: string;
  generatedAt: string;
  dangerCount: number;
  error?: string;
}

const HeatAlert: React.FC = () => {
  const [data, setData] = useState<HeatAlertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHeatWarning = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:5000/api/heat-warning');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: HeatAlertData = await res.json();
      setData(json);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to load heat alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeatWarning();
    const interval = setInterval(fetchHeatWarning, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Split multi-day warnings
  const dayWarnings = data?.warning
    ?.split('──────────────────────────────')
    ?.map((msg) => msg.trim())
    ?.filter((msg) => msg.length > 0) || [];

  // Heat Index Classification data (from NOAA)
  const classification = [
    { range: "80°F - 90°F (27–32°C)", effect: "Fatigue possible with prolonged exposure and/or physical activity", level: "Caution", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
    { range: "90°F - 103°F (32–39°C)", effect: "Heat stroke, heat cramps, or heat exhaustion possible with prolonged exposure and/or physical activity", level: "Extreme Caution", color: "bg-orange-100 text-orange-800 border-orange-300" },
    { range: "103°F - 124°F (39–51°C)", effect: "Heat cramps or heat exhaustion likely, and heat stroke possible with prolonged exposure and/or physical activity", level: "Danger", color: "bg-red-100 text-red-800 border-red-300" },
    { range: "125°F or higher (52°C+)", effect: "Heat stroke highly likely", level: "Extreme Danger", color: "bg-red-200 text-red-900 border-red-400 font-bold" },
  ];

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center">
        <AlertTriangle className="inline-block mr-2 h-6 w-6" />
        Error: {error}
      </div>
    );
  }

  if (!data?.hasDanger) {
    return (
      <div className="p-8 bg-linear-to-br from-green-50 to-green-100 rounded-2xl shadow-lg text-center">
        <h2 className="text-2xl font-bold text-green-800 mb-3">All Clear – No Heat Danger</h2>
        <p className="text-green-700">No "Danger" level heat risk predicted in the next 15 days.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
      {/* Main Header */}
      <div className="bg-linear-to-r from-red-600 via-red-700 to-red-800 text-white rounded-2xl shadow-2xl p-6 md:p-8 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="h-8 w-8" />
              <h1 className="text-2xl md:text-3xl font-bold">URGENT HEAT DANGER ALERT</h1>
            </div>
            <p className="text-lg md:text-xl opacity-95">
              {data.dangerCount} dangerous day{data.dangerCount !== 1 ? 's' : ''} detected
            </p>
            <p className="text-sm md:text-base mt-1 opacity-90">{data.period}</p>
          </div>

          <button
            onClick={fetchHeatWarning}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-3 bg-white text-red-700 rounded-xl font-medium hover:bg-gray-100 disabled:opacity-60 transition shadow-md"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh Now'}
          </button>
        </div>

        {lastUpdated && (
          <div className="flex items-center gap-2 mt-4 text-sm opacity-90">
            <Clock className="h-4 w-4" />
            Last updated: {lastUpdated.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
          </div>
        )}
      </div>

      {/* Heat Index Classification Table */}
      <div className="mb-10 bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
        <div className="bg-linear-to-r from-amber-500 to-orange-600 text-white p-5">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ThermometerSun className="h-6 w-6" />
            Heat Index Risk Levels (NOAA / National Weather Service)
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {classification.map((item, idx) => (
            <div key={idx} className={`p-5 ${item.color} border-l-4 ${item.color.replace('bg-', 'border-').replace('100', '500').replace('200', '700')}`}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="font-bold text-lg">{item.level}</div>
                  <div className="text-sm font-medium">{item.range}</div>
                </div>
                <div className="text-sm md:text-base">{item.effect}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 text-xs text-center text-gray-600 bg-gray-50">
          Source: <a href="https://www.weather.gov/ama/heatindex" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            NOAA National Weather Service
          </a>
        </div>
      </div>

      {/* Day-by-Day Alerts */}
      <div className="space-y-5">
        {dayWarnings.map((warning, index) => {
          const lines = warning.split('\n');
          const title = lines[0] || `Alert ${index + 1}`;
          const content = lines.slice(1).join('\n').trim();

          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md border border-red-100 overflow-hidden transition-all hover:shadow-lg"
            >
              <details open={index < 3}>
                <summary className="flex justify-between items-center p-5 cursor-pointer bg-red-50 hover:bg-red-100 transition">
                  <h3 className="text-lg font-semibold text-red-800 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    {title}
                  </h3>
                  <span className="text-red-600 transition-transform group-open:rotate-180">▼</span>
                </summary>
                <div className="p-6 text-gray-800 whitespace-pre-wrap leading-relaxed border-t">
                  {content}
                </div>
              </details>
            </div>
          );
        })}
      </div>

      {/* Footer reminder */}
      <div className="mt-10 p-6 bg-linear-to-r from-blue-50 to-cyan-50 rounded-2xl text-center border border-blue-100">
        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-700 font-medium">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-600" /> Stay hydrated every 15–20 min
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" /> Avoid sun 10:00 AM – 4:00 PM
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" /> Check on children & elderly
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatAlert;