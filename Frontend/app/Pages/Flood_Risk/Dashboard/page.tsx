"use client";

import React, { useEffect, useState } from "react";   
import Navbar from "../NavBar/Navbar";

interface WaterReport {
  id: number;
  station: string;
  waterLevel: number;
  rainfallLevel: number;
  latitude: string;
  longitude: string;
  recordedAt: string;
  waterLevelCategory: string;
  rainfallLevelCategory: string;
}

export default function WaterDashboard() {
  const [reports, setReports] = useState<WaterReport[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>("");

  // Fetch data from backend
  useEffect(() => {
    fetch("http://localhost:5000/api/water/reports")
      .then((res) => res.json())
      .then((data) => {
        setReports(data);
      })
      .catch((err) => console.error("Error fetching data:", err));
  }, []);

  // Get unique stations
  const stations = [...new Set(reports.map((r) => r.station))];

  // Show ALL reports by default
  const filteredReports = selectedStation
    ? reports.filter((r) => r.station === selectedStation)
    : reports;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-800">
            River Flood Monitoring Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Real-time river water level and rainfall monitoring system.
          </p>
        </div>

        {/* Filter Section */}
        <div className="bg-white border rounded-lg p-6 shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Filter by Station
          </h2>

          <select
            className="border rounded-md text-black px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
          >
            <option value="">All Stations</option>
            {stations.map((station, index) => (
              <option key={index} value={station}>
                {station}
              </option>
            ))}
          </select>
        </div>

        {/* Table Section */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {selectedStation
              ? `${selectedStation} – Sensor Data`
              : "All Stations – Sensor Data"}
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-blue-700 text-white">
                <tr>
                  <th className="px-4 py-2 text-left">Station</th>
                  <th className="px-4 py-2 text-left">Water Level (m)</th>
                  <th className="px-4 py-2 text-left">Rainfall (mm)</th>
                  <th className="px-4 py-2 text-left">Recorded At</th>
                  <th className="px-4 py-2 text-left">Water Status</th>
                  <th className="px-4 py-2 text-left">Rainfall Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 text-black">
                      {report.station}
                    </td>

                    <td className="px-4 py-2 text-black">
                      {report.waterLevel} m
                    </td>

                    <td className="px-4 py-2 text-black">
                      {report.rainfallLevel} mm
                    </td>

                    <td className="px-4 py-2 text-black">
                      {new Date(report.recordedAt).toLocaleString()}
                    </td>

                    <td className="px-4 py-2 font-semibold">
                      {report.waterLevelCategory === "high" ? (
                        <span className="text-red-600">
                          {report.waterLevelCategory}
                        </span>
                      ) : report.waterLevelCategory === "medium" ? (
                        <span className="text-yellow-600">
                          {report.waterLevelCategory}
                        </span>
                      ) : (
                        <span className="text-green-600">
                          {report.waterLevelCategory}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-2 font-semibold">
                      {report.rainfallLevelCategory === "high" ? (
                        <span className="text-red-600">
                          {report.rainfallLevelCategory}
                        </span>
                      ) : report.rainfallLevelCategory === "medium" ? (
                        <span className="text-yellow-600">
                          {report.rainfallLevelCategory}
                        </span>
                      ) : (
                        <span className="text-green-600">
                          {report.rainfallLevelCategory}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {filteredReports.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-4 text-gray-500"
                    >
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
