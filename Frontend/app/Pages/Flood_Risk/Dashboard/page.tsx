"use client";

import React, { useEffect, useState } from "react";

import { Droplets, AlertTriangle, MapPin, Clock, RefreshCw } from "lucide-react";
import Header from "@/app/Header/page";
import Navbar from "../NavBar/Navbar";
import { levels, type LevelName } from "../Alert/floodLevelConfig";

// Single flood reading shape used by cards + table.
interface FloodMeasurement {
  id: number;
  riseLevel: number;
  severity: string;
  firstAffected: string;
  nextAffected: string;
  floodFeet: number;
  createdAt: string;
}

// Single float sensor status row used across the dashboard.
interface FloatStatus {
  id: number;
  device_id: string;
  status: string;
  message: string;
  recorded_at: string;
}

// Display a readable timestamp, or a dash when invalid.
function formatFloatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

// Reuse the same severity colors everywhere.
const severityColors: Record<string, { bg: string; text: string }> = {
  Normal: { bg: "bg-green-100", text: "text-green-800" },
  Alert: { bg: "bg-yellow-100", text: "text-yellow-800" },
  Minor: { bg: "bg-orange-100", text: "text-orange-800" },
  Moderate: { bg: "bg-blue-100", text: "text-blue-800" },
  Major: { bg: "bg-red-100", text: "text-red-700" },
  Critical: { bg: "bg-red-600", text: "text-white" },
};

