"use client";

import React, { useEffect, useRef, useState } from "react";
import Header from "@/app/Header/page";
import Navbar from "../NavBar/Navbar";
import Image from "next/image";
import Qrcode from "@/app/Images/qr.jpeg";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";

/* ────────────────────────────────
   TYPES
──────────────────────────────── */
interface AirReading {
  device_id: string;
  dust_density?: number;
  gas_ppm?: number;
  temperature?: number;
  humidity?: number;
  co_value?: number;
  eco2?: number;
  air_status?: string;
  status?: string;
  recorded_at?: string;
  timestamp?: string;
}

interface ChartPoint {
  time: string;
  [key: string]: number | string;
}

/* ────────────────────────────────
   HELPERS
──────────────────────────────── */
const readingTime = (r: AirReading) =>
  new Date(r.recorded_at || r.timestamp || Date.now()).getTime();

/* ────────────────────────────────
   STATUS THEME SYSTEM
──────────────────────────────── */
type StatusType = "Good" | "Moderate" | "Poor" | null | undefined;

const statusTheme = (status?: StatusType) => {
  if (status === "Good")
    return {
      card: "bg-emerald-50 border-emerald-300",
      value: "text-emerald-900",
      badge: "bg-emerald-100 text-emerald-800",
      chart: "#1D9E75",
      chartBg: "rgba(29,158,117,0.08)",
      dot: "bg-emerald-500"
    };
  if (status === "Moderate")
    return {
      card: "bg-amber-50 border-amber-300",
      value: "text-amber-900",
      badge: "bg-amber-100 text-amber-800",
      chart: "#BA7517",
      chartBg: "rgba(186,117,23,0.08)",
      dot: "bg-amber-500"
    };
  if (status === "Poor")
    return {
      card: "bg-red-50 border-red-300",
      value: "text-red-900",
      badge: "bg-red-100 text-red-800",
      chart: "#A32D2D",
      chartBg: "rgba(163,45,45,0.08)",
      dot: "bg-red-500"
    };
  return {
    card: "bg-blue-50 border-blue-300",
    value: "text-blue-900",
    badge: "bg-blue-100 text-blue-800",
    chart: "#2563eb",
    chartBg: "rgba(37,99,235,0.08)",
    dot: "bg-blue-500"
  };
};

/* ────────────────────────────────
   QR ACCESS STRIP
──────────────────────────────── */
const QRAccessStrip: React.FC = () => (
  <div className="bg-white border border-gray-200 mb-4 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center gap-6">
    <div className="flex-shrink-0">
      <Image
        src={Qrcode}
        alt="QR Code"
        width={180}
        height={180}
        className="rounded-xl border border-gray-200"
      />

      <p className="text-center text-[11px] text-black mt-2 font-mono">
        Scan to access dashboard
      </p>
    </div>
    {/* DETAILS */}
    <div className="flex-1 min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-black font-mono">
        Real-time Air Monitoring
      </p>

      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">
        AI Air Health Assistant & Live Alerts
      </h2>

      <p className="text-gray-800 mt-3 leading-relaxed">
        Scan this QR code to access a smart system with real-time alerts,
        self-registration, and chatbot-assisted insights.
      </p>

      {/* FEATURE TAGS */}
      <div className="flex flex-wrap gap-2 mt-4">
        <span className="text-md bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
          🌍 Real-time data
        </span>
        <span className="text-md bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
          🫁 Health insights
        </span>
        <span className="text-md bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
          ⚠️ Alerts system
        </span>
      </div>

      {/* EXTRA INFO */}
      <div className="mt-5 text-md text-gray-500">
        💡 Provides air quality status + health recommendations based on sensor
        data
      </div>
    </div>
  </div>
);
/* ────────────────────────────────
   SENSOR CARD
──────────────────────────────── */

const AQI_RANGES = {
  dust: {
    Good: "0–60",
    Moderate: "61–120",
    Poor: ">120",
    unit: "µg/m³"
  },
  co: {
    Good: "0–2",
    Moderate: "2.1–17",
    Poor: ">17",
    unit: "mg/m³"
  },
  co2: {
    Good: "300–1000",
    Moderate: "1001–5000",
    Poor: ">5000",
    unit: "ppm"
  },
  nh3: {
    Good: "0–70",
    Moderate: "70–300",
    Poor: ">300",
    unit: "ppm"
  }
};
interface SensorCardProps {
  icon: React.ReactNode;
  title: string;
  value?: number | null;
  unit: string;
  status?: StatusType;
  rangeKey?: keyof typeof AQI_RANGES;
}

