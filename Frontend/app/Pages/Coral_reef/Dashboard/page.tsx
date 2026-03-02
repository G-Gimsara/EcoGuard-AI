"use client";

import React from "react";
import Navbar from "../NavBar/Navbar";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Header from "@/app/Header/page";

/* ------------------ Reusable Components ------------------ */

const SensorCard = ({ title, value }: { title: string; value: string }) => (
  <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition">
    <p className="text-sm text-gray-500">{title}</p>
    <p className="text-2xl font-semibold text-blue-700 mt-1">{value}</p>
  </div>
);

const RiverSection = ({ name, data }: { name: string; data: any[] }) => (
  <section className="mb-10">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-semibold text-gray-800">{name} – IoT Sensor Readings</h2>
      <span className="text-xs text-gray-400 italic">Simulated</span>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
      {data.map((item) => (
        <SensorCard key={item.sensor} title={item.sensor} value={item.value} />
      ))}
    </div>
  </section>
);

/* ------------------ Main Page ------------------ */

export default function CoralReef() {
  const iotData = [
    { sensor: "Water Temperature", value: "29 °C" },
    { sensor: "Salinity", value: "35 ppt" },
    { sensor: "pH Level", value: "8.1" },
    { sensor: "Turbidity", value: "5 NTU" },
  ];

  const trendData = [
    { time: "Jan", temperature: 28, salinity: 34, pH: 8.0, turbidity: 4 },
    { time: "Feb", temperature: 29, salinity: 35, pH: 8.1, turbidity: 5 },
    { time: "Mar", temperature: 30, salinity: 36, pH: 8.2, turbidity: 6 },
    { time: "Apr", temperature: 31, salinity: 35, pH: 8.1, turbidity: 5 },
    { time: "May", temperature: 29, salinity: 34, pH: 8.0, turbidity: 4 },
    { time: "Jun", temperature: 28, salinity: 35, pH: 8.0, turbidity: 3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header/>
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-blue-800">
            Coral Reef Monitoring Dashboard
          </h1>
          <p className="text-gray-600 mt-2 max-w-3xl">
            This dashboard visualizes simulated IoT-based river water quality parameters
            and trend analysis to evaluate potential impacts on coral reef ecosystems.
          </p>
        </div>

        {/* River Sections */}
        <RiverSection name="River A" data={iotData} />
        <RiverSection name="River B" data={iotData} />
        <RiverSection name="River C" data={iotData} />
        <RiverSection name="River D" data={iotData} />

        {/* Trend Analysis */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            IoT Trend Analysis (Monthly)
          </h2>

          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="salinity" stroke="#2563eb" strokeWidth={2} />
                  <Line type="monotone" dataKey="pH" stroke="#7c3aed" strokeWidth={2} />
                  <Line type="monotone" dataKey="turbidity" stroke="#16a34a" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <p className="text-sm text-gray-500 italic mt-3">
            *Trend data is simulated for model evaluation and UI demonstration purposes.
          </p>
        </section>

        {/* Future Scope */}
        <section className="bg-white border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Future Enhancements
          </h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Real-time IoT sensor integration using MQTT or REST APIs.</li>
            <li>Automated alerts for abnormal water quality conditions.</li>
            <li>AI-driven coral health prediction and risk assessment.</li>
            <li>Role-based dashboards for researchers and authorities.</li>
            <li>Mobile and email notifications for conservation teams.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
