"use client";

import React, { useState, useEffect } from "react";
import Navbar from "../NavBar/Navbar";
import Header from "@/app/Header/page";
import {
  ShieldCheck,
  AlertTriangle,
  MapPin,
  PhoneCall,
  Zap,
  ChevronRight,
  Siren,
  Eye,
  Clock,
  Users,
  Home,
  Radio,
  TriangleAlert,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────
interface SafetyLevel {
  level: string;
  code: string;
  textClass: string;
  borderLeft: string;
  bgActive: string;
  badgeBg: string;
  badgeText: string;
  glowClass: string;
  threshold: string;
  icon: React.ReactNode;
  status: string;
  actions: string[];
}

interface EvacuationZone {
  name: string;
  capacity: string;
  status: "Open" | "On Standby";
  distance: string;
}

interface EmergencyContact {
  label: string;
  number: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

// ─── Data ───────────────────────────────────────────
const safetyLevels: SafetyLevel[] = [
  {
    level: "NORMAL",
    code: "LVL-0",
    textClass: "text-green-600",
    borderLeft: "border-l-4 border-green-500",
    bgActive: "bg-green-50",
    badgeBg: "bg-green-500",
    badgeText: "text-white",
    glowClass: "shadow-green-200",
    threshold: "0 mm",
    icon: <ShieldCheck size={22} />,
    status: "ALL CLEAR",
    actions: [
      "Monitor local weather forecasts daily",
      "Keep emergency contacts saved & accessible",
      "Review your family evacuation plan monthly",
      "Ensure emergency kit is stocked & ready",
      "Inspect drainage channels near property",
    ],
  },
  {
    level: "ALERT",
    code: "LVL-1",
    textClass: "text-yellow-600",
    borderLeft: "border-l-4 border-yellow-500",
    bgActive: "bg-yellow-50",
    badgeBg: "bg-yellow-400",
    badgeText: "text-black",
    glowClass: "shadow-yellow-200",
    threshold: "55 mm",
    icon: <Eye size={22} />,
    status: "WATCH",
    actions: [
      "Pre-flood ankle-deep water possible",
      "Secure all outdoor furniture & valuables",
      "Move items to higher ground or upper floors",
      "Avoid low-lying areas in Megoda Kolonnawa",
      "Charge all devices & prepare emergency kit",
    ],
  },
  {
    level: "MINOR",
    code: "LVL-1.5",
    textClass: "text-amber-600",
    borderLeft: "border-l-4 border-amber-500",
    bgActive: "bg-amber-50",
    badgeBg: "bg-amber-500",
    badgeText: "text-white",
    glowClass: "shadow-amber-200",
    threshold: "70 – 90 mm",
    icon: <AlertTriangle size={22} />,
    status: "MINOR FLOOD",
    actions: [
      "Minor flooding possible in low-lying areas",
      "Stay alert for rising water levels",
      "Avoid canals, drainage paths and rivers",
      "Prepare evacuation bag if conditions worsen",
      "Monitor official alerts from Disaster Management Centre",
    ],
  },
  {
    level: "MODERATE",
    code: "LVL-2",
    textClass: "text-orange-600",
    borderLeft: "border-l-4 border-orange-500",
    bgActive: "bg-orange-50",
    badgeBg: "bg-orange-500",
    badgeText: "text-white",
    glowClass: "shadow-orange-200",
    threshold: "100 – 150 mm",
    icon: <TriangleAlert size={22} />,
    status: "WARNING",
    actions: [
      "Water entering home entry points — act now",
      "Do NOT walk or drive through flooded roads",
      "Walpola zone: move to upper floors immediately",
      "Turn off electrical appliances at breaker level",
      "Assist neighbours & elderly residents nearby",
    ],
  },
  {
    level: "MAJOR",
    code: "LVL-2.5",
    textClass: "text-red-500",
    borderLeft: "border-l-4 border-red-500",
    bgActive: "bg-red-50",
    badgeBg: "bg-red-500",
    badgeText: "text-white",
    glowClass: "shadow-red-200",
    threshold: "150 – 200 mm",
    icon: <Siren size={22} />,
    status: "SEVERE WARNING",
    actions: [
      "Severe flooding likely in vulnerable zones",
      "Prepare for evacuation immediately",
      "Move valuables, vehicles and electronics to higher ground",
      "Follow instructions from local authorities",
      "Be ready to evacuate within minutes if situation escalates",
    ],
  },
  {
    level: "CRITICAL",
    code: "LVL-3",
    textClass: "text-red-600",
    borderLeft: "border-l-4 border-red-600",
    bgActive: "bg-red-50",
    badgeBg: "bg-red-600",
    badgeText: "text-white",
    glowClass: "shadow-red-200",
    threshold: "200 – 300+ mm",
    icon: <Siren size={22} />,
    status: "EVACUATE NOW",
    actions: [
      "EVACUATE IMMEDIATELY do not delay",
      "Severe flooding in Wellampitiya / Kelaniya",
      "Switch off electricity and gas at the mains",
      "Do NOT re-enter flooded structures",
      "Report to designated evacuation centres",
    ],
  },
];

const evacuationZones: EvacuationZone[] = [
  { name: "Megoda Kolonnawa GND", capacity: "850 persons", status: "Open", distance: "1.2 km" },
  { name: "Walpola Community Centre", capacity: "600 persons", status: "Open", distance: "2.1 km" },
  { name: "Wellampitiya School", capacity: "1,200 persons", status: "On Standby", distance: "3.4 km" },
  { name: "Kelaniya Temple Grounds", capacity: "2,000 persons", status: "On Standby", distance: "4.8 km" },
];

const emergencyContacts: EmergencyContact[] = [
  { label: "Disaster Management Centre (DMC)", number: "117", colorClass: "text-red-600", bgClass: "bg-red-50", borderClass: "border-red-200" },
  { label: "DMC Emergency Ops Center", number: "011 2136222", colorClass: "text-red-600", bgClass: "bg-red-50", borderClass: "border-red-200" },
  { label: "Police Special Ops Room", number: "011 2421820", colorClass: "text-yellow-600", bgClass: "bg-yellow-50", borderClass: "border-yellow-200" },
  { label: "Police Emergency", number: "119", colorClass: "text-orange-600", bgClass: "bg-orange-50", borderClass: "border-orange-200" },
  { label: "Fire & Rescue (Ambulance)", number: "110", colorClass: "text-green-700", bgClass: "bg-green-50", borderClass: "border-green-200" },
  { label: "Suwa Seriya Ambulance", number: "1990", colorClass: "text-blue-700", bgClass: "bg-blue-50", borderClass: "border-blue-200" },
];

// ─── Component ───────────────────────────────────────────
const SafetyGuidancePage = () => {
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const clock = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clock);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <Navbar />

      <main className="p-6 lg:p-8 flex-grow">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Page Heading */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck size={44} className="text-blue-800 shrink-0" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Safety Protocols & Guidance</h1>
                <p className="text-gray-600 text-base">Based on Flood Risk Level Monitor Thresholds</p>
              </div>
            </div>

            {/* Live Clock */}
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm text-sm text-gray-500 self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <Clock size={14} />
              <span className="font-mono font-medium text-gray-700 text-sm">{currentTime.toLocaleTimeString()}</span>
              <span className="text-gray-300">|</span>
              <Radio size={14} className="text-blue-500" />
              <span className="text-blue-600 font-semibold text-xs">LIVE</span>
            </div>
          </div>

          {/* Alert Levels */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Radio size={15} className="text-blue-700" />
              <h2 className="text-sm font-bold text-blue-700 uppercase tracking-widest">Alert Levels & Response Protocols</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              {safetyLevels.map((item, index) => {
                const isActive = activeLevel === index;
                return (
                  <button
                    key={index}
                    onClick={() => setActiveLevel(isActive ? null : index)}
                    className={`relative overflow-hidden rounded-xl p-5 text-left transition-all duration-300 cursor-pointer
                      ${item.borderLeft} ${isActive ? `${item.bgActive} shadow-lg ${item.glowClass} scale-[1.02]` : "bg-white shadow-sm hover:shadow-md hover:scale-[1.01]"}`}
                  >
                    {/* Badge — was text-[9px], now text-xs */}
                    <span className={`absolute top-0 right-0 text-xs font-black px-2 py-1 rounded-bl-xl ${item.badgeBg} ${item.badgeText}`}>{item.code}</span>

                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.textClass} bg-gray-100`}>{item.icon}</div>
                      <div>
                        {/* Status label — was text-[10px], now text-xs */}
                        <p className="text-xs text-gray-400 uppercase tracking-wider">{item.status}</p>
                        {/* Level name — was text-lg, now text-xl */}
                        <h3 className={`font-black text-xl leading-tight ${item.textClass}`}>{item.level}</h3>
                      </div>
                    </div>

                    {/* Threshold badge — was text-[10px], now text-xs */}
                    <div className={`inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1 mb-3 bg-gray-100 ${item.textClass}`}>
                      <Zap size={11} /> TRIGGER: {item.threshold}
                    </div>

                    {/* Action items — was text-[11px], now text-xs */}
                    <ul className="space-y-2">
                      {item.actions.map((action, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-600 leading-snug">
                          <ChevronRight size={12} className={`mt-0.5 shrink-0 ${item.textClass}`} /> {action}
                        </li>
                      ))}
                    </ul>

                    {isActive && <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${item.badgeBg} opacity-40`} />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Emergency Action Plan */}
          <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200">
            <h2 className="text-2xl font-bold text-blue-900 mb-6 flex items-center gap-2">
              <PhoneCall size={26} /> Emergency Action Plan
            </h2>
            <div className="grid lg:grid-cols-3 gap-8">

              {/* Evacuation Centres */}
              <div className="lg:col-span-2 space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={16} className="text-red-500" />
                  <p className="font-bold text-gray-800 text-sm uppercase tracking-wide">Evacuation Centres</p>
                </div>
                {evacuationZones.map((zone, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                        <Home size={15} className="text-gray-500" />
                      </div>
                      <div>
                        {/* Zone name — was text-sm, kept text-sm (already readable) */}
                        <p className="text-sm font-semibold text-gray-800">{zone.name}</p>
                        {/* Zone meta — was text-[10px], now text-xs */}
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><Users size={11} /> {zone.capacity}</span>
                          <span className="flex items-center gap-1"><MapPin size={11} /> {zone.distance}</span>
                        </div>
                      </div>
                    </div>
                    {/* Status badge — was text-[10px], now text-xs */}
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${zone.status === "Open" ? "text-green-700 bg-green-50 border-green-200" : "text-yellow-700 bg-yellow-50 border-yellow-200"}`}>
                      {zone.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Emergency Hotlines */}
              <div className="space-y-2">
                <p className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-3">Emergency Hotlines</p>
                {emergencyContacts.map((c, i) => (
                  <div key={i} className={`rounded-xl border ${c.borderClass} ${c.bgClass} px-4 py-3 flex items-center justify-between`}>
                    {/* Contact label — was text-xs, kept text-xs */}
                    <p className="text-xs text-gray-600 leading-tight max-w-[150px]">{c.label}</p>
                    {/* Phone number — was text-2xl, kept text-2xl (already prominent) */}
                    <span className={`text-2xl font-black font-mono tracking-tight ${c.colorClass}`}>{c.number}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Do's & Don'ts */}
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "DO's During a Flood",
                borderLeft: "border-l-4 border-green-500",
                bg: "bg-green-50",
                dot: "bg-green-500",
                text: "text-green-700",
                icon: <ShieldCheck size={18} />,
                items: [
                  "Move to highest ground or upper floors immediately",
                  "Follow all instructions from local authorities",
                  "Disconnect electrical appliances before water rises",
                  "Use battery-powered torch avoid candles or flames",
                  "Keep important documents in waterproof sealed bags",
                  "Signal for help using bright cloth or mirror reflection",
                ],
              },
              {
                title: "DON'Ts During a Flood",
                borderLeft: "border-l-4 border-red-500",
                bg: "bg-red-50",
                dot: "bg-red-500",
                text: "text-red-700",
                icon: <AlertTriangle size={18} />,
                items: [
                  "Never walk through moving floodwater (6 in can knock you down)",
                  "Do not drive through flooded roads under any circumstance",
                  "Never touch electrical equipment in wet conditions",
                  "Do not return home until officials declare it safe",
                  "Do not drink flood-contaminated tap or well water",
                  "Never ignore evacuation orders leave immediately",
                ],
              },
            ].map((section, i) => (
              <div key={i} className={`rounded-xl ${section.borderLeft} ${section.bg} p-6 shadow-sm`}>
                <div className={`flex items-center gap-2 mb-4 ${section.text}`}>
                  {section.icon}
                  {/* Section title — was text-sm, kept text-sm */}
                  <h3 className="font-bold text-sm uppercase tracking-wide">{section.title}</h3>
                </div>
                <ul className="space-y-3">
                  {section.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm text-gray-700 leading-snug">
                      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${section.dot}`} />{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
};

export default SafetyGuidancePage;