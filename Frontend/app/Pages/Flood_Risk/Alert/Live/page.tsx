"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Header from "@/app/Header/page";
import Navbar from "../../NavBar/Navbar";
import {
  levels,
  levelWarnings,
  safetyGuidelines,
  estimatedDepthRangeByLevel,
  webAlertPolicies,
  getLevelRow,
  type LevelName,
} from "../floodLevelConfig";

interface FloodMeasurement {
  id: number;
  riseLevel: number;
  severity: string;
  firstAffected: string;
  nextAffected?: string;
  floodFeet: number;
  createdAt: string;
}

/** Shared chrome so all three panels feel like one dashboard, not three random boxes */
function liveChrome(level: LevelName): {
  bar: string;
  iconRing: string;
  pill: string;
  statChip: string;
  metricCard: string;
  metricValue: string;
  checklistDot: string;
  overviewBtn: string;
  panelBg: string;
  topPanelBg: string;
} {
  switch (level) {
    case "Normal":
      return {
        bar: "bg-emerald-500",
        iconRing: "bg-emerald-50 ring-emerald-200/80 text-emerald-800",
        pill: "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/60",
        statChip: "bg-emerald-50/90 text-emerald-900 ring-1 ring-emerald-100",
        metricCard: "bg-emerald-50 ring-emerald-200/80",
        metricValue: "text-emerald-800",
        checklistDot: "bg-emerald-600",
        overviewBtn: "bg-emerald-700 hover:bg-emerald-800",
        panelBg: "bg-emerald-100",
        topPanelBg: "bg-emerald-100",
      };
    case "Alert":
      return {
        bar: "bg-amber-400",
        iconRing: "bg-amber-50 ring-amber-200/80 text-amber-900",
        pill: "bg-amber-100 text-amber-950 ring-1 ring-amber-200/70",
        statChip: "bg-amber-50/90 text-amber-950 ring-1 ring-amber-100",
        metricCard: "bg-amber-50 ring-amber-200/80",
        metricValue: "text-amber-900",
        checklistDot: "bg-amber-500",
        overviewBtn: "bg-amber-700 hover:bg-amber-800",
        panelBg: "bg-amber-100",
        topPanelBg: "bg-amber-100",
      };
    case "Minor":
      return {
        bar: "bg-orange-400",
        iconRing: "bg-orange-50 ring-orange-200/80 text-orange-900",
        pill: "bg-orange-100 text-orange-950 ring-1 ring-orange-200/60",
        statChip: "bg-orange-50/90 text-orange-950 ring-1 ring-orange-100",
        metricCard: "bg-orange-50 ring-orange-200/80",
        metricValue: "text-orange-900",
        checklistDot: "bg-orange-500",
        overviewBtn: "bg-orange-700 hover:bg-orange-800",
        panelBg: "bg-orange-100",
        topPanelBg: "bg-orange-100",
      };
    case "Moderate":
      return {
        bar: "bg-orange-600",
        iconRing: "bg-orange-50 ring-orange-200/80 text-orange-950",
        pill: "bg-orange-100 text-orange-950 ring-1 ring-orange-200/60",
        statChip: "bg-orange-50/90 text-orange-950 ring-1 ring-orange-100",
        metricCard: "bg-orange-50 ring-orange-200/80",
        metricValue: "text-orange-950",
        checklistDot: "bg-orange-600",
        overviewBtn: "bg-orange-800 hover:bg-orange-900",
        panelBg: "bg-orange-200",
        topPanelBg: "bg-orange-200",
      };
    case "Major":
      return {
        bar: "bg-red-500",
        iconRing: "bg-red-50 ring-red-200/80 text-red-900",
        pill: "bg-red-100 text-red-950 ring-1 ring-red-200/60",
        statChip: "bg-red-50/90 text-red-950 ring-1 ring-red-100",
        metricCard: "bg-red-50 ring-red-200/80",
        metricValue: "text-red-900",
        checklistDot: "bg-red-600",
        overviewBtn: "bg-red-700 hover:bg-red-800",
        panelBg: "bg-red-200",
        topPanelBg: "bg-red-200",
      };
    case "Critical":
      return {
        bar: "bg-gradient-to-r from-red-700 via-rose-700 to-red-800 shadow-[inset_0_-1px_0_rgba(0,0,0,0.15)]",
        iconRing: "bg-red-100 ring-2 ring-red-300/70 text-red-950",
        pill: "bg-red-600 text-white ring-1 ring-red-800/30",
        statChip: "bg-red-50 text-red-950 ring-1 ring-red-200",
        metricCard: "bg-red-100 ring-red-300/80",
        metricValue: "text-red-950",
        checklistDot: "bg-red-700",
        overviewBtn: "bg-red-800 hover:bg-red-900",
        panelBg: "bg-red-300",
        topPanelBg: "bg-red-300",
      };
    default:
      return {
        bar: "bg-slate-400",
        iconRing: "bg-slate-50 ring-slate-200 text-slate-800",
        pill: "bg-slate-100 text-slate-800 ring-1 ring-slate-200",
        statChip: "bg-slate-50 text-slate-800 ring-1 ring-slate-200",
        metricCard: "bg-slate-50 ring-slate-200/80",
        metricValue: "text-slate-800",
        checklistDot: "bg-slate-700",
        overviewBtn: "bg-slate-900 hover:bg-slate-800",
        panelBg: "bg-white",
        topPanelBg: "bg-white/95",
      };
  }
}

