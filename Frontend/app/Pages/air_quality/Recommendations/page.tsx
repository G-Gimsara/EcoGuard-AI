"use client";

import React, { useEffect, useState } from "react";
import Navbar from "../NavBar/Navbar";
import { Wind, Flame, Thermometer, Droplets } from "lucide-react";
import Header from "@/app/Header/page";

interface AirReading {
  id: number;
  device_id: string;
  dust?: number;
  gas_ppm?: number;
  temperature?: number;
  humidity?: number;
  createdAt: string;
}

// ---------------- FULL RECOMMENDATION LISTS ----------------
const dustRecommendations: Record<string, string[]> = {
  Low: [
    "Air quality is good",
    "Outdoor activities are safe",
    "No mask required",
    "Safe for children and elderly",
    "Walking near roads is generally safe",
    "Public transport users can travel normally",
  ],
  Medium: [
    "Sensitive groups should reduce outdoor activity",
    "People with asthma should be careful",
    "Avoid long outdoor exercise near busy roads",
    "Consider wearing a mask near traffic",
    "Use shaded sidewalks when walking",
    "wear face mask",
    "Public transport users should avoid crowded polluted stops",
  ],
  High: [
    "Avoid outdoor activities near busy roads",
    "Wear a protective mask (N95 recommended)",
    "Keep windows closed near highways",
    "Avoid walking near heavy traffic",
    "School children should limit outdoor sports",
    "Use public transport instead of walking long distances",
  ],
};

const gasRecommendations: Record<string, string[]> = {
  Low: [
    "Gas levels are safe",
    "Normal daily activities are safe",
    "No health risk detected",
    "Roadside travel is safe",
    "Drivers and passengers can travel normally",
  ],
  Medium: [
    "Stay cautious near traffic congestion",
    "Avoid staying long at bus stops with heavy traffic",
    "Ensure good ventilation in vehicles",
    "Motorbike riders should wear masks",
    "Avoid idling vehicles for long periods",
  ],
  High: [
    "Move away from polluted traffic areas",
    "Avoid breathing vehicle exhaust fumes",
    "Pedestrians should avoid busy intersections",
    "Public transport users should move to less crowded stops",
    "Drivers should close windows in heavy traffic",
    "Children and elderly should avoid roadside exposure",
  ],
};

const temperatureRecommendations: Record<string, string[]> = {
  Normal: [
    "Comfortable temperature",
    "Safe for outdoor activities",
    "Safe for walking and cycling",
    "Drivers should stay hydrated",
  ],
  Moderate: [
    "Weather is warm",
    "Drink water regularly",
    "Use hats or umbrellas when walking",
    "Public transport users should stay hydrated",
  ],
  High: [
    "Drink plenty of water",
    "Wear light clothing",
    "Avoid long sun exposure near roads",
    "Motorbike riders should take breaks",
    "Use shade at bus stops",
  ],
  "Very High": [
    "Stay indoors if possible",
    "Drink water frequently",
    "Avoid outdoor activity during midday",
    "Construction workers should take frequent breaks",
    "Children and elderly should stay in cool places",
  ],
};

