"use client";

import React, { useEffect, useState } from "react";
import Navbar from "../NavBar/Navbar";

interface WaterLevel {
  id: number;
  device_id: string;
  water_level_mm: number;
  recorded_at: string;
}

export default function SafetyNew() {
  const [waterLevels, setWaterLevels] = useState<WaterLevel[]>([]);
  const [latestLevel, setLatestLevel] = useState<WaterLevel | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  // Fetch water level history
  const fetchWaterLevels = () => {
    fetch("http://localhost:5000/api/water-level")
      .then((res) => res.json())
      .then((data) => {
        setWaterLevels(data);
        if (data.length > 0) setLatestLevel(data[0]);
      })
      .catch((err) => console.error("Error fetching water levels:", err));
  };

  useEffect(() => {
    fetchWaterLevels();
  }, []);

  // WebSocket live updates
  useEffect(() => {
    let ws: WebSocket;

    const connect = () => {
      ws = new WebSocket("ws://localhost:5000");
      ws.onopen  = () => setWsConnected(true);
      ws.onclose = () => { setWsConnected(false); setTimeout(connect, 3000); };
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === "WATER_LEVEL") {
          fetchWaterLevels();
        }
      };
    };

    connect();
    return () => ws?.close();
  }, []);

  // Get status color based on water level
  const getLevelStatus = (mm: number) => {
    if (mm < 100)  return { label: "Normal",  color: "text-green-600",  bg: "bg-green-100" };
    if (mm < 200)  return { label: "Alert",   color: "text-orange-600", bg: "bg-orange-100" };
    if (mm < 300)  return { label: "Danger",  color: "text-red-600",    bg: "bg-red-100" };
    return               { label: "Critical", color: "text-red-800",    bg: "bg-red-200" };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-10 flex items-center">
          <div className="bg-red-100 p-3 rounded-full mr-4">
            <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-red-800">
              Emergency Preparedness
            </h1>
            <p className="text-red-700 mt-1">
              Stay safe during flood situations
            </p>
          </div>
        </div>

        {/* ── NEW — Live Water Level Section ── */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Live Water Level Monitor
            </h2>
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${
              wsConnected
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}>
              {wsConnected ? "● Live" : "● Connecting..."}
            </span>
          </div>

          {/* Current Level Card */}
          {latestLevel && (() => {
            const status = getLevelStatus(latestLevel.water_level_mm);
            return (
              <div className={`rounded-xl p-6 mb-6 ${status.bg} border`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Current Water Level</p>
                    <p className={`text-5xl font-bold ${status.color}`}>
                      {latestLevel.water_level_mm.toFixed(1)} mm
                    </p>
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${status.bg} ${status.color} border`}>
                      {status.label}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                    <p className="font-semibold text-gray-700">
                      {new Date(latestLevel.recorded_at).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </p>
                    <p className="font-semibold text-gray-700">
                      {new Date(latestLevel.recorded_at).toLocaleTimeString('en-GB', {
                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Water Level History Table */}
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Water Level History
              </h3>
              <span className="text-sm text-gray-500">
                {waterLevels.length} readings recorded
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200">
                <thead className="bg-blue-700 text-white">
                  <tr>
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Device</th>
                    <th className="px-4 py-2 text-left">Water Level</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {waterLevels.map((level, index) => {
                    const status = getLevelStatus(level.water_level_mm);
                    return (
                      <tr key={level.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-500">{index + 1}</td>
                        <td className="px-4 py-2 text-black">{level.device_id}</td>
                        <td className="px-4 py-2 font-semibold text-black">
                          {level.water_level_mm.toFixed(1)} mm
                        </td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-sm font-semibold ${status.bg} ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-black">
                          {new Date(level.recorded_at).toLocaleDateString('en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                        </td>
                        <td className="px-4 py-2 text-black">
                          {new Date(level.recorded_at).toLocaleTimeString('en-GB', {
                            hour: '2-digit', minute: '2-digit', second: '2-digit'
                          })}
                        </td>
                      </tr>
                    );
                  })}
                  {waterLevels.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-gray-500">
                        No water level readings yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* ─────────────────────────────────── */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white border rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-6">
                Flood Safety Guidelines
              </h2>

              {/* Medium Risk */}
              <div className="border-l-4 border-orange-500 bg-orange-50 rounded-lg p-5 mb-6">
                <h3 className="text-orange-600 font-semibold mb-3">
                  Alert – Stay Alert
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Monitor weather updates regularly</li>
                  <li>• Prepare an emergency kit</li>
                  <li>• Review evacuation plans</li>
                </ul>
              </div>

              {/* High Risk */}
              <div className="border-l-4 border-red-500 bg-red-50 rounded-lg p-5 mb-6">
                <h3 className="text-red-600 font-semibold mb-3">
                  Minor Flood – Take Action
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Move to higher ground immediately</li>
                  <li>• Secure loose outdoor items</li>
                  <li>• Charge all electronic devices</li>
                </ul>
              </div>

              {/* Critical Risk */}
              <div className="border-l-4 border-red-800 bg-red-100 rounded-lg p-5 mb-8">
                <h3 className="text-red-800 font-semibold mb-3">
                  Major Flood – Evacuate Now
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Evacuate immediately if ordered</li>
                  <li>• Do NOT drive through flood water</li>
                  <li>• Contact emergency services if trapped</li>
                </ul>
              </div>

              {/* Emergency Kit */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-yellow-800 mb-4">
                  Emergency Kit Essentials
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <ul className="space-y-1">
                    <li>✔ Water (3+ days)</li>
                    <li>✔ Non-perishable food</li>
                    <li>✔ First aid kit</li>
                    <li>✔ Flashlight & batteries</li>
                  </ul>
                  <ul className="space-y-1">
                    <li>✔ ID documents</li>
                    <li>✔ Insurance papers</li>
                    <li>✔ Medical records</li>
                    <li>✔ Cash & cards</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Emergency Contacts */}
            <div className="bg-white border rounded-lg p-6 shadow-sm mb-6">
              <h3 className="text-xl font-bold mb-4 text-red-700">
                Emergency Contacts
              </h3>
              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="font-semibold">Emergency</div>
                  <div className="text-xl font-bold text-red-600">117 / 118</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="font-semibold">Disaster Management</div>
                  <div className="text-blue-700">+94 11 267 1096</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="font-semibold">Flood Support</div>
                  <div className="text-green-700">+94 11 243 6136</div>
                </div>
              </div>
            </div>

            {/* Safety Tips */}
            <div className="bg-blue-50 border rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-bold text-blue-900 mb-4">
                Safety Tips
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• 6 inches of water can knock you down</li>
                <li>• 12 inches can carry vehicles</li>
                <li>• Never touch wet electrical equipment</li>
                <li>• Avoid downed power lines</li>
                <li>• Follow evacuation orders immediately</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}