const SensorCard: React.FC<SensorCardProps> = ({
  icon,
  title,
  value,
  unit,
  status,
  rangeKey
}) => {
  const theme = statusTheme(status);
  return (
    <div
      className={`rounded-2xl border-2 p-5 shadow-sm transition-all duration-300 relative overflow-hidden ${theme.card}`}
    >
      <div
        className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-10 ${theme.dot}`}
      />
      <div className="flex justify-between items-start mb-4">
        <div className="text-gray-600">{icon}</div>
        {status && (
          <span
            className={`text-[15px] font-bold px-2 py-0.5 rounded-full tracking-wide ${theme.badge}`}
          >
            {status}
          </span>
        )}
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-800 font-mono mb-2">
        {title}
      </p>
      <p className={`text-3xl font-bold  font-mono mt-1 ${theme.value}`}>
        {value != null ? value.toFixed(1) : "--"}
        <span className="text-sm font-normal ml-1 opacity-90">{unit}</span>
      </p>

      <p className="text-sm text-gray-800  mt-1">
        {unit === "ppm" && "(Parts per million)"}
        {unit === "µg/m³" && "(Micrograms per cubic meter)"}
        {unit === "°C" && "(Celsius)"}
        {unit === "mg/m³" && "(Milligrams per cubic meter)"}
      </p>

      {rangeKey && AQI_RANGES[rangeKey] && (
        <div className="mt-3 text-[11px] font-mono text-gray-700 space-y-1">
          <div>
            <span className="text-emerald-600 font-semibold">Good:</span>{" "}
            {AQI_RANGES[rangeKey].Good} {AQI_RANGES[rangeKey].unit}
          </div>
          <div>
            <span className="text-amber-600 font-semibold">Moderate:</span>{" "}
            {AQI_RANGES[rangeKey].Moderate} {AQI_RANGES[rangeKey].unit}
          </div>
          <div>
            <span className="text-red-600 font-semibold">Poor:</span>{" "}
            {AQI_RANGES[rangeKey].Poor} {AQI_RANGES[rangeKey].unit}
          </div>
        </div>
      )}
    </div>
  );
};

/* ────────────────────────────────
   CHART CARD
──────────────────────────────── */
interface ChartCardProps {
  title: string;
  unit: string;
  data: ChartPoint[];
  dataKey: string;
  status?: StatusType;
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  unit,
  data,
  dataKey,
  status
}) => {
  const theme = {
    chart: "#3b82f6",
    chartBg: "rgba(37,99,235,0.08)",
    dot: "bg-blue-500"
  };

  const gradientId = `gradient-${dataKey}`;
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2.5 h-2.5 rounded-full ${theme.dot}`} />
        <h2 className="text-[13px] font-semibold text-gray-800 uppercase tracking-widest font-mono">
          {title}
          <span className="ml-1 text-gray-800 font-sans">({unit})</span>
        </h2>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[200px] text-sm font-mono text-gray-800">
          No data in last 5 min
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart
            data={data}
            margin={{ top: 4, right: 12, left: 0, bottom: 4 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.chart} stopOpacity={0.18} />
                <stop offset="95%" stopColor={theme.chart} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: "#111827", fontFamily: "monospace" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#111827", fontFamily: "monospace" }}
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={(v: number) => v.toFixed(1)}
            />
            <Tooltip
              contentStyle={{
                background: "#fff",
                border: `1.5px solid ${theme.chart}55`,
                borderRadius: "10px",
                fontSize: "13px",
                fontFamily: "monospace",
                padding: "10px 14px",
                boxShadow: `0 4px 16px ${theme.chart}22`
              }}
              labelStyle={{
                color: "#374151",
                fontWeight: 600,
                marginBottom: 4
              }}
              itemStyle={{ color: theme.chart }}
              formatter={(value) => {
                const formattedValue =
                  typeof value === "number" ? value.toFixed(2) : "--";
                return [`${formattedValue} ${unit}`, title];
              }}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={theme.chart}
              strokeWidth={2.5}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 5, fill: theme.chart, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

/* ────────────────────────────────
   SECTION DIVIDER
──────────────────────────────── */
const SectionLabel: React.FC<{ children: React.ReactNode }> = ({
  children
}) => (
  <div className="flex items-center gap-3 mb-4">
    <span className="text-[15px] font-semibold uppercase tracking-widest text-gray-800 font-sans whitespace-nowrap">
      {children}
    </span>
    <div className="flex-1 h-px bg-gray-200" />
  </div>
);

/* ────────────────────────────────
   MAIN DASHBOARD
──────────────────────────────── */
export default function Dashboard() {
  const [latestDust, setLatestDust] = useState<AirReading | null>(null);
  const [latestGas, setLatestGas] = useState<AirReading | null>(null);
  const [latestTemp, setLatestTemp] = useState<AirReading | null>(null);
  const [latestCO, setLatestCO] = useState<AirReading | null>(null);
  const [latestCO2, setLatestCO2] = useState<AirReading | null>(null);

  const [dustH, setDustH] = useState<AirReading[]>([]);
  const [gasH, setGasH] = useState<AirReading[]>([]);
  const [tempH, setTempH] = useState<AirReading[]>([]);
  const [coH, setCoH] = useState<AirReading[]>([]);
  const [co2H, setCo2H] = useState<AirReading[]>([]);

  /* ── Initial fetch ── */
  useEffect(() => {
    fetch("http://localhost:5000/api/air/dust")
      .then((r) => r.json())
      .then((d) => {
        setLatestDust(d[0]);
        setDustH(d);
      });

    fetch("http://localhost:5000/api/air/gas")
      .then((r) => r.json())
      .then((d) => {
        setLatestGas(d[0]);
        setGasH(d);
      });

    fetch("http://localhost:5000/api/air/air-quality")
      .then((r) => r.json())
      .then((d) => {
        setLatestTemp(d[0]);
        setTempH(d);
      });

    fetch("http://localhost:5000/api/air/co")
      .then((r) => r.json())
      .then((d) => {
        setLatestCO(d[0]);
        setCoH(d);
      });

    fetch("http://localhost:5000/api/air/co2")
      .then((r) => r.json())
      .then((d) => {
        setLatestCO2(d[0]);
        setCo2H(d);
      });
  }, []);

  /* ── WebSocket ── */
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:5000");

    ws.onmessage = (event) => {
      const m = JSON.parse(event.data);

      if (m.type === "DUST_DATA") {
        setLatestDust(m.data);
        setDustH((p) => [...p.slice(-49), m.data]);
      }
      if (m.type === "GAS_DATA") {
        setLatestGas(m.data);
        setGasH((p) => [...p.slice(-49), m.data]);
      }
      if (m.type === "AIR_QUALITY") {
        setLatestTemp(m.data);
        setTempH((p) => [...p.slice(-49), m.data]);
      }
      if (m.type === "CO_DATA") {
        setLatestCO(m.data);
        setCoH((p) => [...p.slice(-49), m.data]);
      }
      if (m.type === "IAQ_DATA") {
        setLatestCO2(m.data);
        setCo2H((p) => [...p.slice(-49), m.data]);
      }
    };

    return () => ws.close();
  }, []);

  const last5min = Date.now() - 5 * 60 * 1000;

  // AFTER (fixed)
  const mapChart = (arr: AirReading[], key: string): ChartPoint[] =>
    arr
      .filter((d) => readingTime(d) >= last5min)
      .map((d) => ({
        time: new Date(readingTime(d)).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        }),
        [key]: (d as unknown as Record<string, unknown>)[key] as number
      }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Page heading */}
        <div className="mb-8">
          <p className="text-[15px] font-semibold uppercase tracking-widest text-gray-800 font-sans mb-1">
            Real-time monitoring
          </p>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            Air Quality Dashboard
          </h1>
        </div>

        {/* ── SENSOR CARDS ── */}
        <SectionLabel>Sensor status</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <SensorCard
            icon={
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
              </svg>
            }
            title="Dust(Tiny particles)"
            value={latestDust?.dust_density}
            unit="µg/m³"
            status={latestDust?.air_status as StatusType}
            rangeKey="dust"
          />

          <SensorCard
            icon={
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
              </svg>
            }
            title="NH3(Ammonia)"
            value={latestGas?.gas_ppm}
            unit="ppm"
            status={latestGas?.air_status as StatusType}
            rangeKey="nh3"
          />

          <SensorCard
            icon={
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4l3 3" />
              </svg>
            }
            title="CO(Carbon Monoxide)"
            value={latestCO?.co_value}
            unit="mg/m³"
            status={latestCO?.status as StatusType}
            rangeKey="co"
          />

          <SensorCard
            icon={
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M2 12h6m4 0h10M8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0z" />
              </svg>
            }
            title="CO₂(Carbon Dioxide)"
            value={latestCO2?.eco2}
            unit="ppm"
            status={latestCO2?.status as StatusType}
            rangeKey="co2"
          />

          <SensorCard
            icon={
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
              </svg>
            }
            title="Temperature"
            value={latestTemp?.temperature}
            unit="°C"
            status={undefined}
          />
        </div>

        {/* ── QR ACCESS STRIP ── */}
        <SectionLabel>Quick access</SectionLabel>
        <QRAccessStrip />

        {/* ── CHARTS ── */}
        <SectionLabel>Trend charts — last 5 min</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <ChartCard
            title="Dust(Tiny particles)"
            unit="µg/m³"
            data={mapChart(dustH, "dust_density")}
            dataKey="dust_density"
            status={latestDust?.air_status as StatusType}
          />

          <ChartCard
            title="NH3(Ammonia)"
            unit="ppm"
            data={mapChart(gasH, "gas_ppm")}
            dataKey="gas_ppm"
            status={latestGas?.air_status as StatusType}
          />

          <ChartCard
            title="Temperature"
            unit="°C"
            data={mapChart(tempH, "temperature")}
            dataKey="temperature"
            status={undefined}
          />

          <ChartCard
            title="CO(Carbon Monoxide)"
            unit="mg/m³"
            data={mapChart(coH, "co_value")}
            dataKey="co_value"
            status={latestCO?.status as StatusType}
          />

          <div className="md:col-span-2">
            <ChartCard
              title="CO₂(Carbon Dioxide)"
              unit="ppm"
              data={mapChart(co2H, "eco2")}
              dataKey="eco2"
              status={latestCO2?.status as StatusType}
            />
          </div>
        </div>
      </div>

      {/* ── FOOTER WITH REFERENCES ── */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-4">
          {/* Top Row */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
           

            <div className="flex items-center gap-4 text-xs text-gray-800">
              <span>Real-time Sensors</span>
              <span>•</span>
              <span>Health Alerts</span>
              <span>•</span>
              <span>AI Assistant</span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-200" />

          {/* References Section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              References
            </h3>

            <ul className="text-xs text-gray-600 space-y-1">
              <li>
                Good, Moderate, Poor range guideline – public research paper
                <a
                  href="https://pmc.ncbi.nlm.nih.gov/articles/PMC9676776/#Tab3"
                  target="_blank"
                  className="text-blue-600 hover:underline ml-1"
                >
                  https://pmc.ncbi.nlm.nih.gov/articles/PMC9676776/#Tab3
                </a>
              </li>

              <li>
                India's CPCB National AQI (NAQI) standards
                <a
                  href="http://www.airquality.cpcb.gov.in/ccr_docs/About_AQI.pdf"
                  target="_blank"
                  className="text-blue-600 hover:underline ml-1"
                >
                  http://www.airquality.cpcb.gov.in/ccr_docs/About_AQI.pdf
                </a>
              </li>
              <li>
                Good, Moderate, Poor range guideline – Co2 (CARBON DIOXIDE)
                <a
                  href="https://www.ashrae.org/file%20library/about/position%20documents/pd-on-indoor-carbon-dioxide-english.pdf"
                  target="_blank"
                  className="text-blue-600 hover:underline ml-1"
                >
                  https://www.ashrae.org/file%20library/about/position%20documents/pd-on-indoor-carbon-dioxide-english.pdf
                </a>
              </li>

              <li>
                CO, NH₃, CO₂, PM2.5, temperature — human health effects
                <a
                  href="https://fir-8506f.web.app/reference"
                  target="_blank"
                  className="text-blue-600 hover:underline ml-1"
                >
                  https://fir-8506f.web.app/reference
                </a>
              </li>
              <li>
                Watch a real-time practical video with sensor accuracy.
                <a
                  href="https://fir-8506f.web.app/reference"
                  target="_blank"
                  className="text-blue-600 hover:underline ml-1"
                >
                  https://fir-8506f.web.app/reference
                </a>
              </li>

              <li>
                Sensor Data: Local IoT Devices (MQ 7, DHT11, MQ 135, ENS160,
                DUST Sensor)
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
