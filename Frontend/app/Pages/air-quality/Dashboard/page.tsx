"use client";

import React, { useEffect, useState } from "react";
import Navbar from "../NavBar/Navbar";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface AirReport {
  id: number;
  area_name: string;
  latitude: string;
  longitude: string;
  pm25: number;
  pm10: number;
  co: number;
  co2: number;
  no2: number;
  status: string;
  created_at: string;
}

export default function AirDashboard() {
  const [reports, setReports] = useState<AirReport[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [selectedMetric, setSelectedMetric] = useState<string>("pm25");

  useEffect(() => {
    fetch("http://localhost:5000/api/pollution/all")
      .then((res) => res.json())
      .then((data) => {
        const sortedData = data.sort(
          (a: AirReport, b: AirReport) =>
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
        );

        setReports(sortedData);
      })
      .catch((err) => console.error("Error fetching data:", err));
  }, []);

  const areas = [...new Set(reports.map((r) => r.area_name))];

  const filteredReports = selectedArea
    ? reports.filter((r) => r.area_name === selectedArea)
    : reports;

  const chartData = filteredReports.map((r) => ({
    time: new Date(r.created_at).toLocaleTimeString(),
    pm25: r.pm25,
    pm10: r.pm10,
    co: r.co,
    co2: r.co2,
    no2: r.no2,
  }));

  const latestReport =
    filteredReports.length > 0
      ? filteredReports[filteredReports.length - 1]
      : null;

  function getSuggestions(status: string) {
    if (status === "High") {
      return [
        "Increase traffic control in this area",
        "Reduce vehicle entry during peak hours",
        "Inspect nearby construction sites",
        "Send public health alert to residents",
      ];
    }

    if (status === "Moderate") {
      return [
        "Monitor traffic congestion",
        "Encourage public transportation",
        "Check road dust levels",
      ];
    }

    return ["Air quality is good", "Continue monitoring sensors"];
  }

  const suggestions = latestReport
    ? getSuggestions(latestReport.status)
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-800">
            Air Pollution Monitoring Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Real-time air quality monitoring system.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white border rounded-lg p-6 shadow-sm mb-8 flex gap-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Select Area
            </h2>

            <select
              className="border rounded-md text-black px-4 py-2 w-64"
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
            >
              <option value="">All Areas</option>
              {areas.map((area, index) => (
                <option key={index} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Select Pollution Type
            </h2>

            <select
              className="border rounded-md text-black px-4 py-2 w-64"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
            >
              <option value="pm25">PM2.5</option>
              <option value="pm10">PM10</option>
              <option value="co">CO</option>
              <option value="co2">CO2</option>
              <option value="no2">NO2</option>
            </select>
          </div>
        </div>

        {/* Graph */}
        <div className="bg-white border rounded-lg p-6 shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Pollution Trend
          </h2>

          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />

              <Line
                type="monotone"
                dataKey={selectedMetric}
                stroke="#ef4444"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Suggestions */}
        <div className="bg-white border rounded-lg p-6 shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Authority Action Suggestions
          </h2>

          {latestReport ? (
            <div>
              <p className="mb-3 text-gray-600">
                Current Status in {latestReport.area_name}:{" "}
                <span className="font-bold">{latestReport.status}</span>
              </p>

              <ul className="list-disc pl-5 space-y-2">
                {suggestions.map((s, index) => (
                  <li key={index} className="text-gray-700">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p>No recommendation available</p>
          )}
        </div>

        {/* Table */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {selectedArea
              ? `${selectedArea} – Air Quality Data`
              : "All Areas – Air Quality Data"}
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-blue-700 text-white">
                <tr>
                  <th className="px-4 py-2 text-left">Area</th>
                  <th className="px-4 py-2 text-left">PM2.5</th>
                  <th className="px-4 py-2 text-left">PM10</th>
                  <th className="px-4 py-2 text-left">CO</th>
                  <th className="px-4 py-2 text-left">CO2</th>
                  <th className="px-4 py-2 text-left">NO2</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Recorded At</th>
                </tr>
              </thead>

              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 text-black">{report.area_name}</td>
                    <td className="px-4 py-2 text-black">{report.pm25}</td>
                    <td className="px-4 py-2 text-black">{report.pm10}</td>
                    <td className="px-4 py-2 text-black">{report.co}</td>
                    <td className="px-4 py-2 text-black">{report.co2}</td>
                    <td className="px-4 py-2 text-black">{report.no2}</td>

                    <td className="px-4 py-2 font-semibold">
                      {report.status === "High" ? (
                        <span className="text-red-600">High</span>
                      ) : report.status === "Moderate" ? (
                        <span className="text-yellow-600">Moderate</span>
                      ) : (
                        <span className="text-green-600">Low</span>
                      )}
                    </td>

                    <td className="px-4 py-2 text-black">
                      {new Date(report.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}