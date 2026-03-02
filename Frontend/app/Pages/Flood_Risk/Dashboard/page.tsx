"use client";

import React, { useEffect, useState } from "react";
import Navbar from "../NavBar/Navbar";

interface FloatStatus {
  device_id: string;
  status: string;
  message: string;
  timestamp: string;
}

export default function FloodAlertDashboard() {
  const [floatStatus, setFloatStatus] = useState<FloatStatus>({
    device_id: "esp32-device-2",
    status: "NORMAL",
    message: "Water level is normal",
    timestamp: "",
  });
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    // Fetch last saved status from DB on load
    fetch("http://localhost:5000/api/float/alerts?limit=1")
      .then((res) => res.json())
      .then((data) => {
        if (data.length > 0) {
          setFloatStatus({
            device_id: data[0].device_id,
            status:    data[0].status,
            message:   data[0].message,
            timestamp: data[0].recorded_at,
          });
        }
      })
      .catch((err) => console.error("Error fetching last status:", err));
  }, []);

  // WebSocket live updates
  useEffect(() => {
    let ws: WebSocket;

    const connect = () => {
      ws = new WebSocket("ws://localhost:5000");
      ws.onopen  = () => setWsConnected(true);
      ws.onclose = () => { setWsConnected(false); setTimeout(connect, 3000); };
      ws.onerror = (err) => console.error("WebSocket error:", err);
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === "FLOAT_STATUS") {
          setFloatStatus(msg.data);
        }
      };
    };

    connect();
    return () => ws?.close();
  }, []);

  const isDanger   = floatStatus.status === "DANGER";
  const updateTime = floatStatus.timestamp ? new Date(floatStatus.timestamp) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-800">
            Flood Alert Monitor
          </h1>
          <p className="text-gray-600 mt-2">
            Last recorded water level status.
          </p>
        </div>

        {/* Live Badge */}
        <div className="flex justify-end mb-4">
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${
            wsConnected
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}>
            {wsConnected ? "● Live" : "● Connecting..."}
          </span>
        </div>

        {/* Status Card */}
        <div className={`rounded-2xl p-8 text-white shadow-lg transition-all duration-500 ${
          isDanger ? "bg-red-600" : "bg-green-600"
        }`}>

          {/* Device ID */}
          <p className="text-sm opacity-70 mb-4">
            Device: {floatStatus.device_id}
          </p>

          {/* Icon + Status */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-5xl font-bold mb-2">
                {isDanger ? "DANGER" : "NORMAL"}
              </h2>
              <p className="text-lg opacity-90">
                {floatStatus.message}
              </p>
            </div>
            <div className="text-7xl">
              {isDanger ? "🚨" : "✅"}
            </div>
          </div>

          {/* Date and Time */}
          <div className="bg-white bg-opacity-20 rounded-xl p-4">
            <p className="text-sm opacity-70 mb-3">Last Updated</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs opacity-60 mb-1">Date</p>
                <p className="text-xl font-bold">
                  {updateTime
                    ? updateTime.toLocaleDateString('en-GB', {
                        day:   '2-digit',
                        month: 'short',
                        year:  'numeric',
                      })
                    : "No data yet"}
                </p>
              </div>
              <div>
                <p className="text-xs opacity-60 mb-1">Time</p>
                <p className="text-xl font-bold">
                  {updateTime
                    ? updateTime.toLocaleTimeString('en-GB', {
                        hour:   '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : "No data yet"}
                </p>
              </div>
            </div>
          </div>

          {/* Danger Warning */}
          {isDanger && (
            <div className="mt-4 bg-white bg-opacity-20 rounded-xl p-4 text-center font-semibold">
              ⚠️ Water has reached danger zone! Please check immediately!
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
