"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import {
  Wind, Flame, Thermometer, Activity, AlertTriangle,
  ChevronLeft, ChevronRight, Download, Filter, Search,
  CheckCircle, AlertCircle, XCircle, Minus, Database,
  ChevronsLeft, ChevronsRight,
} from "lucide-react";
import Navbar from "../NavBar/Navbar";
import Header from "@/app/Header/page";

/* =========================
   TYPES
========================= */
type SensorType = "all" | "dust" | "gas" | "co" | "co2" | "temp";

interface TableRow {
  type: SensorType;
  device_id: string;
  value?: number;
  temperature?: number;
  humidity?: number;
  status?: string;
  createdAt: string;
}

/* =========================
   SENSOR CONFIG
========================= */
const SENSOR_CONFIG: Record<string, {
  label: string;
  icon: React.ReactNode;
  unit: string;
  activeClass: string;
  pillClass: string;
  iconClass: string;
}> = {
  dust: {
    label: "Dust(Tiny particles,PM2.5)",
    icon: <Wind size={13} />,
    unit: "µg/m³",
    activeClass: "bg-blue-500 border-blue-600",
    pillClass: "bg-blue-50 text-blue-600",
    iconClass: "text-gray-800",
  },
  gas: {
    label: "NH3(Ammonia)",
    icon: <Flame size={13} />,
    unit: "ppm",
    activeClass: "bg-blue-500 border-blue-600",
    pillClass: "bg-blue-50 text-blue-600",
    iconClass: "text-gray-800",
  },
  co: {
    label: "CO(Carbon Monoxide)",
    icon: <AlertTriangle size={13} />,
    unit: "mg/m³",
    activeClass: "bg-blue-600 border-blue-600",
    pillClass: "bg-blue-50 text-blue-600",
    iconClass: "text-gray-800",
  },
  co2: {
    label: "CO₂(Carbon Dioxide)",
    icon: <Activity size={13} />,
    unit: "ppm",
  activeClass: "bg-blue-600 border-blue-600",
    pillClass: "bg-blue-50 text-blue-600",
    iconClass: "text-gray-800",
  },
  temp: {
    label: "Temperature",
    icon: <Thermometer size={13} />,
    unit: "°C",
     activeClass: "bg-blue-600 border-blue-600",
    pillClass: "bg-blue-50 text-blue-600",
    iconClass: "text-gray-800",
  },
};

const SENSOR_TABS: { value: SensorType; label: string }[] = [
  { value: "all",  label: "All Sensors" },
  { value: "dust", label: "Dust" },
  { value: "gas",  label: "NH3" },
  { value: "co",   label: "CO" },
  { value: "co2",  label: "CO₂" },
  { value: "temp", label: "Temperature" },
];

/* =========================
   STATUS BADGE
========================= */
const StatusBadge = ({ status }: { status?: string }) => {
  if (!status) return <span className="text-gray-400 text-xs">—</span>;

  const map: Record<string, { icon: React.ReactNode; cls: string }> = {
    Good:     { icon: <CheckCircle size={11} />, cls: "bg-green-50 text-green-700 border border-green-200" },
    Moderate: { icon: <AlertCircle size={11} />, cls: "bg-yellow-50 text-yellow-700 border border-yellow-200" },
    Poor:     { icon: <XCircle size={11} />,     cls: "bg-red-50 text-red-700 border border-red-200" },
  };

  const cfg = map[status] ?? { icon: <Minus size={11} />, cls: "bg-gray-50 text-gray-500 border border-gray-200" };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
      {cfg.icon}
      {status}
    </span>
  );
};

/* =========================
   SENSOR TYPE PILL
========================= */
const SensorPill = ({ type }: { type: string }) => {
  const cfg = SENSOR_CONFIG[type];
  if (!cfg) return <span className="text-sm text-gray-500">{type}</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.pillClass}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
};

/* =========================
   STAT CARD
========================= */
const StatCard = ({
  type, count, active, onClick,
}: {
  type: string; count: number; active: boolean; onClick: () => void;
}) => {
  const cfg = SENSOR_CONFIG[type];
  return (
    <button
      onClick={onClick}
      className={`flex flex-col gap-1.5 min-w-[110px] px-4 py-3 rounded-xl border text-left transition-all duration-150 outline-none cursor-pointer
        ${active
          ? `${cfg.activeClass} text-white shadow-md`
          : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
        }`}
    >
      <div className={`flex items-center gap-1.5 text-md font-semibold
        ${active ? "text-white/80" : cfg.iconClass}`}>
        {cfg.icon}
        <span>{cfg.label}</span>
      </div>
      <span className={`text-2xl font-bold tracking-tight ${active ? "text-white" : "text-gray-900"}`}>
        {count}
      </span>
      <span className={`text-[15px] ${active ? "text-white/60" : "text-gray-400"}`}>readings</span>
    </button>
  );
};

