"use client";

import React, { useMemo, useState } from "react";
import { format } from "date-fns";

interface HeatDataPoint {
  date: string;
  location: string;
  heat_index: number;
  tempmax: number;
  humidity: number;
  [key: string]: string | number;
}

interface DivisionHeatMapProps {
  data: HeatDataPoint[];
}

type MetricKey = "heat_index" | "tempmax" | "humidity";

const DivisionHeatMap: React.FC<DivisionHeatMapProps> = ({ data }) => {
  const [metric, setMetric] = useState<MetricKey>("heat_index");
  const [hoverDetail, setHoverDetail] = useState<{
    loc: string;
    val: number;
  } | null>(null);

  const config = {
    heat_index: {
      label: "Heat Index",
      unit: "°C",
      theme: "bg-indigo-500",
      legend: [
        { label: "Normal", range: "<27", color: "bg-emerald-100" },
        { label: "Caution", range: "27-32", color: "bg-amber-200" },
        { label: "Extreme Caution", range: "33-40", color: "bg-orange-500" },
        { label: "Danger", range: "41-50", color: "bg-red-600" },
        { label: "Extreme Danger", range: "51+", color: "bg-purple-700" },
      ],
    },
    tempmax: {
      label: "Temperature",
      unit: "°C",
      theme: "bg-orange-400",
      legend: [
        { label: "Cool", range: "<24", color: "bg-emerald-100" },
        { label: "Moderate", range: "24-28", color: "bg-amber-200" },
        { label: "Warm", range: "29-32", color: "bg-orange-500" },
        { label: "High", range: "33-37", color: "bg-red-600" },
        { label: "Extreme", range: "38+", color: "bg-purple-700" },
      ],
    },
    humidity: {
      label: "Humidity",
      unit: "%",
      theme: "bg-blue-400",
      legend: [
        { label: "Dry", range: "<40", color: "bg-slate-100" },
        { label: "Comfort", range: "40-60", color: "bg-blue-100" },
        { label: "Humid", range: "61-75", color: "bg-blue-300" },
        { label: "High", range: "76-85", color: "bg-blue-600" },
        { label: "Saturated", range: "85+", color: "bg-blue-800" },
      ],
    },
  } satisfies Record<
    MetricKey,
    {
      label: string;
      unit: string;
      theme: string;
      legend: { label: string; range: string; color: string }[];
    }
  >;

  // --- Data Logic ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fifteenDaysLater = new Date(today);
  fifteenDaysLater.setDate(today.getDate() + 14);

  const futureData = useMemo(() => {
    return data
      .filter((item) => {
        const d = new Date(item.date);
        d.setHours(0, 0, 0, 0);
        return d >= today && d <= fifteenDaysLater;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data]);

  const locations = [...new Set(futureData.map((item) => item.location))].sort();
  const dates = [
    ...new Set(futureData.map((item) => format(new Date(item.date), "MMM d"))),
  ];

  const groupedFuture: Record<string, HeatDataPoint[]> = locations.reduce(
    (acc, loc) => {
      acc[loc] = futureData.filter((item) => item.location === loc);
      return acc;
    },
    {} as Record<string, HeatDataPoint[]>
  );

  const globalStats = useMemo(() => {
    if (!futureData.length) {
      return {
        avg: "0.0",
        peak: "0.0",
        peakLoc: "N/A",
        peakDate: "N/A",
      };
    }
    const vals = futureData.map((d) => Number(d[metric]) || 0);
    const maxVal = Math.max(...vals);
    const peakItem = futureData.find((d) => Number(d[metric]) === maxVal);

    return {
      avg: (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1),
      peak: maxVal.toFixed(1),
      peakLoc: peakItem?.location || "N/A",
      peakDate: peakItem
        ? format(new Date(peakItem.date), "MMM d")
        : "N/A",
    };
  }, [futureData, metric]);

  const getCellStyles = (val: number, type: MetricKey) => {
    if (type === "humidity") {
      if (val > 85) return "bg-blue-800 text-white";
      if (val > 75) return "bg-blue-600 text-white";
      if (val > 60) return "bg-blue-300 text-blue-900";
      if (val > 40) return "bg-blue-100 text-blue-900";
      return "bg-slate-100 text-slate-400";
    }
    if (val >= 51) return "bg-purple-700 text-white";
    if (val >= 41) return "bg-red-600 text-white";
    if (val >= 33) return "bg-orange-500 text-white";
    if (val >= 27) return "bg-amber-200 text-amber-900";
    return "bg-emerald-100 text-emerald-800";
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-md overflow-hidden font-sans shadow-sm max-w-full">
      {/* 1. TOP ANALYTICS HEADER */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-x divide-slate-200 bg-white border-b border-slate-200">
        <div className="p-3">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
            Parameter
          </p>
          <div className="flex bg-slate-100 p-0.5 rounded mt-1">
            {(Object.entries(config) as [MetricKey, (typeof config)[MetricKey]][]).map(
              ([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setMetric(key)}
                  className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${
                    metric === key
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {cfg.label.split(" ")[0]}
                </button>
              )
            )}
          </div>
        </div>

        <div className="p-3">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
            Regional Average
          </p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-bold text-slate-800">
              {globalStats.avg}
            </span>
            <span className="text-[10px] text-slate-500 font-bold">
              {config[metric].unit}
            </span>
          </div>
        </div>

        <div className="p-3 bg-slate-50/50">
          <p className="text-[9px] font-bold text-red-500 uppercase tracking-tighter">
            Peak Analysis
          </p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-bold text-red-600">
              {globalStats.peak}
              {config[metric].unit}
            </span>
            <span className="text-[10px] font-bold text-slate-700 whitespace-nowrap">
              @ {globalStats.peakLoc}
            </span>
          </div>
          <p className="text-[9px] text-slate-400 font-medium mt-1 leading-none">
            {globalStats.peakDate}
          </p>
        </div>

        <div className="p-3 bg-indigo-50/30">
          <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-tighter">
            Cell Inspector
          </p>
          {hoverDetail ? (
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold text-indigo-700">
                {Number(hoverDetail.val).toFixed(1)}
                {config[metric].unit}
              </span>
              <span className="text-[10px] font-bold text-slate-700 truncate">
                {hoverDetail.loc}
              </span>
            </div>
          ) : (
            <p className="text-[10px] text-slate-400 mt-2 italic font-medium">
              Hover grid for data
            </p>
          )}
        </div>
      </div>

      {/* 2. DENSE DATA MATRIX */}
      <div className="overflow-x-auto bg-white">
        <table className="w-full border-collapse table-fixed min-w-200">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="sticky left-0 z-20 bg-slate-50 border-r border-slate-200 px-3 py-1 text-left w-32">
                <span className="text-[9px] font-bold text-slate-400 uppercase">
                  Division
                </span>
              </th>
              {dates.map((date) => (
                <th
                  key={date}
                  className="px-0.5 py-1 text-center border-r border-slate-100 last:border-0"
                >
                  <span className="text-[8px] font-bold text-slate-400 uppercase leading-none block">
                    {date.split(" ")[0]}
                  </span>
                  <span className="text-[11px] font-black text-slate-700">
                    {date.split(" ")[1]}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {locations.map((loc) => (
              <tr key={loc} className="hover:bg-slate-50 transition-colors">
                <td className="sticky left-0 z-10 bg-white border-r border-slate-200 px-3 py-1 font-bold text-[9px] text-slate-600 uppercase tracking-tighter truncate">
                  {loc}
                </td>
                {groupedFuture[loc]?.map((item) => {
                  const val = Number(item[metric]) || 0;
                  return (
                    <td
                      key={item.date}
                      className="p-px border-r border-slate-50 last:border-0"
                      onMouseEnter={() => setHoverDetail({ loc, val })}
                      onMouseLeave={() => setHoverDetail(null)}
                    >
                      <div
                        className={`h-6 w-full flex items-center justify-center rounded-[1px] text-[10px] font-mono font-bold transition-opacity cursor-crosshair ${getCellStyles(
                          val,
                          metric
                        )}`}
                      >
                        {Math.round(val)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 3. PROFESSIONAL LEGEND BAR */}
      <div className="bg-white border-t border-slate-200 p-3">
        <div className="flex flex-wrap items-center justify-between gap-y-3">
          <div className="flex items-center gap-4">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest border-r border-slate-200 pr-4">
              Legend
            </span>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {config[metric].legend.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div
                    className={`w-3 h-3 rounded-sm ${item.color} border border-black/5`}
                  />
                  <div className="flex flex-col leading-none">
                    <span className="text-[10px] font-bold text-slate-700">
                      {item.label}
                    </span>
                    <span className="text-[8px] text-slate-400 font-mono">
                      {item.range}
                      {config[metric].unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DivisionHeatMap;

