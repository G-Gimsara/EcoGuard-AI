"use client";

import React, { useEffect, useState } from "react";
import Header from "@/app/Header/page";
import Navbar from "../NavBar/Navbar";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Wind, Flame, Thermometer, Droplets } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface AirReading {
  id: number;
  device_id: string;
  dust?: number;
  gas_ppm?: number;
  temperature?: number;
  humidity?: number;
  air_status?: string;
  temp_status?: string;
  humidity_status?: string;
  createdAt: string;
}

export default function Dashboard() {
  const [latestDust, setLatestDust] = useState<AirReading | null>(null);
  const [latestGas, setLatestGas] = useState<AirReading | null>(null);
  const [latestTempHum, setLatestTempHum] = useState<AirReading | null>(null);
  const [dustHistory, setDustHistory] = useState<AirReading[]>([]);
  const [gasHistory, setGasHistory] = useState<AirReading[]>([]);
  const [tempHumHistory, setTempHumHistory] = useState<AirReading[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const router = useRouter();

  // Load initial data
  useEffect(() => {
    fetch("http://localhost:5000/api/dust")
      .then((res) => res.json())
      .then((data: AirReading[]) => {
        setLatestDust(data[0]);
        setDustHistory(data.slice(0, 50));
      });

    fetch("http://localhost:5000/api/gas")
      .then((res) => res.json())
      .then((data: AirReading[]) => {
        setLatestGas(data[0]);
        setGasHistory(data.slice(0, 50));
      });

    fetch("http://localhost:5000/api/temp_hum")
      .then((res) => res.json())
      .then((data: AirReading[]) => {
        setLatestTempHum(data[0]);
        setTempHumHistory(data.slice(0, 50));
      });
  }, []);

  // WebSocket for live updates
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:5000");

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "DUST_UPDATE") {
        setLatestDust(message.data);
        setDustHistory((prev) => [...prev.slice(-49), message.data]);
      }
      if (message.type === "GAS_UPDATE") {
        setLatestGas(message.data);
        setGasHistory((prev) => [...prev.slice(-49), message.data]);
      }
      if (message.type === "TEMP_UPDATE") {
        setLatestTempHum(message.data);
        setTempHumHistory((prev) => [...prev.slice(-49), message.data]);
      }
    };

    return () => ws.close();
  }, []);

  const statusColor = (status?: string) => {
    if (status === "High") return "bg-red-100 text-red-700";
    if (status === "Medium") return "bg-yellow-100 text-yellow-700";
    return "bg-green-100 text-green-700";
  };

  const suggestions = () => {
    const arr: string[] = [];
    if (latestDust?.air_status === "High")
      arr.push("Limit outdoor activity due to high dust levels.");
    if (latestGas?.air_status === "High")
      arr.push("Possible gas pollution detected. Check surrounding sources.");
    if (latestTempHum?.temp_status === "High")
      arr.push("High temperature detected. Stay hydrated and use cooling systems.");
    return arr;
  };

  const computeAQI = () => {
    if (!latestDust || !latestGas || !latestTempHum)
      return { label: "Unknown", color: "bg-gray-100 text-gray-600" };

    const dustScore = latestDust.dust! > 150 ? 3 : latestDust.dust! > 75 ? 2 : 1;
    const gasScore = latestGas.gas_ppm! > 150 ? 3 : latestGas.gas_ppm! > 75 ? 2 : 1;
    const tempScore = latestTempHum.temperature! > 35 ? 3 : latestTempHum.temperature! > 30 ? 2 : 1;
    const total = dustScore + gasScore + tempScore;

    if (total <= 5) return { label: "Good", color: "bg-gradient-to-r from-green-400 to-green-600 text-white" };
    if (total <= 6) return { label: "Moderate", color: "bg-gradient-to-r from-yellow-300 to-yellow-500 text-black" };
    if (total <= 12) return { label: "Unhealthy", color: "bg-gradient-to-r from-orange-400 to-orange-600 text-white" };
    return { label: "Hazardous", color: "bg-gradient-to-r from-red-500 to-red-700 text-white" };
  };

  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

  const chartData = dustHistory
    .filter((d) => new Date(d.createdAt).getTime() >= fiveMinutesAgo)
    .map((d) => ({ time: new Date(d.createdAt).toLocaleTimeString(), dust: d.dust }));

  const gasChartData = gasHistory
    .filter((d) => new Date(d.createdAt).getTime() >= fiveMinutesAgo)
    .map((d) => ({ time: new Date(d.createdAt).toLocaleTimeString(), gas: d.gas_ppm }));

  const tempChartData = tempHumHistory
    .filter((d) => new Date(d.createdAt).getTime() >= fiveMinutesAgo)
    .map((d) => ({ time: new Date(d.createdAt).toLocaleTimeString(), temperature: d.temperature, humidity: d.humidity }));

  return (
    <div className="min-h-screen bg-gray-50">
       <Header />
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Air Quality Monitoring Dashboard</h1>
          <h1 className="text-md font-extralight text-gray-950">Details about the sensors and measurement methods</h1>
          <h1 className="text-md font-extralight text-gray-950 mb-6">Location: Malabe</h1>
        </div>

        {/* Sensor Cards */}
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <SensorCard
            icon={<Wind className="text-blue-500 w-7 h-7" />}
            title="Dust Sensor"
            subtitle="PM2.5 Levels"
            subtext="Location: Malabe"
            value={latestDust?.dust}
            status={latestDust?.air_status}
            unit="µg/m³"
            alert={latestDust?.air_status === "High" ? "High dust detected! Wear a mask." : undefined}
          />
          <SensorCard
            icon={<Flame className="text-red-500 w-7 h-7" />}
            title="Gas Sensor"
            subtitle="Gas Concentration"
            subtext="Location: Malabe"
            value={latestGas?.gas_ppm}
            status={latestGas?.air_status}
            unit="ppm"
            alert={latestGas?.air_status === "High" ? "Gas pollution alert!" : undefined}
          />
          <SensorCard
            icon={<Thermometer className="text-orange-500 w-7 h-7" />}
            title="Temperature Sensor"
            subtitle="Room Temperature"
            subtext="Location: Malabe"
            value={latestTempHum?.temperature}
            status={latestTempHum?.temp_status}
            unit="°C"
            alert={latestTempHum?.temp_status === "High" ? "High temperature alert!" : undefined}
          />
          <SensorCard
            icon={<Droplets className="text-cyan-500 w-7 h-7" />}
            title="Humidity Sensor"
            subtitle="Relative Humidity"
            subtext="Location: Malabe"
            value={latestTempHum?.humidity}
            unit="%"
          />
        </div>


        <div>
          <h1 className="text-2xl font-bold text-gray-800 ">Air Quality Overall Measurements</h1>
        <h1 className="text-md mb-6 font-extralight text-gray-950   "> including dust, gas, temperature, 
        and humidity, helping to evaluate overall air quality.</h1>
       

        </div>

        {/* Overall AQI */}
      <div className={`rounded-xl shadow-2xl p-6 mb-8 transition-colors ${computeAQI().color}`}>
  <div className="flex flex-col md:flex-row items-center justify-between">
    <div>
      <h2 className="text-xl md:text-2xl font-semibold mb-1">Overall Air Quality</h2>
      <p className="text-md md:text-lg mb-2">{computeAQI().label}</p>
    </div>

    {/* Button to toggle recommendations */}
   <motion.button
     onClick={() => {
    router.push("/Pages/air_quality/Recommendations"); // navigate to new page
    setShowRecommendations(!showRecommendations);      // optional toggle
  }}
  className="mt-4 md:mt-0 px-4 py-2 rounded-lg font-semibold text-white shadow-lg
             bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700"
  animate={{ y: [0, -3, 0], scale: [1, 1.05, 1] }}
  transition={{
    duration: 0.8,
    repeat: Infinity,
    ease: "easeInOut",
  }}
>
  Health Recommendations
</motion.button>
  </div>

  {/* Animated Recommendations */}
  <AnimatePresence>
    {showRecommendations && (
      <motion.div
        onClick={() => setShowRecommendations(!showRecommendations)}
  whileHover={{ scale: 1.1 }}         // Grow a bit on hover
  whileTap={{ scale: 0.95 }}          // Shrink a bit on click
  animate={{ scale: showRecommendations ? 1.05 : 1 }} // Slight pulse when open
  transition={{ type: "spring", stiffness: 300, damping: 20 }}
  className="mt-4 md:mt-0 px-4 py-2 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 shadow-md"
      >
        {suggestions().length > 0 ? (
          <ul className="space-y-2 list-disc list-inside text-white">
            {suggestions().map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        ) : (
          <p className="text-white">Air quality is good! No special recommendations.</p>
        )}
      </motion.div>
    )}
  </AnimatePresence>
</div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Dust */}
          <div>
            <div className="flex items-center mb-2 gap-2">
              <Wind className="text-blue-500 w-6 h-6" />
              <h1 className="text-2xl font-bold text-gray-800">Dust Level</h1>
            </div>
            <h2 className="text-md font-extralight text-gray-700 mb-4">
              Shows dust concentration (PM2.5) in the last 5 minutes.
            </h2>
            <ChartCard
              
              subtext="Dust concentration in the last 5 minutes (PM2.5)"
             
              data={chartData}
              dataKey="dust"
              stroke="#2563eb"
            />
          </div>

          {/* Gas */}
          <div>
            <div className="flex items-center mb-2 gap-2">
              <Flame className="text-red-500 w-6 h-6" />
              <h1 className="text-2xl font-bold text-gray-800">Gas Level</h1>
            </div>
            <h2 className="text-md font-extralight text-gray-700 mb-4">
              Shows gas concentration (ppm) detected in the last 5 minutes.
            </h2>
            <ChartCard
             
              subtext="Gas concentration in the last 5 minutes (ppm)"
              
              data={gasChartData}
              dataKey="gas"
              stroke="#ef4444"
            />
          </div>

          {/* Temperature */}
          <div>
            <div className="flex items-center mb-2 gap-2">
              <Thermometer className="text-orange-500 w-6 h-6" />
              <h1 className="text-2xl font-bold text-gray-800">Temperature</h1>
            </div>
            <h2 className="text-md font-extralight text-gray-700 mb-4">
              Shows room temperature trends in the last 5 minutes.
            </h2>
            <ChartCard
            
              subtext="Room temperature over the last 5 minutes"
         
              data={tempChartData}
              dataKey="temperature"
              stroke="#f97316"
            />
          </div>

          {/* Humidity */}
          <div> 
            <div className="flex items-center mb-2 gap-2">
              <Droplets className="text-cyan-500 w-6 h-6" />
              <h1 className="text-2xl font-bold text-gray-800">Humidity</h1>
            </div>
            <h2 className="text-md font-extralight text-gray-700 mb-4">
              Shows room humidity trends in the last 5 minutes.
            </h2>
            <ChartCard
             
              subtext="Room humidity over the last 5 minutes"
             
              data={tempChartData}
              dataKey="humidity"
              stroke="#06b6d4"
            />
          </div>

        </div>
      </div>
    </div>
  );
}

