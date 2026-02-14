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
} from "lucide-react";

interface PredictionRow {
  location: string;
  date: string;
  tempmax: number;
  humidity: number;
  dew: number;
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
    if (temp < 27) return "Normal";
    if (temp < 33) return "Caution";
    if (temp < 41) return "Extreme Caution";
    if (temp < 51) return "Danger";
    return "Extreme Danger";
  };

  const getRiskStyles = (temp: number) => {
    const level = getRiskLevel(temp);
    const styles: Record<string, string> = {
      Normal: "bg-emerald-500 text-white border-emerald-600",
      Caution: "bg-amber-500 text-white border-amber-600",
      "Extreme Caution": "bg-orange-500 text-white border-orange-600",
      Danger: "bg-red-500 text-white border-red-600",
      "Extreme Danger": "bg-purple-600 text-white border-purple-700",
    };
    return styles[level] || "bg-slate-500 text-white";
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
      "Dew Point",
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
          row.dew,
          row.solarradiation,
          row.heat_index,
          `"${getRiskLevel(row.heat_index)}"`,
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
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-200">
              <LayoutDashboard className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                Climate Prediction Portal
              </h1>
              <p className="text-slate-500 text-sm font-medium">
                Environmental Analytics &amp; Heat Risk Assessment
              </p>
            </div>
          </div>

          <button
            onClick={downloadCSV}
            className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-5 rounded-xl border border-slate-200 shadow-sm transition-all active:scale-95"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>

        {/* Professional Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-1">
              <MapPin size={12} /> Geographic Focus
            </label>
            <div className="relative">
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer text-slate-700"
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc === "all" ? "All Locations" : loc}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                size={16}
              />
            </div>
          </div>

          <div className="md:col-span-4 space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-1">
              <Calendar size={12} /> Analysis Start
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-700"
            />
          </div>

          <div className="md:col-span-4 space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-1">
              <Clock size={12} /> Analysis End
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-700"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">
                    Location
                  </th>
                  <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">
                    Date
                  </th>
                  <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">
                    <span className="flex items-center gap-2">
                      <Thermometer size={14} /> Temp Max
                    </span>
                  </th>
                  <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">
                    <span className="flex items-center gap-2">
                      <Droplets size={14} /> Humidity
                    </span>
                  </th>
                  <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">
                    <span className="flex items-center gap-2">
                      <Sun size={14} /> Solar Rad.
                    </span>
                  </th>
                  <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">
                    Heat Index
                  </th>
                  <th className="px-6 py-5 text-right text-[11px] font-black uppercase tracking-widest text-slate-400">
                    Risk Assessment
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredData.length > 0 ? (
                  filteredData.map((row, idx) => (
                    <tr
                      key={`${row.location}-${row.date}-${idx}`}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4 font-bold text-slate-700 text-sm">
                        {row.location}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                        {new Date(row.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 font-mono text-sm font-bold text-slate-600">
                        {row.tempmax?.toFixed(1)}°C
                      </td>
                      <td className="px-6 py-4 font-mono text-sm font-bold text-slate-600">
                        {row.humidity?.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-slate-400">
                        {row.solarradiation?.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 font-mono text-lg font-black text-blue-600">
                        {row.heat_index?.toFixed(1)}°C
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border shadow-sm ${getRiskStyles(
                            row.heat_index
                          )}`}
                        >
                          {getRiskLevel(row.heat_index)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-20 text-center text-slate-400 font-bold italic"
                    >
                      No environmental records found for{" "}
                      {new Date(dateRange.start).toLocaleDateString()}.
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
};

export default PredictionsTable;