// ---------------- DASHBOARD COMPONENT ----------------
export default function Dashboard() {
  const [latestDust, setLatestDust] = useState<AirReading | null>(null);
  const [latestGas, setLatestGas] = useState<AirReading | null>(null);
  const [latestTempHum, setLatestTempHum] = useState<AirReading | null>(null);

  // ----------- INITIAL DATA FETCH -----------
  useEffect(() => {
    fetch("http://localhost:5000/api/dust")
      .then((res) => res.json())
      .then((data: AirReading[]) => setLatestDust(data[0]));

    fetch("http://localhost:5000/api/gas")
      .then((res) => res.json())
      .then((data: AirReading[]) => setLatestGas(data[0]));

    fetch("http://localhost:5000/api/temp_hum")
      .then((res) => res.json())
      .then((data: AirReading[]) => setLatestTempHum(data[0]));
  }, []);

  // ----------- WEBSOCKET LIVE UPDATES -----------
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:5000");

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "DUST_UPDATE") setLatestDust(message.data);
      if (message.type === "GAS_UPDATE") setLatestGas(message.data);
      if (message.type === "TEMP_UPDATE") setLatestTempHum(message.data);
    };

    return () => ws.close();
  }, []);

  // ----------- STATUS FUNCTIONS -----------
  const getDustStatus = (dust?: number) => {
    if (!dust) return "Low";
    if (dust > 150) return "High";
    if (dust > 75) return "Medium";
    return "Low";
  };

  const getGasStatus = (gas?: number) => {
    if (!gas) return "Low";
    if (gas > 300) return "High";
    if (gas > 150) return "Medium";
    return "Low";
  };

  const getTempStatus = (temp?: number) => {
    if (!temp) return "Normal";
    if (temp > 40) return "Very High";
    if (temp > 35) return "High";
    if (temp > 30) return "Moderate";
    return "Normal";
  };

  // ----------- HEALTH ADVICE USING FULL LISTS -----------
  const getHealthAdvice = () => {
    const advice: {
      title: string;
      recommendation: string[];
      message: string;
      status: string;
    }[] = [];

    // Dust
    const dustStatus = getDustStatus(latestDust?.dust);
    advice.push({
      title: "Dust (PM2.5)",
      status: dustStatus,
      recommendation: dustRecommendations[dustStatus] || ["Data unavailable"],
      message: `Current PM2.5: ${latestDust?.dust} µg/m³`,
    });

    // Gas
    const gasStatus = getGasStatus(latestGas?.gas_ppm);
    advice.push({
      title: "Gas Level",
      status: gasStatus,
      recommendation: gasRecommendations[gasStatus] || ["Data unavailable"],
      message: `Current Gas: ${latestGas?.gas_ppm} ppm`,
    });

    // Temperature
    const tempStatus = getTempStatus(latestTempHum?.temperature);
    advice.push({
      title: "Temperature",
      status: tempStatus,
      recommendation: temperatureRecommendations[tempStatus] || ["Data unavailable"],
      message: `Current Temperature: ${latestTempHum?.temperature}°C`,
    });

    // Humidity (optional, simple advice)
    advice.push({
      title: "Humidity",
      status: "Normal",
      recommendation: ["Maintain comfortable indoor ventilation"],
      message: `Current Humidity: ${latestTempHum?.humidity}%`,
    });

    return advice;
  };

  return (
    <div className="min-h-screen bg-gray-50">
       <Header />
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Recommendation
          </h1>
          <p className="text-sm text-gray-500">Personalized tips to stay healthy based on current conditions.</p>
        </div>

        {/* SENSOR CARDS */}
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <SensorCard
            icon={<Wind className="text-blue-500 w-7 h-7" />}
            title="Dust Sensor"
            subtitle="PM2.5 Levels"
            value={latestDust?.dust}
            status={getDustStatus(latestDust?.dust)}
            unit="µg/m³"
          />
          <SensorCard
            icon={<Flame className="text-red-500 w-7 h-7" />}
            title="Gas Sensor"
            subtitle="Gas Concentration"
            value={latestGas?.gas_ppm}
            status={getGasStatus(latestGas?.gas_ppm)}
            unit="ppm"
          />
          <SensorCard
            icon={<Thermometer className="text-orange-500 w-7 h-7" />}
            title="Temperature"
            subtitle="Room Temperature"
            value={latestTempHum?.temperature}
            status={getTempStatus(latestTempHum?.temperature)}
            unit="°C"
          />
          <SensorCard
            icon={<Droplets className="text-cyan-500 w-7 h-7" />}
            title="Humidity"
            subtitle="Relative Humidity"
            value={latestTempHum?.humidity}
            unit="%"
          />
        </div>

         <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Public health Tips
          </h1>
          <p className="text-sm text-gray-500"> Stay hydrated and follow safe practices to maintain your health.</p>
        </div>

        {/* HEALTH TIPS */}
        <div className="space-y-4">
          {getHealthAdvice().map((item, i) => (
            <div
              key={i}
              className={`p-4 border-l-4 rounded ${adviceColor(
                item.status
              )} shadow-sm`}
            >
              <h3 className="text-lg font-semibold text-gray-800">{item.title}</h3>
              <ul className="list-disc list-inside text-gray-700">
                {item.recommendation.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
              <p className="mt-2 font-medium text-gray-900">{item.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------- SENSOR CARD ----------------
const SensorCard = ({ icon, title, subtitle, value, status, unit }: any) => {
  return (
    <div
      className={`rounded-xl shadow-lg p-5 border hover:shadow-xl transition flex flex-col justify-between ${cardBgColor(
        status
      )}`}
    >
      <div className="flex justify-between items-center mb-2">
        {icon}
        {status && (
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor(
              status
            )}`}
          >
            {status}
          </span>
        )}
      </div>
      <p className="text-gray-500 text-sm">{subtitle}</p>
      <p className="text-gray-800 font-semibold text-lg">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">
        {value ?? "--"}
        {unit}
      </p>
    </div>
  );
};

// ---------------- STATUS COLORS ----------------
const statusColor = (status?: string) => {
  if (status === "High" || status === "Very High") return "bg-red-100 text-red-700";
  if (status === "Medium" || status === "Moderate") return "bg-yellow-100 text-yellow-700";
  return "bg-green-100 text-green-700";
};

// ---------------- CARD BACKGROUND ----------------
const cardBgColor = (status?: string) => {
  if (status === "High" || status === "Very High") return "bg-red-50 border-red-300";
  if (status === "Medium" || status === "Moderate") return "bg-yellow-50 border-yellow-300";
  if (status === "Low" || status === "Normal") return "bg-green-50 border-green-300";
  return "bg-gray-50 border-gray-200";
};

// ---------------- HEALTH TIPS COLOR ----------------
const adviceColor = (status?: string) => {
  if (status === "High" || status === "Very High") return "bg-red-50 border-red-400";
  if (status === "Medium" || status === "Moderate") return "bg-yellow-50 border-yellow-400";
  return "bg-green-50 border-green-400";
};