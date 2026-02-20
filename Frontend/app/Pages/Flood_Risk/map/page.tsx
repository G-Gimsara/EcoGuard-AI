"use client";

import React from "react";
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import Navbar from "../NavBar/Navbar"; // adjust the import based on your project

// ----- Station Types -----
type Station = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  waterLevelCategory: "high" | "medium" | "low";
};

// ----- Station Data -----
const stations: Station[] = [
  { id: 1, name: "Kelani River - Colombo", lat: 6.9271, lng: 79.8612, waterLevelCategory: "medium" },
  { id: 2, name: "Nagalagam Street", lat: 6.933, lng: 79.862, waterLevelCategory: "high" },
  { id: 3, name: "Hanwella", lat: 6.918, lng: 80.012, waterLevelCategory: "medium" },
  { id: 4, name: "Glencourse", lat: 6.930, lng: 79.880, waterLevelCategory: "high" },
  { id: 5, name: "Kitulgala", lat: 6.960, lng: 80.030, waterLevelCategory: "high" },
  { id: 6, name: "Holombuwa", lat: 6.950, lng: 79.900, waterLevelCategory: "high" },
  { id: 7, name: "Deraniyagala", lat: 6.940, lng: 79.970, waterLevelCategory: "high" },
  { id: 8, name: "Norwood", lat: 6.945, lng: 79.985, waterLevelCategory: "high" },
];

// ----- Icons -----
const highIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const mediumIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/orange-dot.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const lowIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// ----- Kelani River Flood Zone -----
const kelaniFloodZone: LatLngExpression[] = [
  [6.915, 79.850],
  [6.940, 79.850],
  [6.940, 79.880],
  [6.915, 79.880],
];

// ----- Fit Map to Stations -----
function FitBounds({ stations }: { stations: Station[] }) {
  const map = useMap();
  const bounds = L.latLngBounds(stations.map((s) => [s.lat, s.lng]));
  map.fitBounds(bounds, { padding: [50, 50] });
  return null;
}

// ----- Main Map Page -----
export default function MapPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6 text-blue-800">Flood Monitoring Map</h1>

        <MapContainer
          center={[6.9271, 79.8612]}
          zoom={11}
          style={{ width: "100%", height: "600px" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

         

          {/* Place Markers */}
          {stations.map((station) => (
            <Marker
              key={station.id}
              position={[station.lat, station.lng]}
              icon={
                station.waterLevelCategory === "high"
                  ? highIcon
                  : station.waterLevelCategory === "medium"
                  ? mediumIcon
                  : lowIcon
              }
            >
              <Popup>
                <strong>{station.name}</strong>
                <br />
                Water Level: {station.waterLevelCategory}
              </Popup>
            </Marker>
          ))}

          {/* Auto-fit all markers */}
          <FitBounds stations={stations} />
        </MapContainer>
      </div>
    </div>
  );
}
