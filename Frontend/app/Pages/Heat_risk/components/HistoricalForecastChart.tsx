"use client";

import React, { useMemo, useState } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TrendingUp, AlertTriangle, MapPin } from "lucide-react";

interface HistoricalPoint {
  date: string;
  location: string;
  heat_index: number;
}

interface HistoricalForecastChartProps {
  data: HistoricalPoint[];
}

const HistoricalForecastChart: React.FC<HistoricalForecastChartProps> = ({
  data,
}) => {
  const [selectedDivision, setSelectedDivision] = useState<string>("colombo");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const divisions = useMemo(() => {
    if (!data || data.length === 0) return ["colombo"];
    const uniqueLocs = [...new Set(data.map((item) => item.location))];
    return uniqueLocs.sort();
  }, [data]);

  const { chartData, insights } = useMemo(() => {
    if (!data || data.length === 0)
      return { chartData: [] as any[], insights: { hasData: false } as any };

    const filteredByDivision = data.filter(
      (item) => item.location === selectedDivision
    );

    const dailyGroups = filteredByDivision.reduce<Record<string, number[]>>(
      (acc, item) => {
        const dateStr = new Date(item.date).toISOString().split("T")[0];
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(item.heat_index);
        return acc;
      },
      {}
    );

    let forecastHighRiskDays = 0;
    const RISK_THRESHOLD = 36;

    const chartArray = Object.keys(dailyGroups).map((dateStr) => {
      const dateObj = new Date(dateStr);
      const temps = dailyGroups[dateStr];
      const avgTemp =
        temps.reduce((sum, val) => sum + val, 0) / temps.length;
      const roundedTemp = Math.round(avgTemp * 10) / 10;

      const isHistorical = dateObj.getTime() < today.getTime();
      if (!isHistorical && roundedTemp >= RISK_THRESHOLD)
        forecastHighRiskDays++;

      return {
        dateStr,
        displayDate: dateObj.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        historical: isHistorical ? roundedTemp : null,
        forecast: !isHistorical ? roundedTemp : null,
        combined: roundedTemp,
      };
    });

    chartArray.sort(
      (a, b) =>
        new Date(a.dateStr).getTime() - new Date(b.dateStr).getTime()
    );

    return {
      chartData: chartArray,
      insights: {
        forecastHighRiskDays,
        hasData: chartArray.length > 0,
        peakTemp:
          chartArray.length > 0
            ? Math.max(...chartArray.map((d) => d.combined))
            : 0,
      },
    };
  }, [data, selectedDivision, today]);

  const yDomain = useMemo<[number, number]>(() => {
    if (chartData.length === 0) return [20, 50];
    const temps = chartData.map((d) => d.combined);
    return [
      Math.floor(Math.min(...temps) - 2),
      Math.ceil(Math.max(...temps) + 2),
    ];
  }, [chartData]);

  if (!insights.hasData) return null;

  const firstForecast = chartData.find((d) => d.forecast !== null);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
      <div className="p-6 pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 tracking-tight">
            Heat Index Analysis
          </h2>
          <p className="text-sm text-gray-500">
            Real-time data for{" "}
            <span className="text-orange-600 font-bold capitalize">
              {selectedDivision}
            </span>
          </p>
        </div>

        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            className="pl-10 pr-10 py-2 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none cursor-pointer capitalize"
          >
            {divisions.map((div) => (
              <option key={div} value={div}>
                {div}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="w-full h-95 px-2 pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f0f0f0"
            />
            <XAxis
              dataKey="displayDate"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              minTickGap={20}
            />
            <YAxis
              domain={yDomain}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                color: "#333333",
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
              }}
              cursor={{ stroke: "#e2e8f0", strokeWidth: 2 }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: "20px" }}
            />

            <Line
              name="Historical"
              type="monotone"
              dataKey="historical"
              stroke="#94a3b8"
              strokeWidth={3}
              dot={{ r: 4, fill: "#fff", strokeWidth: 2 }}
              connectNulls
            />
            <Line
              name="Forecast"
              type="monotone"
              dataKey="forecast"
              stroke="#ef4444"
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={{ r: 4, fill: "#fff", stroke: "#ef4444", strokeWidth: 2 }}
            />
            {firstForecast && (
              <ReferenceLine
                x={firstForecast.displayDate}
                stroke="#ef4444"
                label={{
                  value: "NOW",
                  position: "insideTopLeft",
                  fill: "#ef4444",
                  fontSize: 10,
                  fontWeight: "bold",
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-slate-50 p-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-2 bg-orange-100 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">
              Risk Warning
            </h4>
            <p className="text-xs text-gray-600">
              Found{" "}
              <span className="font-bold text-orange-600">
                {insights.forecastHighRiskDays} days
              </span>{" "}
              in the upcoming forecast exceeding the 36°C threshold.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-2 bg-blue-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">
              Peak intensity
            </h4>
            <p className="text-xs text-gray-600">
              The highest recorded/forecast heat index for{" "}
              <span className="capitalize">{selectedDivision}</span> is{" "}
              <span className="font-bold text-blue-600">
                {insights.peakTemp}°C
              </span>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoricalForecastChart;