export default function Dashboard() {
  // Flood table rows + latest reading for top cards.
  const [measurements, setMeasurements] = useState<FloodMeasurement[]>([]);
  const [latest, setLatest] = useState<FloodMeasurement | null>(null);

  // Float sensor rows + latest status for top cards.
  const [floatStatuses, setFloatStatuses] = useState<FloatStatus[]>([]);
  const [latestFloat, setLatestFloat] = useState<FloatStatus | null>(null);

  // Initial flood snapshot before live updates start.
  const fetchFloodData = () => {
    fetch("http://localhost:5000/api/flood")
      .then((res) => res.json())
      .then((data) => {
        setMeasurements(data);
        if (data.length > 0) setLatest(data[0]);
      })
      .catch(console.error);
  };

  // Initial float sensor snapshot before live updates start.
  const fetchFloatData = () => {
    fetch("http://localhost:5000/api/flood/float")
      .then((res) => res.json())
      .then((data) => {
        setFloatStatuses(data);
        if (data.length > 0) setLatestFloat(data[0]);
      })
      .catch(console.error);
  };

  // Load both datasets once on mount.
  useEffect(() => {
    fetchFloodData();
    fetchFloatData();
  }, []);

  // One socket stream carries both flood and float updates.
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:5000");

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);

      // Keep newest flood entries at the top (limit to 10).
      if (msg.type === "FLOOD_UPDATE") {
        const newMeasurement: FloodMeasurement = msg.data;
        setMeasurements((prev) => [newMeasurement, ...prev].slice(0, 10));
        setLatest(newMeasurement);
      }

      // Some events send `timestamp`; map it to `recorded_at`.
      if (msg.type === "FLOAT_UPDATE") {
        const d = msg.data;
        const newFloat = {
          ...d,
          recorded_at: d.recorded_at ?? d.timestamp ?? "",
        } as FloatStatus;
        setFloatStatuses((prev) => [newFloat, ...prev].slice(0, 10));
        setLatestFloat(newFloat);
      }
    };

    // Clean up socket on unmount.
    return () => ws.close();
  }, []);

  // Prepared for future config-driven UI behavior based on active severity.
  const activeLevel = levels.find((l) => l.name === latest?.severity)?.name as LevelName | undefined;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white font-sans antialiased text-[15px]">
      {/* Shared page shell */}
      <Header />
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Dashboard header */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-blue-900 flex items-center gap-3 tracking-tight">
            <Droplets className="text-blue-600" size={36} />
            Live Flood Monitoring Dashboard
          </h1>
          <p className="mt-2 text-gray-600 text-lg md:text-xl">
            Real-time river level monitoring and flood risk alerts
          </p>
        </div>

        {/* Flood quick stats */}
        {latest && (
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-blue-100 to-blue-200 rounded-2xl shadow-lg transform transition hover:scale-105">
              <Droplets className="text-blue-600" size={28} />
              <div>
                <p className="text-gray-600 text-sm font-medium">Water Rise</p>
                <h2 className="text-2xl font-bold text-blue-900">{latest.riseLevel.toFixed(1)} mm</h2>
              </div>
            </div>

            <div className={`flex items-center gap-4 p-6 rounded-2xl shadow-lg transform transition hover:scale-105 ${severityColors[latest.severity]?.bg}`}>
              <AlertTriangle className={`text-xl ${severityColors[latest.severity]?.text}`} size={28} />
              <div>
                <p className={`text-sm font-medium ${severityColors[latest.severity]?.text}`}>Severity</p>
                <h2 className={`text-2xl font-bold ${severityColors[latest.severity]?.text}`}>{latest.severity}</h2>
              </div>
            </div>

            <div className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-lg transform transition hover:scale-105">
              <MapPin className="text-blue-500" size={28} />
              <div>
                <p className="text-gray-600 text-sm font-medium">First Affected</p>
                <p className="text-gray-800 font-semibold truncate max-w-[180px]">{latest.firstAffected}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-lg transform transition hover:scale-105">
              <RefreshCw className="text-blue-500" size={28} />
              <div>
                <p className="text-gray-600 text-sm font-medium">Last Updated</p>
                <p className="text-gray-800 font-semibold">
                  {new Date(latest.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Float sensor quick stats */}
        {latestFloat && (
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <div className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-lg transform transition hover:scale-105">
              <Droplets className="text-blue-600" size={28} />
              <div>
                <p className="text-gray-600 text-sm font-medium">Float Sensor Status</p>
                <h2 className={`text-2xl font-bold ${latestFloat.status === "DANGER" ? "text-red-600" : "text-green-600"}`}>
                  {latestFloat.status}
                </h2>
                <p className="text-gray-500 text-sm">{latestFloat.message}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-lg transform transition hover:scale-105">
              <MapPin className="text-blue-500" size={28} />
              <div>
                <p className="text-gray-600 text-sm font-medium">Device</p>
                <p className="text-gray-800 font-semibold">{latestFloat.device_id}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-lg transform transition hover:scale-105">
              <Clock className="text-blue-500" size={28} />
              <div>
                <p className="text-gray-600 text-sm font-medium">Recorded At</p>
                <p className="text-gray-800 font-semibold">
                  {formatFloatTime(latestFloat.recorded_at)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Flood measurements table */}
        {latest && (
          <div className="bg-white rounded-3xl shadow-2xl border border-blue-100 p-8 mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Clock size={22} />
              Recent Flood Measurements
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-[13px] font-medium text-gray-900">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-xl">
                    <th className="px-6 py-4 text-left text-[17px] font-semibold uppercase tracking-wider">#</th>
                    <th className="px-6 py-4 text-left text-[17px] font-semibold uppercase tracking-wider">Rise (mm)</th>
                    <th className="px-6 py-4 text-left text-[17px] font-semibold uppercase tracking-wider">Rise (ft)</th>
                    <th className="px-6 py-4 text-left text-[17px] font-semibold uppercase tracking-wider">Severity</th>
                    <th className="px-6 py-4 text-left text-[17px] font-semibold uppercase tracking-wider">First Affected</th>
                    <th className="px-6 py-4 text-left text-[17px] font-semibold uppercase tracking-wider">Next Affected</th>
                    <th className="px-6 py-4 text-left text-[17px] font-semibold uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Rows are already ordered newest-first from fetch/socket updates. */}
                  {measurements.slice(0, 10).map((m, idx) => (
                    <tr key={`${m.id}-${idx}`} className="bg-white hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-[15px]">{idx + 1}</td>
                      <td className="px-6 py-4 text-[15px] font-semibold text-blue-700">{m.riseLevel.toFixed(1)}</td>
                      <td className="px-6 py-4 text-[15px]">{m.floodFeet}</td>
                      <td className="px-6 py-4 text-[15px]">
                        <span className={`px-3 py-1.5 rounded-full text-[12px] font-semibold ${severityColors[m.severity]?.bg || "bg-gray-200"} ${severityColors[m.severity]?.text || "text-gray-800"}`}>
                          {m.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[15px] text-gray-800">{m.firstAffected.length > 20 ? `${m.firstAffected.slice(0, 20)}...` : m.firstAffected}</td>
                      <td className="px-6 py-4 text-[15px] text-gray-800">{m.nextAffected && m.nextAffected.length > 20 ? `${m.nextAffected.slice(0, 20)}...` : m.nextAffected || "-"}</td>
                      <td className="px-6 py-4 text-[15px] text-gray-600">{new Date(m.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                    </tr>
                  ))}
                  {/* First-load / empty-history fallback message. */}
                  {measurements.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-gray-500">No flood measurements yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Float sensor status table */}
        {latestFloat && (
          <div className="bg-white rounded-3xl shadow-2xl border border-blue-100 p-8 mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Clock size={22} />
              Recent Float Sensor Status
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-[13px] font-medium text-gray-900">
                <thead>
                  <tr className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-xl">
                    <th className="px-6 py-4 text-left text-[16px] font-semibold uppercase tracking-wider">#</th>
                    <th className="px-6 py-4 text-left text-[16px] font-semibold uppercase tracking-wider">Device</th>
                    <th className="px-6 py-4 text-left text-[16px] font-semibold uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-[16px] font-semibold uppercase tracking-wider">Message</th>
                    <th className="px-6 py-4 text-left text-[16px] font-semibold uppercase tracking-wider">Recorded At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Mirror flood table behavior for visual consistency. */}
                  {floatStatuses.slice(0, 10).map((f, idx) => (
                    <tr key={`${f.id}-${idx}`} className="bg-white hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-[15px]">{idx + 1}</td>
                      <td className="px-6 py-4 text-[15px]">{f.device_id}</td>
                      <td className={`px-6 py-4 text-[15px] font-semibold ${f.status === "DANGER" ? "text-red-600" : "text-green-600"}`}>{f.status}</td>
                      <td className="px-6 py-4 text-[15px]">{f.message}</td>
                      <td className="px-6 py-4 text-[15px] text-gray-600">{formatFloatTime(f.recorded_at)}</td>
                    </tr>
                  ))}
                  {/* Empty-state when no float sensor events are available yet. */}
                  {floatStatuses.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-gray-500">No float sensor data yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}