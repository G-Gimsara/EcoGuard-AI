"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

export default function HeatRiskMapClient({ data = [] }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const geoLayerRef = useRef(null);
  const markersRef = useRef([]);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Normalize district names for matching
  const normalize = (str) =>
    str?.toLowerCase().replace(/\s+/g, "").replace("district", "").trim();

  const getColorByTemp = (temp) => {
    temp = Number(temp);
    if (temp >= 33) return "#F56C27";
    if (temp >= 32.8) return "#F57327";
    if (temp >= 32.6) return "#F57B27";
    if (temp >= 32.4) return "#F58227";
    if (temp >= 32.2) return "#F58A27";
    if (temp >= 32) return "#F59127";
    if (temp >= 31.8) return "#F59927";
    if (temp >= 31.6) return "#F5A027";
    if (temp >= 31.4) return "#F5A827";
    if (temp >= 31.2) return "#F5AF27";
    if (temp >= 31) return "#F5B727";
    if (temp >= 30.8) return "#F5BE27";
    if (temp >= 30.6) return "#F5C627";
    if (temp >= 30.4) return "#F5C827";
    if (temp >= 30.2) return "#F5C827";
    if (temp >= 30) return "#F5C827";
    if (temp >= 29.5) return "#F5D027";
    if (temp >= 29) return "#F5D827";
    if (temp >= 28.5) return "#F5E027";
    if (temp >= 28) return "#F5E827";
    if (temp >= 27.5) return "#F5F027";
    return "#F5F827";
  };

  const getHeatRiskLevel = (temp) => {
    temp = Number(temp);
    if (temp >= 35)
      return { level: "Extreme", color: "text-red-600", bg: "bg-red-50", showWarning: true };
    if (temp >= 33)
      return { level: "Very High", color: "text-orange-600", bg: "bg-orange-50", showWarning: true };
    if (temp >= 31)
      return { level: "High", color: "text-yellow-600", bg: "bg-yellow-50", showWarning: true };
    if (temp >= 29)
      return { level: "Moderate", color: "text-green-600", bg: "bg-green-50", showWarning: false };
    return { level: "Low", color: "text-blue-600", bg: "bg-blue-50", showWarning: false };
  };

  // Update current date every minute
  useEffect(() => {
    const dateInterval = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(dateInterval);
  }, []);

  /* ================= INITIALIZE MAP ONLY ONCE ================= */
  useEffect(() => {
    if (!containerRef.current) return;

    import("leaflet").then((L) => {
      if (!mapRef.current) {
        const map = L.map(containerRef.current, { preferCanvas: true, zoomControl: false }).setView([6.88, 79.96], 11);
        mapRef.current = map;

        // Add zoom control to top right
        L.control.zoom({ position: 'topright' }).addTo(map);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 20,
        }).addTo(map);

        fetch("/geojson/all 13 division.geojson")
          .then((res) => res.json())
          .then((geo) => {
            geoLayerRef.current = L.geoJSON(geo, {
              style: { weight: 2, color: "#fff", fillOpacity: 0.85 },
              onEachFeature: (feature, layer) => {
                layer.on({
                  mouseover: (e) => layer.setStyle({ weight: 3, color: '#fff', fillOpacity: 0.95 }),
                  mouseout: (e) => layer.setStyle({ weight: 2, color: '#fff', fillOpacity: 0.85 }),
                  click: (e) => {
                    const name = e.target.feature?.properties?.name;
                    const row = data.find((d) => normalize(d.location) === normalize(name));
                    if (row) setSelectedDistrict({ ...row, name });
                  }
                });
              }
            }).addTo(map);

            map.fitBounds(geoLayerRef.current.getBounds());
            setMapLoaded(true);

            // Compact legend
            const legend = L.control({ position: "bottomright" });
            legend.onAdd = () => {
              const div = L.DomUtil.create("div", "compact-legend");
              div.innerHTML = `
                <div style="background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border-radius: 10px; padding: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.12); border: 1px solid rgba(255,255,255,0.8);">
                  <div style="font-weight: 600; font-size: 11px; margin-bottom: 6px; color: #1f2937; display: flex; align-items: center; gap: 4px;">
                    <span style="font-size: 14px;">🌡️</span>
                    <span>Temp (°C)</span>
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 4px;">
                    ${[
                      { label: "≥35", color: "#F56C27" },
                      { label: "33-34", color: "#F58227" },
                      { label: "31-32", color: "#F5A227" },
                      { label: "29-30", color: "#F5C227" },
                      { label: "<29", color: "#F5E227" },
                    ].map(
                      (g) => `
                      <div style="display: flex; align-items: center; gap: 6px;">
                        <div style="width: 20px; height: 14px; background: ${g.color}; border-radius: 3px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"></div>
                        <span style="font-size: 10px; font-weight: 500; color: #374151;">${g.label}</span>
                      </div>
                      `
                    ).join("")}
                  </div>
                </div>
              `;
              L.DomEvent.disableClickPropagation(div);
              return div;
            };
            legend.addTo(map);
          });
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        geoLayerRef.current = null;
      }
    };
  }, []);

  /* ================= UPDATE LAYER COLORS & POPUPS ================= */
  useEffect(() => {
    if (!geoLayerRef.current) return;

    geoLayerRef.current.eachLayer((layer) => {
      const name = layer.feature?.properties?.name;
      const row = data.find((d) => normalize(d.location) === normalize(name));

      const temp = row ? parseFloat(row.tempmax) : null;

      layer.setStyle({
        fillColor: temp != null ? getColorByTemp(temp) : "#e5e7eb",
      });

      layer.bindPopup(`
        <div style="font-family: system-ui; padding: 4px;">
          <div style="font-weight: 700; font-size: 16px; color: #1f2937; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <span>📍</span> ${name}
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 14px;">
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="color: #6b7280;">Max Temperature</span>
              <span style="font-weight: 600; color: ${temp != null ? getColorByTemp(temp) : '#6b7280'};">
                ${temp != null ? temp.toFixed(1) + " °C" : "N/A"}
              </span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 6px 0;">
              <span style="color: #6b7280;">Heat Index</span>
              <span style="font-weight: 600; color: #1f2937;">
                ${row?.heat_index != null ? parseFloat(row.heat_index).toFixed(1) + " °C" : "N/A"}
              </span>
            </div>
          </div>
        </div>
      `);
    });

    if (mapRef.current) {
      // Remove old markers
      markersRef.current.forEach(marker => mapRef.current.removeLayer(marker));
      markersRef.current = [];

      import("leaflet").then((L) => {
        geoLayerRef.current.eachLayer((layer) => {
          const name = layer.feature?.properties?.name;
          const row = data.find((d) => normalize(d.location) === normalize(name));
          const temp = row ? parseFloat(row.tempmax) : null;

          if (row && temp != null && getHeatRiskLevel(temp).showWarning) {
            const center = layer.getBounds().getCenter();
            const warningIcon = L.divIcon({
              className: 'warning-marker',
              html: `<div style="
                background: white;
                border-radius: 50%;
                width: 25px;
                height: 25px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                border: 2px solid ${temp >= 35 ? '#dc2626' : temp >= 33 ? '#ea580c' : '#f59e0b'};
                font-size: 18px;
                animation: pulse 2s infinite;
              ">🔥</div>`,
              iconSize: [32, 32],
              iconAnchor: [16, 16]
            });
            const marker = L.marker(center, { icon: warningIcon }).addTo(mapRef.current);
            markersRef.current.push(marker);
          }
        });
      });
    }
  }, [data]);

  // Calculate statistics safely
  const numericData = data.map(d => ({ ...d, tempmax: parseFloat(d.tempmax) }));
  const stats = numericData.length > 0 ? {
    avgTemp: (numericData.reduce((sum, d) => sum + d.tempmax, 0) / numericData.length).toFixed(1),
    maxTemp: Math.max(...numericData.map(d => d.tempmax)).toFixed(1),
    minTemp: Math.min(...numericData.map(d => d.tempmax)).toFixed(1),
    hottestArea: numericData.reduce((max, d) => d.tempmax > max.tempmax ? d : max, numericData[0]),
    highRiskCount: numericData.filter(d => d.tempmax >= 31).length
  } : null;

  const formatDate = (date) => date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const formatTime = (date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="relative w-full h-[88vh] bg-linear-to-br from-blue-50 via-white to-orange-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-1000 p-4">
        <div className="flex items-center justify-between">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-4">
            <h1 className="text-xl font-bold text-gray-900">Heat Risk Monitor</h1>
            <p className="text-sm text-gray-600">{formatDate(currentDate)} • {formatTime(currentDate)}</p>
          </div>

          {stats && (
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-4 hidden md:flex items-center gap-6 mr-7">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.maxTemp}°C</div>
                <div className="text-xs text-gray-600">Highest</div>
              </div>
              <div className="w-px h-10 bg-gray-200"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.minTemp}°C</div>
                <div className="text-xs text-gray-600">Lowest</div>
              </div>
              <div className="w-px h-10 bg-gray-200"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.avgTemp}°C</div>
                <div className="text-xs text-gray-600">Average</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Heat Risk Alert */}
      {stats && stats.highRiskCount > 0 && (
        <div className="absolute top-24 left-4 z-1000 w-80 mt-4">
          <div className="bg-linear-to-br from-red-50 to-orange-50 backdrop-blur-xl rounded-2xl shadow-xl border-2 border-red-200 p-4">
            <div className="flex items-start gap-3">
              <div className="text-3xl animate-pulse">⚠️</div>
              <div className="flex-1">
                <h3 className="font-bold text-red-900 mb-1">Heat Risk Alert</h3>
                <p className="text-sm text-red-700 mb-2">
                  {stats.highRiskCount} area{stats.highRiskCount > 1 ? 's' : ''} experiencing high heat risk levels
                </p>
                <div className="flex items-center gap-2 text-xs text-red-600">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  <span>Stay hydrated and avoid outdoor activities</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      <div ref={containerRef} className="w-full h-full rounded-xl" />

      {/* Loading */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-999">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading weather data...</p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in-from-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-in { animation: slide-in-from-right 0.3s ease-out; }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}