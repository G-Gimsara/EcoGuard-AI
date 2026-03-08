"use client";

import React, { useMemo } from "react";

interface SummaryRow {
  date: string;
  location: string;
  heat_index: number;
  tempmax: number;
  humidity: number;
  solarradiation: number;
}

interface SummaryCardsProps {
  data: SummaryRow[];
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ data }) => {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayData = useMemo(
    () =>
      data.filter((item) => {
        const itemDate = new Date(item.date);
        itemDate.setHours(0, 0, 0, 0);
        return itemDate.getTime() === today.getTime();
      }),
    [data, today]
  );

  const getMaxItem = (field: keyof SummaryRow) => {
    if (todayData.length === 0) return null;
    return todayData.reduce((max, item) => {
      const itemValue = Number(item[field]);
      const maxValue = Number(max[field]);
      return itemValue > maxValue ? item : max;
    });
  };

  const maxHeatItem = getMaxItem("heat_index");
  const maxHeatIndex = maxHeatItem
    ? Number(maxHeatItem.heat_index).toFixed(1)
    : "N/A";
  const maxHeatLocation = maxHeatItem ? maxHeatItem.location : "N/A";
  const maxHeatRisk = maxHeatItem
    ? getRiskLevel(Number(maxHeatItem.heat_index))
    : "Unknown";

  const maxTempItem = getMaxItem("tempmax");
  const maxTemp = maxTempItem ? Number(maxTempItem.tempmax).toFixed(1) : "N/A";
  const maxTempLocation = maxTempItem ? maxTempItem.location : "N/A";

  const maxHumidityItem = getMaxItem("humidity");
  const maxHumidity = maxHumidityItem
    ? Number(maxHumidityItem.humidity).toFixed(1)
    : "N/A";
  const maxHumidityLocation = maxHumidityItem
    ? maxHumidityItem.location
    : "N/A";

  const maxSolarItem = getMaxItem("solarradiation");
  const maxSolar = maxSolarItem
    ? Number(maxSolarItem.solarradiation).toFixed(1)
    : "N/A";
  const maxSolarLocation = maxSolarItem
    ? maxSolarItem.location
    : "N/A";

  function getRiskLevel(temp: number) {
   if (temp < 27) return "Normal";
  if (temp < 33) return "Caution";
  if (temp < 41) return "Extreme Caution";
  if (temp < 51) return "Danger";

  return "Extreme Danger";
  }

  function getRiskColor(level: string) {
    const colors: Record<string, string> = {
      Normal: "bg-green-100 text-green-800",
      Caution: "bg-yellow-100 text-yellow-800",
      "Extreme Caution": "bg-orange-100 text-orange-800",
      Danger: "bg-red-100 text-red-800",
      "Extreme Danger": "bg-purple-100 text-purple-800",
      Unknown: "bg-gray-100 text-gray-800",
    };
    return colors[level] || "bg-gray-100 text-gray-800";
  }

  function getHeatCardBg(level: string) {
    const bgs: Record<string, string> = {
      Normal: "bg-gradient-to-br from-green-50 to-emerald-50",
      Caution: "bg-gradient-to-br from-yellow-50 to-amber-50",
      "Extreme Caution": "bg-gradient-to-br from-orange-50 to-red-50",
      Danger: "bg-gradient-to-br from-red-50 to-rose-50",
      "Extreme Danger": "bg-gradient-to-br from-purple-50 to-fuchsia-50",
      Unknown: "bg-gradient-to-br from-gray-50 to-slate-50",
    };
    return bgs[level] || "bg-gradient-to-br from-gray-50 to-slate-50";
  }

  const todayDateStr = today.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      {/* Card 1: Max Heat Index */}
      <div
        className={`${getHeatCardBg(
          maxHeatRisk
        )} rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Max Heat Index Today
          </h3>
        </div>
        <p
          className={`text-3xl font-bold ${
            getRiskColor(maxHeatRisk).split(" ")[1]
          }`}
        >
          {maxHeatIndex}°C
        </p>
        <p
          className={`mt-2 px-3 py-1 rounded-full text-sm font-medium inline-block ${getRiskColor(
            maxHeatRisk
          )}`}
        >
          {maxHeatRisk}
        </p>
        <p className="mt-2 text-sm text-gray-600">
          In {maxHeatLocation} on {todayDateStr}
        </p>
      </div>

      {/* Card 2: Max Temperature */}
      <div className="bg-linear-to-br from-red-50 to-rose-50 rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Max Temperature Today
          </h3>
        </div>
        <p className="text-3xl font-bold text-red-700">{maxTemp}°C</p>
        <p className="mt-2 text-sm text-gray-600">
          In {maxTempLocation} on {todayDateStr}
        </p>
      </div>

      {/* Card 3: Max Humidity */}
      <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Max Humidity Today
          </h3>
        </div>
        <p className="text-3xl font-bold text-blue-700">
          {maxHumidity}%
        </p>
        <p className="mt-2 text-sm text-gray-600">
          In {maxHumidityLocation} on {todayDateStr}
        </p>
      </div>

      {/* Card 4: Max Solar Radiation */}
      <div className="bg-linear-to-br from-yellow-50 to-amber-50 rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Max Solar Radiation Today
          </h3>
        </div>
        <p className="text-3xl font-bold text-yellow-700">
          {maxSolar} W/m²
        </p>
        <p className="mt-2 text-sm text-gray-600">
          In {maxSolarLocation} on {todayDateStr}
        </p>
      </div>
    </div>
  );
};

export default SummaryCards;