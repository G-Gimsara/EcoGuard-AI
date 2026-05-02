"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

type LayerKey = "heat_index" | "tempmax" | "humidity";
type SwatchKey =
  | "bg-emerald-100"
  | "bg-amber-200"
  | "bg-orange-500"
  | "bg-red-600"
  | "bg-purple-700"
  | "bg-slate-100"
  | "bg-blue-100"
  | "bg-blue-300"
  | "bg-blue-600"
  | "bg-blue-800";

type HeatDataRow = {
  location: string;
  tempmax: string;
  humidity: string;
  heat_index: string;
  [key: string]: unknown;
};

type HeatRiskMapClientProps = {
  data?: HeatDataRow[];
};

type LegendItem = {
  label: string;
  range: string;
  color: SwatchKey;
};

type LayerMeta = {
  label: string;
  unit: string;
  theme: string;
  legend: LegendItem[];
};

const LAYER_CONFIG = {
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
} satisfies Record<LayerKey, LayerMeta>;

const SWATCH_COLOR = {
  "bg-emerald-100": "#A7F3D0",
  "bg-amber-200": "#FCD34D",
  "bg-orange-500": "#f97316",
  "bg-red-600": "#dc2626",
  "bg-purple-700": "#6d28d9",
  "bg-slate-100": "#f1f5f9",
  "bg-blue-100": "#dbeafe",
  "bg-blue-300": "#93c5fd",
  "bg-blue-600": "#2563eb",
  "bg-blue-800": "#1e40af",
} satisfies Record<SwatchKey, string>;