// Sensor Card Component
const SensorCard = ({ icon, title, subtitle, subtext, value, status, unit, alert }: any) => (
  <div className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition flex flex-col justify-between">
    <div className="flex justify-between items-center mb-2">
      {icon}
      {status && <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor(status)}`}>{status}</span>}
    </div>
    <p className="text-gray-400 text-sm">{subtitle}</p>
    <p className="text-gray-700 font-semibold text-lg">{title}</p>
    {subtext && <p className="text-gray-500 text-sm mt-1">{subtext}</p>}
    <p className="text-2xl md:text-3xl font-bold text-gray-800 mt-2">{value ?? "--"}{unit}</p>
    {alert && <p className="text-red-600 text-sm mt-1">{alert}</p>}
  </div>
);

// Chart Card Component
const ChartCard = ({ title, subtext, icon, data, dataKey, stroke }: any) => (
  <div className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition flex flex-col">
    <div className="flex items-center gap-2 mb-2">
      {icon} <h2 className="text-lg font-semibold">{title}</h2>
    </div>
    {subtext && <p className="text-gray-500 text-sm mb-3">{subtext}</p>}
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <CartesianGrid strokeDasharray="3 3" />
        {Array.isArray(dataKey) ? (
          dataKey.map((key: string, i: number) => (
            <Line key={i} type="monotone" dataKey={key} stroke={stroke[i]} strokeWidth={3} dot={false} />
          ))
        ) : (
          <Line type="monotone" dataKey={dataKey} stroke={stroke} strokeWidth={3} dot={false} />
        )}
      </LineChart>
    </ResponsiveContainer>
  </div>
);

// Helper for status color
const statusColor = (status?: string) => {
  if (status === "High") return "bg-red-100 text-red-700";
  if (status === "Medium") return "bg-yellow-100 text-yellow-700";
  return "bg-green-100 text-green-700";
};