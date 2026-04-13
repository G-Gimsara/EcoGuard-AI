"use client";

import React, { useEffect, useState } from "react";
import Navbar from "../NavBar/Navbar";
import { Clock, Droplets, AlertTriangle, MapPin } from "lucide-react";
import Header from "@/app/Header/page";

interface FloodMeasurement {
  id: number;
  riseLevel: number;
  severity: string;
  firstAffected: string;
  nextAffected: string;
  floodFeet: number;
  createdAt: string;
}

export default function Reports() {
  // Raw flood history loaded from backend; rendered as a paginated table.
  const [measurements, setMeasurements] = useState<FloodMeasurement[]>([]);
  const [filterYear, setFilterYear] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Fixed page size keeps pagination predictable .
  const rowsPerPage = 10;

  useEffect(() => {
    // Load historical measurements once on mount.
    fetch("http://localhost:5000/api/flood")
      .then((res) => res.json())
      .then((data) => setMeasurements(data))
      .catch((err) => console.error(err));
  }, []);

  // Year filter is applied in-memory on the fetched dataset.
  const filteredData = measurements.filter((m) => {
    const date = new Date(m.createdAt);
    return filterYear === "" || date.getFullYear() === parseInt(filterYear);
  });

  // Pagination window derived from the filtered dataset.
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  // Visual severity mapping so each risk stage is instantly recognizable.
  const severityColors: Record<string, { bg: string; text: string }> = {
    Normal: { bg: "bg-green-100", text: "text-green-700" },
    Alert: { bg: "bg-yellow-100", text: "text-yellow-700" },
    Minor: { bg: "bg-orange-100", text: "text-orange-700" },
    Moderate: { bg: "bg-orange-200", text: "text-orange-800" },
    Major: { bg: "bg-red-100", text: "text-red-700" },
    Critical: { bg: "bg-red-600", text: "text-white" },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white font-sans antialiased">
      <Header />
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 tracking-tight flex items-center gap-3">
            <Droplets size={32} className="text-blue-600 animate-pulse" />
            Flood Monitoring Reports
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-lg">
            Historical flood measurements and affected areas
          </p>
        </div>

        {/* Filter Section */}
        <div className="flex flex-col md:flex-row items-center justify-between bg-white p-4 rounded-2xl shadow-lg border mb-6 gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-600">Filter by Year</span>
            <select
              value={filterYear}
              onChange={(e) => {
                setFilterYear(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 px-3 py-2 rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all hover:shadow-md"
            >
              <option value="">All Years</option>
              {[...new Set(measurements.map((m) => new Date(m.createdAt).getFullYear()))].map(
                (y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* Table Card */}
        <div className="overflow-hidden bg-white rounded-3xl shadow-2xl border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm font-medium text-gray-900">
              <thead>
                <tr className="bg-gradient-to-r from-blue-700 to-blue-600 text-white uppercase text-xs tracking-wider">
                  <th className="px-6 py-3 text-left">#</th>
                  <th className="px-6 py-3 text-left">Rise (mm)</th>
                  <th className="px-6 py-3 text-left">Rise (ft)</th>
                  <th className="px-6 py-3 text-left">Severity</th>
                  <th className="px-6 py-3 text-left">First Affected</th>
                  <th className="px-6 py-3 text-left">Next Affected</th>
                  <th className="px-6 py-3 text-left">Date / Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentRows.length > 0 ? (
                  currentRows.map((m, idx) => (
                    <tr
                      key={m.id}
                      className="hover:shadow-xl hover:bg-blue-50 transition transform hover:scale-[1.01]"
                    >
                      <td className="px-6 py-3 text-gray-700">{indexOfFirstRow + idx + 1}</td>
                      <td className="px-6 py-3 text-blue-700 font-semibold">{m.riseLevel.toFixed(1)}</td>
                      <td className="px-6 py-3">{m.floodFeet}</td>

                      <td className="px-6 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${severityColors[m.severity]?.bg} ${severityColors[m.severity]?.text}`}>
                          {m.severity}
                        </span>
                      </td>

                      <td className="px-6 py-3 text-gray-800 whitespace-pre-wrap truncate max-w-[150px]">
                        {m.firstAffected.length > 30 ? `${m.firstAffected.slice(0,30)}...` : m.firstAffected}
                      </td>

                      <td className="px-6 py-3 text-gray-800 whitespace-pre-wrap truncate max-w-[150px]">
                        {m.nextAffected && m.nextAffected.length > 30 ? `${m.nextAffected.slice(0,30)}...` : m.nextAffected || "-"}
                      </td>

                      <td className="px-6 py-3 text-gray-600 font-mono">
                        {new Date(m.createdAt).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-500">
                      No flood records available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
            >
              Previous
            </button>

            <span className="text-sm text-gray-600 font-medium">
              Page {currentPage} of {totalPages}
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}