"use client";
import { useEffect, useState } from "react";
import { Thermometer, Droplets, Activity, TrendingUp, Clock } from "lucide-react";

interface SensorData {
  id: number;
  device_id: string;
  temperature: string;
  humidity: string;
  heat_index: string;
  risk_level: string;
}

export default function LiveMonitoringCard() {
  const [data, setData] = useState<SensorData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/sensors/latest");
      const json = await res.json();
      // Get the first sensor or aggregate data as needed
      setData(json[0] || null);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  const getRiskConfig = (riskLevel: string) => {
    const level = riskLevel?.toLowerCase();

    const configs: Record<string, {
      gradient: string;
      badge: string;
      iconColor: string;
      borderColor: string;
    }> = {
      "normal": {
        gradient: "from-emerald-500 to-green-500",
        badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
        iconColor: "text-emerald-600",
        borderColor: "border-emerald-200"
      },
      "caution": {
        gradient: "from-yellow-500 to-amber-500",
        badge: "bg-yellow-100 text-yellow-800 border-yellow-300",
        iconColor: "text-yellow-600",
        borderColor: "border-yellow-200"
      },
      "extreme caution": {
        gradient: "from-orange-500 to-red-500",
        badge: "bg-orange-100 text-orange-800 border-orange-300",
        iconColor: "text-orange-600",
        borderColor: "border-orange-200"
      },
      "danger": {
        gradient: "from-red-500 to-rose-600",
        badge: "bg-red-100 text-red-800 border-red-300",
        iconColor: "text-red-600",
        borderColor: "border-red-300"
      },
      "extreme danger": {
        gradient: "from-red-600 to-rose-700",
        badge: "bg-red-200 text-red-900 border-red-400",
        iconColor: "text-red-700",
        borderColor: "border-red-400"
      }
    };

    return configs[level] || {
      gradient: "from-slate-500 to-gray-500",
      badge: "bg-slate-100 text-slate-800 border-slate-300",
      iconColor: "text-slate-600",
      borderColor: "border-slate-200"
    };
  };

  const getTimeAgo = (date: Date | null): string => {
    if (!date) return "Waiting for data...";
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 2) return "Just now";
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return date.toLocaleTimeString();
  };

  if (!data) {
    return (
      <div className="w-full bg-white rounded-3xl shadow-lg border-2 border-slate-200 p-8">
        <div className="flex items-center justify-center gap-3 text-slate-400">
          <Activity className="animate-pulse" size={24} />
          <span className="text-lg font-semibold">Loading sensor data...</span>
        </div>
      </div>
    );
  }

  const config = getRiskConfig(data.risk_level);

  return (
    <div className={`w-full bg-white rounded-3xl shadow-xl border-2 ${config.borderColor} overflow-hidden transition-all duration-300 hover:shadow-2xl`}>
      
      {/* Header */}
      <div className="bg-linear-to-r from-slate-50 to-slate-100 px-8 py-4 border-b-2 border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`absolute inset-0 bg-linear-to-br ${config.gradient} rounded-xl blur-md opacity-40 animate-pulse`}></div>
              <div className={`relative bg-linear-to-br ${config.gradient} p-3 rounded-xl shadow-lg`}>
                <Activity size={24} className="text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-slate-900 font-bold text-xl">Live Environmental Data</h2>
              <p className="text-slate-500 text-sm">Real-time monitoring system</p>
            </div>
          </div>

          {/* Live Status Badge */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border-2 border-emerald-200 shadow-sm">
            <div className="relative w-2.5 h-2.5">
              <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping"></div>
              <div className="relative w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
            </div>
            <span className="text-emerald-700 text-sm font-bold">LIVE</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          
          {/* Temperature */}
          <MetricCard
            icon={<Thermometer size={28} className={config.iconColor} />}
            label="Temperature"
            value={`${data.temperature}°C`}
            gradient={config.gradient}
            large
          />

          {/* Humidity */}
          <MetricCard
            icon={<Droplets size={28} className="text-blue-600" />}
            label="Humidity"
            value={`${data.humidity}%`}
            gradient="from-blue-500 to-cyan-500"
          />

          {/* Heat Index */}
          <MetricCard
            icon={<TrendingUp size={28} className="text-orange-600" />}
            label="Heat Index"
            value={`${data.heat_index}°C`}
            gradient="from-orange-500 to-amber-500"
          />

          {/* Risk Level */}
          <div className="bg-linear-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border-2 border-slate-200 flex flex-col justify-between shadow-md hover:shadow-lg transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${config.gradient} flex items-center justify-center shadow-md`}>
                <Activity size={20} className="text-white" />
              </div>
              <span className="text-slate-600 font-semibold text-sm">Risk Level</span>
            </div>
            <div>
              <span className={`inline-block px-4 py-2 rounded-xl text-sm font-bold border-2 ${config.badge} shadow-sm`}>
                {data.risk_level}
              </span>
            </div>
          </div>

          {/* Last Update */}
          <div className="bg-linear-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border-2 border-slate-200 flex flex-col justify-between shadow-md hover:shadow-lg transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-md">
                <Clock size={20} className="text-white" />
              </div>
              <span className="text-slate-600 font-semibold text-sm">Last Update</span>
            </div>
            <div>
              <p className="text-slate-900 font-bold text-lg">{getTimeAgo(lastUpdate)}</p>
              {lastUpdate && (
                <p className="text-slate-500 text-xs mt-1">
                  {lastUpdate.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  gradient: string;
  large?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, gradient, large = false }) => (
  <div className="bg-linear-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border-2 border-slate-200 flex flex-col justify-between shadow-md hover:shadow-lg transition-all">
    <div className="flex items-center gap-3 mb-3">
      <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${gradient} flex items-center justify-center shadow-md`}>
        {icon}
      </div>
      <span className="text-slate-600 font-semibold text-sm">{label}</span>
    </div>
    <div>
      <p className={`text-slate-900 font-black ${large ? 'text-3xl' : 'text-2xl'}`}>
        {value}
      </p>
    </div>
  </div>
);