export default function HeatRiskMapClient({ data = [] }: HeatRiskMapClientProps) {
  const mapRef = useRef<any | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const geoLayerRef = useRef<any | null>(null);
  const markersRef = useRef<any[]>([]);
  const labelMarkersRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState<LayerKey>("heat_index");

  const normalize = (str?: string) => str?.toLowerCase().replace(/\s+/g, "").replace("district", "").trim();

  const getColorByTemp = (temp: number | string) => {
    const t = Number(temp);
    if (t >= 38) return "#6B21A8";
    if (t >= 33) return "#DC2626";
    if (t >= 29) return "#F97316";
    if (t >= 24) return "#FCD34D";
    return "#A7F3D0";
  };

 const getColorByHeatIndex = (value: number | string) => {
  const v = Number(value);
  if (v >= 51) return "#5B21B6"; // medium purple (not too dark)
  if (v >= 41) return "#B91C1C"; // balanced red
  if (v >= 33) return "#EA580C"; // vivid orange
  if (v >= 27) return "#F59E0B"; // warm amber (better than pale yellow)
  return "#10B981"; // fresh green
};

  const getColorByHumidity = (value: number | string) => {
    const v = Number(value);
    if (v >= 85) return "#1E40AF";
    if (v >= 76) return "#2563EB";
    if (v >= 61) return "#93C5FD";
    if (v >= 40) return "#DBEAFE";
    return "#F1F5F9";
  };

  const getLayerValue = (row: HeatDataRow | undefined, layer: LayerKey) => {
    if (!row) return null;
    const raw = layer === "tempmax" ? row.tempmax : layer === "humidity" ? row.humidity : row.heat_index;
    const val = parseFloat(raw);
    return Number.isFinite(val) ? val : null;
  };

  const getLayerColor = (layer: LayerKey, value: number | null) => {
    if (value == null) return "#e5e7eb";
    if (layer === "tempmax") return getColorByTemp(value);
    if (layer === "humidity") return getColorByHumidity(value);
    return getColorByHeatIndex(value);
  };

  const getLegendGradient = (layer: LayerKey) => {
    if (layer === "tempmax") {
      return "linear-gradient(90deg, #A7F3D0 0%, #FCD34D 33%, #F97316 66%, #DC2626 85%, #6B21A8 100%)";
    }
    if (layer === "humidity") {
      return "linear-gradient(90deg, #F1F5F9 0%, #DBEAFE 25%, #93C5FD 50%, #2563EB 75%, #1E40AF 100%)";
    }
    return "linear-gradient(90deg, #10B981 0%, #F59E0B 35%, #EA580C 60%, #B91C1C 82%, #5B21B6 100%)";
  };

  const getLegendTicks = (layer: LayerKey) => {
    if (layer === "tempmax") return ["<24", "24", "29", "33", "38+"];
    if (layer === "humidity") return ["<40", "40", "61", "76", "85+"];
    return ["<27", "27", "33", "41", "51+"];
  };

  useEffect(() => {
    if (!containerRef.current) return;

    import("leaflet").then((L) => {
      if (mapRef.current) return;

      const map = L.map(containerRef.current as HTMLElement, { preferCanvas: true, zoomControl: false }).setView([6.88, 79.96], 12);
      mapRef.current = map;

      map.createPane("heatBlendPane");
      const heatBlendPane = map.getPane("heatBlendPane");
      if (heatBlendPane) {
        heatBlendPane.style.zIndex = "350";
        heatBlendPane.style.mixBlendMode = "multiply";
        heatBlendPane.style.filter = "blur(6px) saturate(1.05)";
      }

      L.control.zoom({ position: "topright" }).addTo(map);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 20,
      }).addTo(map);

      fetch("/geojson/all 13 divisions-1,028 coordinate points.geojson")
        .then((res) => res.json())
        .then((geo) => {
          geoLayerRef.current = L.geoJSON(geo, {
            pane: "heatBlendPane",
            style: {
              stroke: false,
              weight: 1,
              opacity: 0,
              color: "transparent",
              fillOpacity: 0.94,
            },
            
            onEachFeature: (_: unknown, layer: any) => {
              layer.on({
                mouseover: () => layer.setStyle({ fillOpacity: 0.99 }),
                mouseout: () => layer.setStyle({ fillOpacity: 0.94 }),
              });
            },
          }).addTo(map);

          map.fitBounds(geoLayerRef.current.getBounds(), { maxZoom: 12 });
          setMapLoaded(true);
        });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        geoLayerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!geoLayerRef.current) return;

    geoLayerRef.current.eachLayer((layer: any) => {
      const name = layer.feature?.properties?.name;
      const row = data.find((d: HeatDataRow) => normalize(d.location) === normalize(name));
      const temp = row ? parseFloat(row.tempmax) : null;
      const humidity = row ? parseFloat(row.humidity) : null;
      const heatIndex = row ? parseFloat(row.heat_index) : null;
      const layerValue = getLayerValue(row, selectedLayer);

      layer.setStyle({ fillColor: getLayerColor(selectedLayer, layerValue) });

      layer.bindPopup(`
        <div style="font-family: system-ui; padding: 4px;">
          <div style="font-weight: 700; font-size: 16px; color: #1f2937; margin-bottom: 8px;">${name}</div>
          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 14px;">
            <div style="display: flex; justify-content: space-between;"><span style="color: #6b7280;">Temperature</span><span style="font-weight: 600; color: #1f2937;">${temp != null ? temp.toFixed(1) + " °C" : "N/A"}</span></div>
            <div style="display: flex; justify-content: space-between;"><span style="color: #6b7280;">Humidity</span><span style="font-weight: 600; color: #1f2937;">${humidity != null ? humidity.toFixed(1) + " %" : "N/A"}</span></div>
            <div style="display: flex; justify-content: space-between;"><span style="color: #6b7280;">Heat Index</span><span style="font-weight: 600; color: #1f2937;">${heatIndex != null ? heatIndex.toFixed(1) + " °C" : "N/A"}</span></div>
          </div>
        </div>
      `);
    });

    if (!mapRef.current) return;

    markersRef.current.forEach((marker) => mapRef.current.removeLayer(marker));
    markersRef.current = [];
    labelMarkersRef.current.forEach((marker) => mapRef.current.removeLayer(marker));
    labelMarkersRef.current = [];

    import("leaflet").then((L) => {
      const geoLayer = geoLayerRef.current;
      const map = mapRef.current;
      if (!geoLayer || !map) return;

      geoLayer.eachLayer((layer: any) => {
        const name = layer.feature?.properties?.name;
        const row = data.find((d: HeatDataRow) => normalize(d.location) === normalize(name));
        const temp = row ? parseFloat(row.tempmax) : null;
        const heatIndex = row ? parseFloat(row.heat_index) : null;
        const layerValue = getLayerValue(row, selectedLayer);
        const center = layer.getBounds().getCenter();

        if (row && layerValue != null) {
          const layerMeta = LAYER_CONFIG[selectedLayer];
          const labelIcon = L.divIcon({
            className: "location-heat-label",
            html:
            `<div style="text-align:center; line-height:1.2; white-space:nowrap;">
  
  <div style="
    font-size:14px;
    font-weight:600;
    color:#ffffff;
    text-shadow:
      -1px -1px 0 #000,
       1px -1px 0 #000,
      -1px  1px 0 #000,
       1px  1px 0 #000,
       0 0 12px rgba(0,0,0,0.9);
  ">
    ${name}
  </div>

  <div style="
    font-size:14px;
    font-weight:600;
    color:#ffffff;
    text-shadow:
      -1px -1px 0 #000,
       1px -1px 0 #000,
      -1px  1px 0 #000,
       1px  1px 0 #000,
       0 0 12px rgba(0,0,0,0.9);
  ">
    ${layerValue.toFixed(0)}${layerMeta.unit}
  </div>

</div>`,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
          });
          const labelMarker = L.marker(center, { icon: labelIcon, interactive: false }).addTo(map);
          labelMarkersRef.current.push(labelMarker);
        }

        if (row && temp != null && heatIndex != null && heatIndex >= 41 && selectedLayer !== "humidity") {
          const warningIcon = L.divIcon({
            className: "warning-marker",
            html: `<div style="background:white; border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,0.15); border:2px solid ${temp >= 35 ? "#dc2626" : temp >= 33 ? "#ea580c" : "#f59e0b"}; font-size:16px; animation:pulse 2s infinite;">🔥</div>`,
            iconSize: [25, 25],
            iconAnchor: [16, 16],
          });
          const marker = L.marker(center, { icon: warningIcon }).addTo(map);
          markersRef.current.push(marker);
        }
      });
    });
  }, [data, selectedLayer]);

  const numericData = data.map((d) => ({ ...d, tempmax: parseFloat(d.tempmax) }));
  const stats =
    numericData.length > 0
      ? {
          avgTemp: (numericData.reduce((sum, d) => sum + d.tempmax, 0) / numericData.length).toFixed(1),
          maxTemp: Math.max(...numericData.map((d) => d.tempmax)).toFixed(1),
          minTemp: Math.min(...numericData.map((d) => d.tempmax)).toFixed(1),
        }
      : null;

  return (
    <div className="relative w-full h-[100vh] bg-linear-to-br from-blue-50 via-white to-orange-50">
      <div className="absolute top-0 left-0 right-0 z-1000 p-4">
        <div className="flex items-center justify-end">
          
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full rounded-xl" />

      <div className="absolute left-4 top-5 z-1000 w-72">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-white/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Map Layer</h3>
            <span className={`px-2 py-1 rounded-full text-white text-xs font-semibold ${LAYER_CONFIG[selectedLayer].theme}`}>
              {LAYER_CONFIG[selectedLayer].label}
            </span>
          </div>

          <select
            value={selectedLayer}
            onChange={(e) => setSelectedLayer(e.target.value as LayerKey)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="heat_index">Heat Index</option>
            <option value="tempmax">Temperature</option>
            <option value="humidity">Humidity</option>
          </select>

        </div>
      </div>

      <div className="absolute left-4 bottom-4 z-1000">
        <div className="rounded-xl border border-orange-500/80 bg-white/90 px-3 py-2 shadow-lg backdrop-blur-sm">
          <div className="mb-2 text-[11px] font-semibold text-gray-700">{LAYER_CONFIG[selectedLayer].label} ({LAYER_CONFIG[selectedLayer].unit})</div>
          <div
            className="h-5 w-[360px] rounded-md"
            style={{
              background: getLegendGradient(selectedLayer),
            }}
          />
          <div className="mt-1 flex w-[360px] justify-between text-xs font-semibold text-gray-800">
            {getLegendTicks(selectedLayer).map((value) => (
              <span key={value}>{value}</span>
            ))}
          </div>
        </div>
      </div>

      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-999">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading weather data...</p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
