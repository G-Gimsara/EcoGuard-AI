"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/app/Header/page";
import Navbar from "../NavBar/Navbar";
import {
  levels,
  levelWarnings,
  safetyGuidelines,
  feetRanges,
  getColor,
  getBadge,
  getActiveGradient,
  type LevelName,
} from "./floodLevelConfig";

interface FloodMeasurement {
  id: number;
  riseLevel: number;
  severity: string;
  firstAffected: string;
  nextAffected?: string;
  floodFeet: number;
  createdAt: string;
}

export default function FloodLevelsPage() {
  // Live state mirrored from backend API/WebSocket stream.
  const [currentSeverity, setCurrentSeverity] = useState("");
  const [riseLevel, setRiseLevel] = useState(0);

  useEffect(() => {
    // Initial snapshot so page has data before the first socket event arrives.
    const fetchData = async () => {
      const res = await fetch("http://localhost:5000/api/flood");
      const data: FloodMeasurement[] = await res.json();
      if (data.length > 0) {
        setCurrentSeverity(data[0].severity);
        setRiseLevel(data[0].riseLevel);
      }
    };
    fetchData();

    // Real-time stream: each FLOOD_UPDATE updates severity and rise level in-place.
    const ws = new WebSocket("ws://localhost:5000");
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "FLOOD_UPDATE") {
        setCurrentSeverity(msg.data.severity);
        setRiseLevel(msg.data.riseLevel);
      }
    };
    return () => ws.close();
  }, []);

  // Map current backend severity into reusable config blocks for UI sections.
  const activeLevel = levels.find((l) => l.name === currentSeverity)?.name as LevelName | undefined;
  const warning = activeLevel ? levelWarnings[activeLevel] : null;
  const guidelines = activeLevel ? safetyGuidelines[activeLevel] : [];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 text-black overflow-x-hidden text-lg">
        <Navbar />

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h1 className="text-4xl font-bold">Flood Risk Level Monitor</h1>
            <Link
              href="/Pages/Flood_Risk/Alert/Live"
              className="text-base font-semibold text-blue-600 hover:text-blue-800 underline underline-offset-2"
            >
              Live status (current level only)
            </Link>
          </div>

          <p className="text-lg mb-6">
            Current Water Rise Level :
            <span className="ml-2 font-bold text-blue-600 text-xl">{riseLevel} mm</span>
          </p>

          {!warning && (
            <div className="mb-6 p-4 rounded-lg bg-gray-200 text-gray-800 text-lg font-medium shadow flex items-center">
              <span className="mr-3 text-2xl">📡</span>
              <span>Connecting to flood monitor… severity will appear here when data is received.</span>
            </div>
          )}

          {/* Dynamic warning banner for whichever level is currently active. */}
          {warning && (
            <div className={`mb-6 p-5 rounded-lg shadow-lg ${warning.bannerClass}`}>
              <div className="flex items-start gap-3">
                <span className="text-3xl shrink-0" aria-hidden>
                  {activeLevel === "Normal" ? "✓" : activeLevel === "Critical" || activeLevel === "Major" ? "⚠️" : "ℹ️"}
                </span>
                <div>
                  <p className="text-xl font-bold leading-tight">{warning.headline}</p>
                  <p className="mt-2 text-base font-medium opacity-95 leading-snug">{warning.detail}</p>
                  <p className="mt-2 text-sm font-semibold opacity-90">
                    Current level: <span className="uppercase tracking-wide">{currentSeverity}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Safety checklist changes with the active severity level. */}
          {guidelines.length > 0 && (
            <section
              className="mb-8 rounded-xl border border-blue-200 bg-blue-50 p-6 shadow-sm"
              aria-labelledby="safety-guidelines-heading"
            >
              <h2 id="safety-guidelines-heading" className="text-2xl font-bold text-blue-900 mb-2">
                Safety guidelines
              </h2>
              <p className="text-blue-800 mb-4 text-base">
                Follow these steps for the <strong>{currentSeverity}</strong> level. Adjust as local authorities direct.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-blue-900 text-base leading-relaxed">
                {guidelines.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Static severity map: user can compare all levels at a glance. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {levels.map((level) => {
              const isActive = currentSeverity === level.name;
              return (
                <div
                  key={level.name}
                  id={`level-${level.name.toLowerCase()}`}
                  className={`border-l-4 ${getColor(level.name)}
                    rounded-xl p-6 shadow hover:shadow-lg transition-all duration-300
                    flex flex-col justify-between
                    ${isActive ? `scale-105 ring-2 ring-blue-500 ${getActiveGradient(level.name)}` : "bg-white"}`}
                >
                  <div className="flex items-center mb-4">
                    <span className="text-3xl mr-3">{level.icon}</span>
                    <h2 className="text-xl font-bold">{level.name}</h2>
                    <span className="ml-3 text-xl font-bold">{feetRanges[level.name]}</span>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-sm font-semibold mb-3 ${getBadge(level.name)}`}>
                    {level.name}
                  </span>

                  <p className="text-sm mb-3 text-gray-700">Threshold: {level.threshold} mm</p>

                  <p className="font-semibold text-base mb-1">First Affected Areas</p>
                  <pre className="whitespace-pre-wrap text-sm">{level.firstAffected}</pre>

                  {level.nextAffected && (
                    <>
                      <p className="font-semibold text-base mt-3 mb-1">Next Affected</p>
                      <pre className="whitespace-pre-wrap text-sm">{level.nextAffected}</pre>
                    </>
                  )}

                  <p className="mt-3 font-semibold text-blue-600 text-base">
                    Estimated Flood Depth: {level.floodFeet} ft
                  </p>

                  {isActive && (
                    <div className="mt-3 p-2 bg-blue-600 text-white rounded text-center text-sm font-bold animate-bounce">
                      CURRENT LEVEL
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
