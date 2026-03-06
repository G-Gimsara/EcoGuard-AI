"use client";
import { useEffect, useState } from "react";

export default function HeatSensor() {
  const [data, setData] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/sensors/latest");
      const json = await res.json();
      setData(json);
      setLastUpdate(new Date().toLocaleString());
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  const getRiskCardBg = (riskLevel) => {
    const level = riskLevel?.toLowerCase();

    switch (level) {
      case "normal":
        return "bg-gradient-to-br from-green-50 to-emerald-50";

      case "caution":
        return "bg-gradient-to-br from-yellow-50 to-amber-50";

      case "extreme caution":
        return "bg-gradient-to-br from-orange-50 to-orange-100";

      case "danger":
        return "bg-gradient-to-br from-red-50 to-rose-100";

      case "extreme danger":
        return "bg-gradient-to-br from-red-100 to-red-200";

      default:
        return "bg-gradient-to-br from-gray-50 to-slate-50";
    }
  };

  const getRiskTextColor = (riskLevel) => {
    const level = riskLevel?.toLowerCase();

    switch (level) {
      case "normal":
        return "text-green-800";

      case "caution":
        return "text-yellow-800";

      case "extreme caution":
        return "text-orange-800";

      case "danger":
        return "text-red-700";

      case "extreme danger":
        return "text-red-900";

      default:
        return "text-gray-800";
    }
  };

  const getRiskBadge = (riskLevel) => {
    const level = riskLevel?.toLowerCase();

    switch (level) {
      case "normal":
        return "bg-green-100 text-green-800";

      case "caution":
        return "bg-yellow-100 text-yellow-800";

      case "extreme caution":
        return "bg-orange-100 text-orange-800";

      case "danger":
        return "bg-red-100 text-red-700";

      case "extreme danger":
        return "bg-red-200 text-red-900";

      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
      {data.map((item) => (
        <div
          key={item.id}
          className={`${getRiskCardBg(
            item.risk_level
          )} rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Live</h3>
          </div>

          <p className={`text-3xl font-bold ${getRiskTextColor(item.risk_level)}`}>
            {item.temperature}°C
          </p>

          <p
            className={`mt-2 px-3 py-1 rounded-full text-sm font-medium inline-block ${getRiskBadge(
              item.risk_level
            )}`}
          >
            {item.risk_level}
          </p>

          <p className="mt-2 text-sm text-gray-600">
            Device {item.device_id} • Humidity {item.humidity}%
          </p>

          <p className="mt-1 text-sm text-gray-600">
            Heat Index {item.heat_index}
          </p>

          {lastUpdate && (
            <p className="mt-2 text-xs text-gray-500">{lastUpdate}</p>
          )}
        </div>
      ))}
    </div>
  );
}