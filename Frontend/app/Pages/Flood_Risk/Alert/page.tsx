"use client";

import React, { useEffect, useState, useRef } from "react";
import Header from "@/app/Header/page";
import Navbar from "../NavBar/Navbar";

interface FloodMeasurement {
  id: number;
  riseLevel: number;
  severity: string;
  firstAffected: string;
  nextAffected?: string;
  floodFeet: number;
  createdAt: string;
}

const levels = [
  { threshold: 0, name: "Normal", firstAffected: "No areas affected", nextAffected: "", floodFeet: 0, icon: "🌿" },
  { threshold: 40, name: "Alert", firstAffected: "Megoda Kolonnawa GND — 1 ft ankle-deep", nextAffected: "", floodFeet: 4, icon: "⚠️" },
  { threshold: 75, name: "Minor", firstAffected: "Megoda Kolonnawa — 2 ft home entry\nWalpola GND Kaduwela — 1 ft yards", nextAffected: "", floodFeet: 5, icon: "💧" },
  { threshold: 110, name: "Moderate", firstAffected: "Megoda Kolonnawa — 3-4 ft major homes\nWalpola — 2 ft roads", nextAffected: "Wellampitiya — 1 ft pooling\nKelanimulla GND Kolonnawa — 1-2 ft", floodFeet: 6.5, icon: "🌊" },
  { threshold: 145, name: "Major", firstAffected: "Megoda Kolonnawa — 4-6 ft evacuation\nWalpola — 3 ft households", nextAffected: "Wellampitiya — 2-3 ft\nKelaniya — 1-2 ft\nMahadeniya Kaduwela — 2 ft", floodFeet: 7, icon: "🚨" },
  { threshold: 180, name: "Critical", firstAffected: "Megoda Kolonnawa — 6-10 ft severe\nWalpola — 4-6 ft", nextAffected: "Wellampitiya/Kelaniya — 3-5 ft\nKaduwela DSD — 3-4 ft", floodFeet: 8, icon: "🔥" }
];

export default function FloodLevelsPage() {
  const [currentSeverity, setCurrentSeverity] = useState("");
  const [riseLevel, setRiseLevel] = useState(0);

  // 🔊 Ref for audio
  const audioRef = useRef<HTMLAudioElement>(null);
  // 🔊 Ref for audio

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("http://localhost:5000/api/flood");
      const data: FloodMeasurement[] = await res.json();
      if (data.length > 0) {
        setCurrentSeverity(data[0].severity);
        setRiseLevel(data[0].riseLevel);
      }
    };
    fetchData();

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

  // 🔊 Play alarm if Major or Critical
  useEffect(() => {
    if ((currentSeverity === "Major" || currentSeverity === "Critical") && audioRef.current) {
      audioRef.current.play().catch((err) => console.log("Audio play error:", err));
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [currentSeverity]);
  // 🔊 Play alarm if Major or Critical

  const getColor = (name: string) => {
    switch (name) {
      case "Normal": return "border-green-500";
      case "Alert": return "border-yellow-500";
      case "Minor": return "border-orange-400";
      case "Moderate": return "border-orange-500";
      case "Major": return "border-red-500";
      case "Critical": return "border-red-700";
      default: return "border-gray-300";
    }
  };

  const getBadge = (name: string) => {
    switch (name) {
      case "Normal": return "bg-green-100 text-green-700";
      case "Alert": return "bg-yellow-100 text-yellow-700";
      case "Minor": return "bg-orange-100 text-orange-700";
      case "Moderate": return "bg-orange-200 text-orange-800";
      case "Major": return "bg-red-100 text-red-700";
      case "Critical": return "bg-red-600 text-white";
      default: return "bg-gray-100";
    }
  };

  const getActiveGradient = (name: string) => {
    switch (name) {
      case "Normal": return "bg-gradient-to-br from-green-200 to-green-400";
      case "Alert": return "bg-gradient-to-br from-yellow-200 to-yellow-400";
      case "Minor": return "bg-gradient-to-br from-orange-200 to-orange-400";
      case "Moderate": return "bg-gradient-to-br from-orange-300 to-orange-500";
      case "Major": return "bg-gradient-to-br from-red-400 to-red-600 text-white";
      case "Critical": return "bg-gradient-to-br from-red-700 to-red-900 text-white animate-pulse";
      default: return "bg-white";
    }
  };

  const feetRanges: Record<string, string> = {
    Normal: "(0 - 4 Feet)",
    Alert: "(4 - 5 Feet)",
    Minor: "(5 - 6.5 Feet)",
    Moderate: "(6.5 - 7 Feet)",
    Major: "(7 - 8 Feet)",
    Critical: "(8+ Feet)",
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 text-black overflow-x-hidden text-lg">
        <Navbar />

        {/* 🔊 Audio element */}
        <audio ref={audioRef} src="/FloodAlarm.mp3" preload="auto" />
        {/* 🔊 Audio element */}

        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold mb-4">Flood Risk Level Monitor</h1>

          <p className="text-lg mb-6">
            Current Water Rise Level :
            <span className="ml-2 font-bold text-blue-600 text-xl">{riseLevel} mm</span>
          </p>

          {(currentSeverity === "Major" || currentSeverity === "Critical") && (
            <div className="mb-6 p-4 rounded-lg bg-red-600 text-white text-lg font-semibold animate-pulse shadow flex items-center">
              <span className="mr-3 text-2xl">⚠️</span>
              Flood Warning — Evacuate Low Areas Immediately
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {levels.map((level) => {
              const isActive = currentSeverity === level.name;
              return (
                <div
                  key={level.name}
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