/* =========================
   VALUE CELL
========================= */
const ValueCell = ({ row }: { row: TableRow }) => {
  if (row.type === "temp") {
    return (
      <div className="flex gap-3 text-sm">
        <span>
          <span className="font-semibold text-gray-900">{row.temperature?.toFixed(1) ?? "--"}</span>
          <span className="text-gray-400 ml-0.5">°C</span>
        </span>
      
      </div>
    );
  }
  const cfg = SENSOR_CONFIG[row.type];
  return (
    <span className="text-sm">
      <span className="font-semibold text-gray-900">{row.value?.toFixed(1) ?? "--"}</span>
      <span className="text-gray-400 ml-1 text-xs">{cfg?.unit}</span>
    </span>
  );
};

/* =========================
   MAIN COMPONENT
========================= */
export default function SensorReport() {
  const [selectedSensor, setSelectedSensor] = useState<SensorType>("all");

  const [pageSize] = useState(10);

  const [dustData, setDustData] = useState<any[]>([]);
  const [gasData,  setGasData]  = useState<any[]>([]);
  const [coData,   setCoData]   = useState<any[]>([]);
  const [co2Data,  setCo2Data]  = useState<any[]>([]);
  const [airData,  setAirData]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  /* FETCH */
  useEffect(() => {
    Promise.all([
      fetch("http://localhost:5000/api/air/dust").then(r => r.json()),
      fetch("http://localhost:5000/api/air/gas").then(r => r.json()),
      fetch("http://localhost:5000/api/air/co").then(r => r.json()),
      fetch("http://localhost:5000/api/air/co2").then(r => r.json()),
      fetch("http://localhost:5000/api/air/air-quality").then(r => r.json()),
    ])
      .then(([dust, gas, co, co2, air]) => {
        setDustData(dust); setGasData(gas); setCoData(co);
        setCo2Data(co2);   setAirData(air); setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  /* NORMALIZE */
  const tableData: TableRow[] = useMemo(() => {
    const dust = dustData.map(d => ({ type: "dust" as const, device_id: d.device_id, value: d.dust_density, status: d.air_status, createdAt: d.createdAt || d.recorded_at }));
    const gas  = gasData.map(g  => ({ type: "gas"  as const, device_id: g.device_id, value: g.gas_ppm,      status: g.air_status, createdAt: g.createdAt || g.recorded_at }));
    const co   = coData.map(c   => ({ type: "co"   as const, device_id: c.device_id, value: c.co_value,     status: c.status,     createdAt: c.createdAt || c.recorded_at }));
    const co2  = co2Data.map(c  => ({ type: "co2"  as const, device_id: c.device_id, value: c.eco2,         status: c.status,     createdAt: c.createdAt || c.recorded_at }));
    const temp = airData.map(a  => ({ type: "temp" as const, device_id: a.device_id, temperature: a.temperature, humidity: a.humidity, createdAt: a.createdAt || a.recorded_at }));
    return [...dust, ...gas, ...co, ...co2, ...temp].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [dustData, gasData, coData, co2Data, airData]);

  /* COUNTS */
  const counts = useMemo(() => ({
    dust: dustData.length, gas: gasData.length,
    co: coData.length, co2: co2Data.length, temp: airData.length,
  }), [dustData, gasData, coData, co2Data, airData]);

  /* FILTER */
 const filteredData = useMemo(() => {
  return selectedSensor === "all"
    ? tableData
    : tableData.filter(r => r.type === selectedSensor);
}, [tableData, selectedSensor]);

  /* COLUMNS */
  const columns = useMemo<ColumnDef<TableRow>[]>(() => {
    const base: ColumnDef<TableRow>[] = [
      {
        id: "type",
        header: "Sensor",
        cell: ({ row }) => <SensorPill type={row.original.type} />,
      },
      {
        accessorKey: "device_id",
        header: "Device ID",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
            {getValue() as string}
          </span>
        ),
      },
      {
        id: "value",
        header: "Reading",
        cell: ({ row }) => <ValueCell row={row.original} />,
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "createdAt",
        header: "Timestamp",
        cell: ({ getValue }) => {
          const d = new Date(getValue() as string);
          return (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium text-gray-900">
                {d.toLocaleDateString([], { month: "short", day: "2-digit", year: "numeric" })}
              </span>
              <span className="text-[11px] text-gray-400">
                {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </div>
          );
        },
      },
    ];

    return base.filter(c => {
      if (selectedSensor === "temp" && (c as any).id === "status") return false;
      if (selectedSensor !== "all" && (c as any).id === "type") return false;
      return true;
    });
  }, [selectedSensor]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize } },
  });

  /* EXPORT CSV */
  const exportCSV = () => {
    const headers = ["Type", "Device ID", "Value", "Temperature", "Humidity", "Status", "Timestamp"];
    const rows = filteredData.map(r =>
      [r.type, r.device_id, r.value ?? "", r.temperature ?? "", r.humidity ?? "", r.status ?? "", r.createdAt].join(",")
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sensor-report-${selectedSensor}-${Date.now()}.csv`;
    a.click();
  };

  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();

  return (
    <div className="min-h-screen bg-slate-50">
        <Header />
      {/* ── NAV ── */}
         <Navbar />  

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── PAGE HEADER ── */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-1">Sensor Report</h1>
          <p className="text-md text-gray-800">
            Historical readings across all environmental sensors · Filtered &amp; paginated
          </p>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="flex flex-wrap gap-5 mb-7">
          {Object.keys(SENSOR_CONFIG).map(key => (
            <StatCard
              key={key}
              type={key}
              count={counts[key as keyof typeof counts]}
              active={selectedSensor === key}
              onClick={() => setSelectedSensor(selectedSensor === key ? "all" : key as SensorType)}
            />
          ))}
        </div>

        {/* ── CONTROLS BAR ── */}
        <div className="bg-white border border-gray-200 rounded-t-xl px-4 py-3.5 flex items-center justify-between flex-wrap gap-3">

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            {SENSOR_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setSelectedSensor(tab.value)}
                className={`px-3 py-1.5 rounded-md text-[15px] transition-all outline-none cursor-pointer
                  ${selectedSensor === tab.value
                    ? "bg-white text-gray-900 shadow-sm font-semibold"
                    : "text-gray-500 hover:text-gray-700 font-medium"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
           

            {/* Export */}
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600
                border border-gray-200 rounded-lg bg-white hover:bg-gray-50 hover:border-gray-300
                transition-all outline-none cursor-pointer"
            >
              <Download size={12} />
              Export CSV
            </button>

            {/* Count badge */}
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full whitespace-nowrap">
              {filteredData.length} records
            </span>
          </div>
        </div>

        {/* ── TABLE ── */}
        <div className="bg-white border border-gray-200 border-t-0 overflow-x-auto">
          <table className="w-full border-collapse min-w-[640px]">
            <thead>
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id} className="border-b border-gray-200">
                  {hg.headers.map(header => (
                    <th
                      key={header.id}
                      className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 whitespace-nowrap"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: 7 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div
                          className="h-3 rounded bg-gray-100 animate-pulse"
                          style={{ width: [80, 110, 60, 70, 110][j] }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Filter size={24} className="text-gray-300" />
                      <span className="text-sm text-gray-400">No records match your filter</span>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row, i) => (
                  <tr
                    key={row.id}
                    className={`border-b border-gray-100 transition-colors duration-75 cursor-default
                      hover:bg-blue-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-4 py-3 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext()) ?? (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION ── */}
        <div className="bg-white border border-gray-200 border-t-0 rounded-b-xl px-4 py-3 flex items-center justify-between flex-wrap gap-2">

          <span className="text-xs text-gray-500">
            Showing{" "}
            <strong className="text-gray-900">
              {pageIndex * pageSize + 1}–{Math.min((pageIndex + 1) * pageSize, filteredData.length)}
            </strong>{" "}
            of <strong className="text-gray-900">{filteredData.length}</strong> records
          </span>

          <div className="flex items-center gap-1">
            {[
              { icon: <ChevronsLeft size={14} />, action: () => table.setPageIndex(0),             disabled: !table.getCanPreviousPage() },
              { icon: <ChevronLeft size={14} />,  action: () => table.previousPage(),              disabled: !table.getCanPreviousPage() },
              { icon: <ChevronRight size={14} />, action: () => table.nextPage(),                  disabled: !table.getCanNextPage() },
              { icon: <ChevronsRight size={14} />,action: () => table.setPageIndex(pageCount - 1),disabled: !table.getCanNextPage() },
            ].map((btn, i) => (
              <button
                key={i}
                onClick={btn.action}
                disabled={btn.disabled}
                className={`w-8 h-8 flex items-center justify-center rounded-md border text-sm transition-all outline-none
                  ${btn.disabled
                    ? "border-gray-200 text-gray-300 cursor-not-allowed"
                    : "border-gray-200 text-gray-600 hover:bg-gray-100 cursor-pointer"
                  }`}
              >
                {btn.icon}
              </button>
            ))}

            <div className="flex items-center gap-1 ml-2 pl-2 border-l border-gray-200">
              {Array.from({ length: pageCount }, (_, i) => i)
                .slice(Math.max(0, pageIndex - 2), Math.min(pageCount, pageIndex + 3))
                .map(pg => (
                  <button
                    key={pg}
                    onClick={() => table.setPageIndex(pg)}
                    className={`w-7 h-7 rounded-md text-xs font-medium border outline-none cursor-pointer transition-all
                      ${pageIndex === pg
                        ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                        : "border-gray-200 text-gray-600 hover:bg-gray-100"
                      }`}
                  >
                    {pg + 1}
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="mt-8 pt-5 border-t border-gray-200 flex flex-wrap gap-5 items-center">
          <span className="text-xs text-gray-400 font-medium">Sensor Units:</span>
          {Object.entries(SENSOR_CONFIG).map(([key, cfg]) => (
            <span key={key} className="flex items-center gap-1.5 text-xs">
              <span className={cfg.iconClass}>{cfg.icon}</span>
              <span className="text-gray-700 font-medium">{cfg.label}</span>
              <span className="text-gray-400">{cfg.unit}</span>
            </span>
          ))}
        </div>

      </div>
    </div>
  );
}