export default function FloodLiveAlertPage() {
  // Real-time values from backend; used to drive all live UI sections.
  const [currentSeverity, setCurrentSeverity] = useState("");
  const [riseLevel, setRiseLevel] = useState(0);
  const [criticalAcknowledged, setCriticalAcknowledged] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  // Tracks previous level so we notify on transitions, not every render.
  const previousSeverityRef = useRef<string>("");
  const previousAlarmSeverityRef = useRef<string>("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const shouldPlayAlarm = currentSeverity === "Major" || currentSeverity === "Critical";

  useEffect(() => {
    let cancelled = false;
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    // Bootstrap with the latest saved measurement and use it as fallback polling.
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/flood", { cache: "no-store" });
        if (!res.ok) return;
        const data: FloodMeasurement[] = await res.json();
        if (cancelled || data.length === 0) return;
        setCurrentSeverity(data[0].severity);
        setRiseLevel(data[0].riseLevel);
      } catch {
        // Ignore temporary API/network failures; next tick retries.
      }
    };

    const connect = () => {
      if (cancelled) return;
      ws = new WebSocket("ws://localhost:5000");

      ws.onopen = () => {
        // Pull latest level immediately after socket reconnect.
        void fetchData();
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "FLOOD_UPDATE") {
            setCurrentSeverity(msg.data.severity);
            setRiseLevel(msg.data.riseLevel);
          }
        } catch {
          /* ignore malformed payloads */
        }
      };

      ws.onclose = () => {
        if (cancelled) return;
        // Keep UI moving even while websocket is reconnecting.
        void fetchData();
        reconnectTimer = setTimeout(connect, 2000);
      };
      ws.onerror = () => ws?.close();
    };

    fetchData();
    connect();
    const pollTimer = setInterval(fetchData, 5000);

    // Close socket/timers on leave to avoid duplicate subscriptions.
    return () => {
      cancelled = true;
      clearInterval(pollTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.load();

    // Prime audio once after first user gesture to satisfy browser autoplay rules.
    const unlockAudio = () => {
      const el = audioRef.current;
      if (!el) return;
      el.muted = true;
      el
        .play()
        .then(() => {
          el.pause();
          el.currentTime = 0;
          el.muted = false;
          setAudioReady(true);
          window.removeEventListener("pointerdown", unlockAudio);
          window.removeEventListener("keydown", unlockAudio);
          window.removeEventListener("touchstart", unlockAudio);
        })
        .catch(() => {
          // Keep listeners attached and retry on next user gesture.
        });
    };

    window.addEventListener("pointerdown", unlockAudio, { passive: true });
    window.addEventListener("keydown", unlockAudio);
    window.addEventListener("touchstart", unlockAudio, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Pause/reset when level is below Major.
    if (!shouldPlayAlarm) {
      audio.pause();
      audio.currentTime = 0;
      previousAlarmSeverityRef.current = currentSeverity;
      return;
    }

    // Play only when entering/changing a high-risk level (no nonstop loop).
    if (previousAlarmSeverityRef.current === currentSeverity) return;

    // If browser already saw user activation in this tab, allow alarm immediately.
    const browserActivated =
      typeof navigator !== "undefined" &&
      "userActivation" in navigator &&
      Boolean((navigator as Navigator & { userActivation?: { hasBeenActive?: boolean } }).userActivation?.hasBeenActive);
    if (!audioReady && browserActivated) {
      setAudioReady(true);
    }
    // If browser hasn't unlocked audio yet, wait for first gesture.
    if (!audioReady && !browserActivated) return;

    let cleanedUp = false;
    const events: Array<keyof WindowEventMap> = ["click", "keydown", "touchstart"];

    // Retry after user interaction when autoplay is blocked by browser policy.
    const tryStartAlarm = () => {
      if (!audioRef.current) return;
      audioRef.current
        .play()
        .then(() => {
          if (cleanedUp) return;
          previousAlarmSeverityRef.current = currentSeverity;
          events.forEach((eventName) => window.removeEventListener(eventName, tryStartAlarm));
        })
        .catch(() => {
          // Keep listeners attached; next interaction will retry.
        });
    };

    tryStartAlarm();
    events.forEach((eventName) => window.addEventListener(eventName, tryStartAlarm, { passive: true }));

    return () => {
      cleanedUp = true;
      events.forEach((eventName) => window.removeEventListener(eventName, tryStartAlarm));
    };
  }, [shouldPlayAlarm, currentSeverity, audioReady]);

  useEffect(() => {
    // Browser notification policy is level-dependent (one-time + periodic reminders).
    const level = levels.find((l) => l.name === currentSeverity)?.name as LevelName | undefined;
    if (!level) return;
    const policy = webAlertPolicies[level];
    const levelChanged = previousSeverityRef.current !== level;
    if (level !== "Critical") {
      setCriticalAcknowledged(false);
    }

    if (typeof window === "undefined" || typeof Notification === "undefined") {
      previousSeverityRef.current = level;
      return;
    }

    
    // Small helper keeps notification payload format consistent.
    const notify = (title: string, body: string) => {
      if (Notification.permission === "granted") {
        new Notification(title, { body, icon: "/favicon.ico" });
      }
    };

    if (levelChanged && (level === "Major" || level === "Critical")) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            notify(`${level} Flood Alert`, `${levelWarnings[level].detail} Rise level: ${riseLevel} mm.`);
          }
        });
      } else {
        notify(`${level} Flood Alert`, `${levelWarnings[level].detail} Rise level: ${riseLevel} mm.`);
      }
    }

    // Repeat reminders for ongoing high-risk levels per policy settings.
    if (policy.repeatMinutes && (level === "Major" || (level === "Critical" && !criticalAcknowledged))) {
      const intervalId = window.setInterval(() => {
        notify(`${level} Flood Reminder`, `Flood level remains ${level}. Follow safety guidance immediately.`);
      }, policy.repeatMinutes * 60 * 1000);
      previousSeverityRef.current = level;
      return () => window.clearInterval(intervalId);
    }

    previousSeverityRef.current = level;
  }, [currentSeverity, riseLevel, criticalAcknowledged]);

  // Convert backend severity text to a typed level model used by all three panels.
  const activeLevel = levels.find((l) => l.name === currentSeverity)?.name as LevelName | undefined;
  const warning = activeLevel ? levelWarnings[activeLevel] : null;
  const guidelines = activeLevel ? safetyGuidelines[activeLevel] : [];
  const levelRow = activeLevel ? getLevelRow(activeLevel) : undefined;
  const chrome = activeLevel ? liveChrome(activeLevel) : null;
  const alertPolicy = activeLevel ? webAlertPolicies[activeLevel] : null;

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-slate-100 text-slate-900 text-[15px]">
      <Header />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Navbar />
        {/* Alarm audio plays only during Major/Critical states. */}
        <audio ref={audioRef} src="/FloodAlarm.mp3" preload="auto" />

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-4 pb-4 pt-3 sm:px-6 sm:pb-5 sm:pt-4 lg:overflow-hidden lg:px-10 lg:pb-6 xl:px-14 2xl:px-20">
          {/* Top bar: identity, current measurement, and navigation back to full overview. */}
          <header className={`mb-4 flex shrink-0 flex-col gap-3 rounded-2xl p-4 shadow-sm ring-1 ring-slate-200/80 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:p-5 lg:mb-5 ${chrome?.topPanelBg ?? "bg-white/95"}`}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl lg:text-[1.75rem] xl:text-4xl">
                  Live flood status
                </h1>
                {activeLevel ? (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide sm:text-sm ${chrome?.pill}`}
                  >
                    {activeLevel}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-slate-500 sm:text-base">
                Advisory, safety checklist, and affected areas for the active level only.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 sm:shrink-0 sm:gap-6">
              <div className={`rounded-xl px-4 py-2 ring-1 ${chrome?.metricCard ?? "bg-slate-50 ring-slate-200/80"}`}>
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Water rise</p>
                <p className={`text-xl font-semibold tabular-nums sm:text-2xl lg:text-3xl ${chrome?.metricValue ?? "text-[#123985]"}`}>
                  {riseLevel}
                  <span className="ml-1 text-sm font-medium text-slate-500 sm:text-base">mm</span>
                </p>
              </div>
              <Link
                href="/Pages/Flood_Risk/Alert"
                className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-sm transition sm:text-base ${chrome?.overviewBtn ?? "bg-slate-900 hover:bg-slate-800"}`}
              >
                All levels overview
              </Link>
            </div>
          </header>

          {/* First-load fallback before level data is available. */}
          {!warning && (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200/80">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">📡</div>
              <p className="mt-4 text-lg font-medium text-slate-700 sm:text-xl">Waiting for flood data</p>
              <p className="mt-1 max-w-md text-sm text-slate-500 sm:text-base">
                When the sensor connects, your level, advisory, and maps will appear here.
              </p>
            </div>
          )}

          {/* Three-card live dashboard: advisory, actions, and impact details. */}
          {warning && activeLevel && levelRow && chrome && (
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-12 lg:grid-rows-1 lg:gap-5 lg:overflow-hidden xl:gap-6">
              {/* Advisory */}
              <section className={`flex min-h-0 flex-col overflow-hidden rounded-2xl shadow-md ring-1 ring-slate-200/80 lg:col-span-4 ${chrome.panelBg}`}>
                <div className={`h-1.5 shrink-0 ${chrome.bar} ${activeLevel === "Critical" ? "animate-pulse" : ""}`} />
                <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-5 lg:overflow-y-auto lg:overscroll-contain">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl ring-1 sm:h-16 sm:w-16 sm:text-4xl ${chrome.iconRing}`}
                      aria-hidden
                    >
                      {levelRow.icon}
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Advisory</p>
                      <p className="mt-1 text-xl font-semibold leading-snug text-slate-900 sm:text-2xl">{warning.headline}</p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600 sm:text-base lg:text-[1.05rem] lg:leading-relaxed">
                    {warning.detail}
                  </p>
                </div>
              </section>

              {/* Safety */}
              <section
                className={`flex min-h-0 flex-col overflow-hidden rounded-2xl shadow-md ring-1 ring-slate-200/80 lg:col-span-4 ${chrome.panelBg}`}
                aria-labelledby="live-safety-heading"
              >
                <div className={`h-1.5 shrink-0 ${chrome.bar}`} />
                <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
                  <h2
                    id="live-safety-heading"
                    className="shrink-0 text-lg font-semibold text-slate-900 sm:text-xl"
                  >
                    Safety checklist
                  </h2>
                  <ul className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1 sm:space-y-4">
                    {guidelines.map((item) => (
                      <li key={item} className="flex gap-3 text-sm leading-relaxed text-slate-700 sm:text-base">
                        <span
                          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${chrome.checklistDot}`}
                          aria-hidden
                        >
                          ✓
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* Impact */}
              <section className={`flex min-h-0 flex-col overflow-hidden rounded-2xl shadow-md ring-1 ring-slate-200/80 lg:col-span-4 ${chrome.panelBg}`}>
                <div className={`h-1.5 shrink-0 ${chrome.bar}`} />
                <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
                  <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="text-3xl sm:text-4xl" aria-hidden>
                        {levelRow.icon}
                      </span>
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">{levelRow.name}</h2>
                        <p className="text-sm font-medium text-slate-500 sm:text-base">
                          {estimatedDepthRangeByLevel[levelRow.name as LevelName]}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex shrink-0 flex-wrap gap-2">
                    <span className={`rounded-lg px-3 py-2 text-sm font-medium ${chrome.statChip}`}>
                      Threshold <span className="tabular-nums">{levelRow.threshold}</span> mm
                    </span>
                  </div>
                  <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain border-t border-slate-100 pt-4">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">First affected</h3>
                      <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700 sm:text-base">
                        {levelRow.firstAffected}
                      </pre>
                    </div>
                    {levelRow.nextAffected ? (
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Next affected</h3>
                        <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700 sm:text-base">
                          {levelRow.nextAffected}
                        </pre>
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Hard-stop modal for critical phase until user acknowledges. */}
          {activeLevel === "Critical" && alertPolicy?.showEmergencyModal && !criticalAcknowledged && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-2xl rounded-2xl border-4 border-red-500 bg-white p-6 shadow-2xl">
                <h2 className="text-3xl font-extrabold text-red-700">CRITICAL FLOOD EMERGENCY</h2>
                <p className="mt-3 text-base text-slate-700">
                  Severe inundation is expected. Move to higher ground immediately and avoid flooded routes.
                </p>
                <button
                  type="button"
                  onClick={() => setCriticalAcknowledged(true)}
                  className="mt-5 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
                >
                  I am aware - dismiss alert
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
