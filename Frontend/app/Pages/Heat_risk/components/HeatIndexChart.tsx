"use client";

import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import { format } from "date-fns";

interface HeatIndexPoint {
  date: string;
  location: string;
  heat_index: number;
}

interface HeatIndexChartProps {
  data: HeatIndexPoint[];
}

const HeatIndexChart: React.FC<HeatIndexChartProps> = ({ data }) => {
  const locations = useMemo(
    () => [...new Set(data.map((item) => item.location))].sort(),
    [data]
  );

  const [selectedLocation, setSelectedLocation] = useState<string>(
    locations.includes("Colombo") ? "Colombo" : locations[0] || ""
  );

  // Date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  const fifteenDaysLater = new Date(today);
  fifteenDaysLater.setDate(today.getDate() + 15);

  const filteredData = useMemo(() => {
    return data
      .filter((item) => {
        const itemDate = new Date(item.date);
        itemDate.setHours(0, 0, 0, 0);
        return itemDate >= sevenDaysAgo && itemDate <= fifteenDaysLater;
      })
      .filter((item) => item.location === selectedLocation)
      .sort(
        (a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
      );
  }, [data, selectedLocation, sevenDaysAgo, fifteenDaysLater]);

  const getRiskLevel = (temp: number) => {
    if (temp < 27) return "Normal";
    if (temp < 33) return "Caution";
    if (temp < 41) return "Extreme Caution";
    if (temp < 51) return "Danger";
    return "Extreme Danger";
  };

  const getRiskColor = (temp: number) => {
    if (temp < 27) return "#22c55e"; // green-500
    if (temp < 33) return "#eab308"; // yellow-500
    if (temp < 41) return "#f97316"; // orange-500
    if (temp < 51) return "#ef4444"; // red-500
    return "#9333ea"; // purple-600
  };

  const getRiskBadge = (temp: number) => {
    if (temp < 27) return "bg-green-100 text-green-800";
    if (temp < 33) return "bg-yellow-100 text-yellow-800";
    if (temp < 41) return "bg-orange-100 text-orange-800";
    if (temp < 51) return "bg-red-100 text-red-800";
    return "bg-purple-100 text-purple-800";
  };

  const chartData = useMemo(() => {
    return filteredData.map((item) => {
      const date = new Date(item.date);
      const isFuture = date > today;
      const heatIndex = Number(item.heat_index.toFixed(1));

      return {
        date: format(date, "MMM dd"),
        shortDate: format(date, "MMM d"),
        fullDate: format(date, "EEEE, MMMM d, yyyy"),
        heatIndex,
        color: getRiskColor(heatIndex),
        riskLevel: getRiskLevel(heatIndex),
        isFuture,
      };
    });
  }, [filteredData, today]);

  // Custom dot: filled for past/today, hollow for future
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (cx == null || cy == null) return null;

    if (payload.isFuture) {
      // Hollow dot for future
      return (
        <circle
          cx={cx}
          cy={cy}
          r={6}
          fill="white"
          stroke={payload.color}
          strokeWidth={3}
        />
      );
    }

    // Filled dot for past & today
    return (
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill={payload.color}
        stroke="#fff"
        strokeWidth={2}
      />
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const point = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-xl shadow-2xl border border-gray-200">
          <p className="text-sm font-semibold text-gray-900">
            {point.fullDate}
          </p>
          <p className="text-xs text-gray-600 mt-1">{selectedLocation}</p>
          <p
            className="text-2xl font-bold mt-3"
            style={{ color: point.color }}
          >
            {point.heatIndex}°C
          </p>
          <p
            className={`text-sm font-bold mt-2 px-3 py-1 rounded-full inline-block ${getRiskBadge(
              point.heatIndex
            )}`}
          >
            {point.riskLevel}
          </p>
          {point.isFuture && (
            <p className="text-xs text-gray-500 mt-2 italic">Forecast</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            15-Day Heat Index Forecast
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {selectedLocation} • Solid line: Recorded • Dotted line: Forecast
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">
            Select Division:
          </label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900  font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none"
          >
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Risk Level Legend */}
      <div className="flex flex-wrap justify-center gap-6 mb-8">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500" />
          <span className="text-sm text-gray-700">
            Normal (&lt;27°C)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-yellow-500" />
          <span className="text-sm text-gray-700">
            Caution (27–32°C)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-orange-500" />
          <span className="text-sm text-gray-700">
            Extreme Caution (33–40°C)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500" />
          <span className="text-sm text-gray-700">
            Danger (41–50°C)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-purple-600" />
          <span className="text-sm text-gray-700">
            Extreme Danger (≥51°C)
          </span>
        </div>
      </div>

      {/* Single Continuous Line Chart */}
      <div className="w-full h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            {/* Background Risk Zones */}
            <ReferenceArea y1={0} y2={27} fill="#d1fae5" fillOpacity={0.3} />
            <ReferenceArea y1={27} y2={33} fill="#fef9c3" fillOpacity={0.4} />
            <ReferenceArea y1={33} y2={41} fill="#ffedd5" fillOpacity={0.4} />
            <ReferenceArea y1={41} y2={51} fill="#fee2e2" fillOpacity={0.4} />
            <ReferenceArea y1={51} y2={60} fill="#f3e8ff" fillOpacity={0.4} />

            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="shortDate"
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              domain={[20, 60]}
              ticks={[25, 30, 35, 40, 45, 50, 55]}
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ strokeDasharray: "3 3" }}
            />

            {/* Single line: solid for past, dashed for future */}
            <Line
              type="monotone"
              dataKey="heatIndex"
              stroke="#2563eb"
              strokeWidth={4}
              dot={<CustomDot />}
              activeDot={{ r: 8 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HeatIndexChart;

