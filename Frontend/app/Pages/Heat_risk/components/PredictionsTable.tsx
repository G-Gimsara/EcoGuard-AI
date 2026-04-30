"use client";

import React, { useState, useMemo } from "react";
import {
  MapPin,
  Calendar,
  Download,
  ChevronDown,
  Thermometer,
  Droplets,
  Sun,
  Clock,
  LayoutDashboard,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

interface PredictionRow {
  location: string;
  date: string;
  tempmax: number;
  humidity: number;
  
  solarradiation: number;
  heat_index: number;
}

interface PredictionsTableProps {
  data: PredictionRow[];
}

const PredictionsTable: React.FC<PredictionsTableProps> = ({ data }) => {
  const getLocalDateString = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split("T")[0];
  };

  const todayStr = getLocalDateString(new Date());

  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: todayStr,
    end: todayStr,
  });

  const getRiskLevel = (temp: number) => {
    const numTemp = Number(temp);
    if (isNaN(numTemp)) return "Unknown";
    if (numTemp < 27) return "Normal";
    if (numTemp < 33) return "Caution";
    if (numTemp < 41) return "Extreme Caution";
    if (numTemp < 51) return "Danger";
    return "Extreme Danger";
  };

  const getRiskStyles = (temp: number) => {
    const numTemp = Number(temp);
    const level = getRiskLevel(numTemp);
    const styles: Record<string, string> = {
      Normal: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border border-emerald-600 shadow-lg shadow-emerald-500/40",
      Caution: "bg-gradient-to-r from-amber-500 to-orange-500 text-white border border-amber-600 shadow-lg shadow-amber-500/40",
      "Extreme Caution": "bg-gradient-to-r from-orange-500 to-orange-600 text-white border border-orange-600 shadow-lg shadow-orange-500/40",
      Danger: "bg-gradient-to-r from-red-500 to-red-600 text-white border border-red-600 shadow-lg shadow-red-500/40",
      "Extreme Danger": "bg-gradient-to-r from-purple-600 to-red-600 text-white border border-purple-700 shadow-lg shadow-purple-600/40",
      Unknown: "bg-gradient-to-r from-slate-500 to-slate-600 text-white border border-slate-600 shadow-lg shadow-slate-500/40",
    };
    return styles[level] || "bg-gradient-to-r from-slate-500 to-slate-600 text-white border border-slate-600 shadow-lg shadow-slate-500/40";
  };

  const locations = useMemo(
    () => ["all", ...new Set(data.map((item) => item.location))].sort(),
    [data]
  );

  const filteredData = useMemo(() => {
    return data
      .filter((item) => {
        const matchesLocation =
          selectedLocation === "all" || item.location === selectedLocation;

        const itemDate = new Date(item.date);
        const itemDateStr = getLocalDateString(itemDate);

        const matchesDate =
          itemDateStr >= dateRange.start && itemDateStr <= dateRange.end;
        return matchesLocation && matchesDate;
      })
      .sort(
        (a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
      );
  }, [data, selectedLocation, dateRange]);

  const downloadCSV = () => {
    const headers = [
      "Location",
      "Date",
      "Temp Max",
      "Humidity",
     
      "Solar Radiation",
      "Heat Index",
      "Risk Level",
    ];
    const csvRows = [
      headers.join(","),
      ...filteredData.map((row) =>
        [
          row.location,
          row.date,
          row.tempmax,
          row.humidity,
          
          row.solarradiation,
          row.heat_index,
          `"${getRiskLevel(Number(row.heat_index) || 0)}"`,
        ].join(",")
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute(
      "download",
      `heat_report_${selectedLocation}_${dateRange.start}.csv`
    );
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-6 md:p-10 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enhanced Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3.5 rounded-2xl shadow-lg shadow-blue-300/50 hover:shadow-blue-400/60 transition-all">
              <LayoutDashboard className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                Climate Prediction Portal
              </h1>
              <p className="text-slate-500 text-sm font-semibold mt-1 flex items-center gap-2">
                <TrendingUp size={14} className="text-emerald-600" />
                Environmental Analytics &amp; Heat Risk Assessment
              </p>
            </div>
          </div>

          <button
            onClick={downloadCSV}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-300/40 hover:shadow-blue-400/60 transition-all active:scale-95 group duration-200"
          >
            <Download size={18} className="group-hover:animate-bounce" />
            Export CSV
          </button>
        </div>

        {/* Enhanced Filter Bar with gradient */}
        <div className="bg-white backdrop-blur-xl bg-opacity-90 p-7 rounded-2xl border border-slate-200/80 shadow-lg shadow-slate-200/20 hover:shadow-slate-300/30 transition-shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Location Filter */}
            <div className="space-y-2.5">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2.5 ml-0.5">
                <div className="bg-blue-100 p-1.5 rounded-lg">
                  <MapPin size={13} className="text-blue-600" />
                </div>
                Geographic Focus
              </label>
              <div className="relative group">
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full appearance-none bg-gradient-to-r from-slate-50 to-slate-50 border-2 border-slate-200 rounded-xl py-3.5 px-4.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:outline-none focus:border-blue-500 cursor-pointer text-slate-700 transition-all shadow-sm group-hover:shadow-md hover:border-slate-300"
                >
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc === "all" ? "All Locations" : loc}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors"
                  size={18}
                />
              </div>
            </div>

            {/* Start Date Filter */}
            <div className="space-y-2.5">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2.5 ml-0.5">
                <div className="bg-emerald-100 p-1.5 rounded-lg">
                  <Calendar size={13} className="text-emerald-600" />
                </div>
                Analysis Start
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, start: e.target.value }))
                }
                className="w-full bg-gradient-to-r from-slate-50 to-slate-50 border-2 border-slate-200 rounded-xl py-3.5 px-4.5 text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0 focus:outline-none focus:border-emerald-500 text-slate-700 transition-all shadow-sm hover:shadow-md hover:border-slate-300 cursor-pointer"
              />
            </div>

            {/* End Date Filter */}
            <div className="space-y-2.5">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2.5 ml-0.5">
                <div className="bg-orange-100 p-1.5 rounded-lg">
                  <Clock size={13} className="text-orange-600" />
                </div>
                Analysis End
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, end: e.target.value }))
                }
                className="w-full bg-gradient-to-r from-slate-50 to-slate-50 border-2 border-slate-200 rounded-xl py-3.5 px-4.5 text-sm font-bold focus:ring-2 focus:ring-orange-500 focus:ring-offset-0 focus:outline-none focus:border-orange-500 text-slate-700 transition-all shadow-sm hover:shadow-md hover:border-slate-300 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Data Table with Enhanced Styling */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg shadow-slate-200/20 overflow-hidden hover:shadow-slate-300/30 transition-shadow">
          {/* Table Header Background */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 via-slate-50 to-slate-50 border-b-2 border-slate-200">
                  <th className="px-7 py-5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-colors">
                    Location
                  </th>
                  <th className="px-7 py-5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-colors">
                    Date
                  </th>
                  <th className="px-7 py-5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-colors">
                    <span className="flex items-center gap-2.5">
                      <span className="bg-red-100 p-1.5 rounded-lg">
                        <Thermometer size={13} className="text-red-600" />
                      </span>
                      Temp Max
                    </span>
                  </th>
                  <th className="px-7 py-5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-colors">
                    <span className="flex items-center gap-2.5">
                      <span className="bg-blue-100 p-1.5 rounded-lg">
                        <Droplets size={13} className="text-blue-600" />
                      </span>
                      Humidity
                    </span>
                  </th>
                  <th className="px-7 py-5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-colors">
                    <span className="flex items-center gap-2.5">
                      <span className="bg-yellow-100 p-1.5 rounded-lg">
                        <Sun size={13} className="text-yellow-600" />
                      </span>
                      Solar Rad.
                    </span>
                  </th>
                  <th className="px-7 py-5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-colors">
                    Heat Index
                  </th>
                  <th className="px-7 py-5 text-right text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-colors">
                    Risk Assessment
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.length > 0 ? (
                  filteredData.map((row, idx) => (
                    <tr
                      key={`${row.location}-${row.date}-${idx}`}
                      className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-emerald-50/50 transition-all duration-200 group border-slate-100"
                    >
                      <td className="px-7 py-5 font-bold text-slate-700 text-sm group-hover:text-blue-700 transition-colors">
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                          {row.location}
                        </div>
                      </td>
                      <td className="px-7 py-5 text-sm text-slate-600 font-semibold group-hover:text-slate-800 transition-colors">
                        {new Date(row.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-7 py-5 font-mono text-sm font-bold text-red-600 group-hover:text-red-700 transition-colors">
                        <div className="flex items-center gap-2">
                          {row.tempmax ? Number(row.tempmax).toFixed(1) : "N/A"}°C
                        </div>
                      </td>
                      <td className="px-7 py-5 font-mono text-sm font-bold text-blue-600 group-hover:text-blue-700 transition-colors">
                        {row.humidity ? Number(row.humidity).toFixed(1) : "N/A"}%
                      </td>
                      <td className="px-7 py-5 font-mono text-sm text-yellow-600 font-semibold group-hover:text-yellow-700 transition-colors">
                        {row.solarradiation ? Number(row.solarradiation).toFixed(1) : "N/A"}
                      </td>
                      <td className="px-7 py-5 font-mono text-lg font-black bg-gradient-to-r from-emerald-50 to-emerald-50 text-emerald-600 group-hover:text-emerald-700 transition-colors">
                        {row.heat_index ? Number(row.heat_index).toFixed(1) : "N/A"}°C
                      </td>
                      <td className="px-7 py-5 text-right">
                        <span
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-tight border-0 shadow-md transition-all duration-200 group-hover:shadow-lg transform group-hover:scale-105 ${getRiskStyles(
                            Number(row.heat_index) || 0
                          )}`}
                        >
                          {getRiskLevel(Number(row.heat_index) || 0) === "Extreme Danger" || 
                           getRiskLevel(Number(row.heat_index) || 0) === "Danger" ? (
                            <AlertTriangle size={12} />
                          ) : null}
                          {getRiskLevel(Number(row.heat_index) || 0)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-7 py-24 text-center text-slate-400 font-semibold"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Calendar size={40} className="text-slate-300" />
                        <p>No environmental records found for {new Date(dateRange.start).toLocaleDateString()}.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs uppercase font-black text-slate-500 mb-1">Total Records</p>
            <p className="text-2xl font-black text-slate-800">{filteredData.length}</p>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs uppercase font-black text-slate-500 mb-1">Avg Temp</p>
            <p className="text-2xl font-black text-red-600">
              {filteredData.length > 0
                ? (filteredData.reduce((sum, r) => sum + (Number(r.tempmax) || 0), 0) / filteredData.length).toFixed(1)
                : "—"}°C
            </p>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs uppercase font-black text-slate-500 mb-1">Avg Humidity</p>
            <p className="text-2xl font-black text-blue-600">
              {filteredData.length > 0
                ? (filteredData.reduce((sum, r) => sum + (Number(r.humidity) || 0), 0) / filteredData.length).toFixed(1)
                : "—"}%
            </p>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs uppercase font-black text-slate-500 mb-1">Avg Heat Index</p>
            <p className="text-2xl font-black text-emerald-600">
              {filteredData.length > 0
                ? (filteredData.reduce((sum, r) => sum + (Number(r.heat_index) || 0), 0) / filteredData.length).toFixed(1)
                : "—"}°C
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionsTable;

