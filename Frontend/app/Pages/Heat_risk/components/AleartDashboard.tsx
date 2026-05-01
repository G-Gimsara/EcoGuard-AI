"use client";

import React, { useEffect, useState } from "react";
import {
  RefreshCw,
  AlertTriangle,
  ThermometerSun,
  Droplets,
  Clock,
  Wind,
  Sun,
  Info,
  ShieldAlert,
  WifiOff,
  Activity,
  ShieldCheck,
  HeartPulse,
  AlertCircle,
} from "lucide-react";

interface HeatWarningMessage {
  risky_day: string;
  location: string;
  main_warning_message: string;
  possible_situations: string[];
  mitigation_strategies: string[];
}

interface HeatWarning {
  type: string;
  location: string;
  start_date: string;
  end_date: string;
  message: HeatWarningMessage;
}

interface HeatAlertData {
  hasDanger: boolean;
  warnings: HeatWarning[];
  generatedAt: string;
  dangerCount: number;
}

const detailedClassification = [
  {
    level: "Caution",
    range: "27°C – 32°C",
    effects: "Fatigue possible with prolonged exposure and physical activity.",
    mitigation: [
      "Stay hydrated by drinking water regularly, even if not thirsty (CDC)",
      "Wear lightweight, loose-fitting, light-colored clothing (CDC)",
      "Take breaks in shaded or cooler areas (NWS)",
    ],
    icon: <Activity className="h-5 w-5" />,
    dot: "#92400e",
    bg: "#fffbeb",
    leftBg: "#fef3c7",
    border: "#fcd34d",
    textColor: "#78350f",
    labelColor: "#92400e",
    badgeBg: "#fde68a",
  },
  {
    level: "Extreme Caution",
    range: "32°C – 41°C",
    effects: "Heat cramps and heat exhaustion possible.",
    mitigation: [
      "Drink more fluids and avoid alcohol or caffeine (CDC)",
      "Schedule outdoor activities during cooler parts of the day (WHO)",
      "Use sunscreen and wear protective clothing like hats (CDC)",
      "Check on vulnerable individuals such as elderly and children (CDC)",
    ],
    icon: <ShieldCheck className="h-5 w-5" />,
    dot: "#c2410c",
    bg: "#fff7ed",
    leftBg: "#fed7aa",
    border: "#fb923c",
    textColor: "#7c2d12",
    labelColor: "#9a3412",
    badgeBg: "#fdba74",
  },
  {
    level: "Danger",
    range: "41°C – 54°C",
    effects: "Heat exhaustion likely; heat stroke possible.",
    mitigation: [
      "Limit outdoor activity and stay indoors in air-conditioned places (CDC)",
      "Take cool showers or use wet cloths to reduce body temperature (WHO)",
      "Increase rest breaks and reduce physical exertion (NWS)",
      "Drink electrolyte solutions if sweating heavily (WHO)",
    ],
    icon: <HeartPulse className="h-5 w-5" />,
    dot: "#b91c1c",
    bg: "#fff1f2",
    leftBg: "#fecaca",
    border: "#f87171",
    textColor: "#7f1d1d",
    labelColor: "#991b1b",
    badgeBg: "#fca5a5",
  },
  {
    level: "Extreme Danger",
    range: "≥ 54°C",
    effects: "Heat stroke highly likely.",
    mitigation: [
      "Avoid all outdoor activities (NWS)",
      "Seek immediate medical attention if symptoms occur (CDC)",
      "Move to cooling centers or air-conditioned shelters (WHO)",
      "Continuously monitor for signs of heat stroke (CDC)",
    ],
    icon: <AlertCircle className="h-5 w-5" />,
    dot: "#9f1239",
    bg: "#fff0f3",
    leftBg: "#fda4af",
    border: "#fb7185",
    textColor: "#4c0519",
    labelColor: "#881337",
    badgeBg: "#fda4af",
  },
];

const HeatAlert: React.FC = () => {
  const [data, setData] = useState<HeatAlertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [openWarning, setOpenWarning] = useState<number | null>(0);

  const fetchHeatWarning = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("http://localhost:5000/api/heat-warning");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json as HeatAlertData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to fetch live data:", err);
      setError(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeatWarning();
    const interval = setInterval(fetchHeatWarning, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const dayWarnings = data?.warnings || [];
  const hasDanger = data?.hasDanger || false;

  const bannerLabel = error
    ? "Service Unavailable"
    : hasDanger
      ? `${data?.dangerCount} Danger Alert${data?.dangerCount !== 1 ? "s" : ""} Active`
      : "No Extreme Heat Detected";

  const bannerSub = error
    ? "Cannot reach weather server. Showing standard safety guidelines below."
    : hasDanger
      ? data?.warnings?.map((w) => `${w.message.risky_day} - ${w.location}`).join("  |  ")
      : "Next 15 days look safe for the Colombo district.";

  const sectionLabel: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    marginBottom: 8,
  };

  return (
    <div className="w-full max-w-8xl mx-auto min-h-screen" style={{ background: "linear-gradient(180deg, #f2f6fb 0%, #ecf3f8 100%)" }}>
       
       <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pt-9">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-orange-100 flex items-center justify-center">
            <ThermometerSun className="h-6 w-6" style={{ color: "#c2410c" }} />
          </div>
          <div>
            <h1 style={{ fontSize: 30, fontWeight: 900, color: "#0f172a", lineHeight: 1.1 }}>Colombo Heat Alert System</h1>
            <p style={{ fontSize: 15, color: "#475569", marginTop: 5 }}>Real-time heat index monitoring and safety guidance for the Colombo district.</p>
          </div>
        </div>
      </div>

      <div
        style={{
          background: error
            ? "linear-gradient(135deg, #1f2937 0%, #111827 100%)"
            : hasDanger
              ? "linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)"
              : "linear-gradient(135deg, #0f766e 0%, #0b5f59 100%)",
          position: "relative",
          overflow: "hidden",
          margin: "16px auto",
          maxWidth: "calc(100% - 32px)",
          borderRadius: "20px",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
        }}
      >

        
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 80% -20%, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.04) 40%, transparent 72%)",
            pointerEvents: "none",
          }}
        />

        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 flex flex-col lg:flex-row lg:items-center lg:justify-between" style={{ gap: 24, position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, flex: 1 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                background: "rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(255,255,255,0.2)",
                backdropFilter: "blur(8px)",
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
              }}
            >
              {error ? <WifiOff className="h-7 w-7 text-white" /> : hasDanger ? <AlertTriangle className="h-7 w-7 text-white animate-pulse" /> : <Sun className="h-7 w-7 text-white" />}
            </div>
            <div>
              <p style={{ fontSize: 28, fontWeight: 900, color: "#ffffff", lineHeight: 1.15 }}>{bannerLabel}</p>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.9)", marginTop: 7, lineHeight: 1.6, maxWidth: 680 }}>{bannerSub}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap lg:justify-end">
            {lastUpdated && !error && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "rgba(255,255,255,0.9)",
                  fontSize: 13,
                  fontWeight: 700,
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  padding: "8px 13px",
                  borderRadius: 12,
                }}
              >
                <Clock className="h-4 w-4" />
                {lastUpdated.toLocaleTimeString()}
              </div>
            )}
            <button
              onClick={fetchHeatWarning}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all"
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.28)",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.75 : 1,
                boxShadow: "0 8px 18px rgba(0,0,0,0.16)",
              }}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Syncing..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

     

      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-7 lg:py-9 flex flex-col gap-6">
        

        {!error && hasDanger && dayWarnings.length > 0 && (
          <div
            style={{
              background: "#ffffff",
              borderRadius: 18,
              border: "1px solid #fda4af",
              overflow: "hidden",
              boxShadow: "0 10px 30px rgba(220, 38, 38, 0.08)",
            }}
          >
            <div style={{ background: "linear-gradient(180deg, #fff1f2 0%, #ffe4e6 100%)", padding: "17px 22px", borderBottom: "1px solid #fecdd3", display: "flex", alignItems: "center", gap: 10 }}>
              <AlertTriangle className="h-5 w-5" style={{ color: "#be123c" }} />
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#881337" }}>Active Heat Warnings</h2>
              <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 800, background: "#fda4af", color: "#881337", padding: "5px 12px", borderRadius: 999 }}>
                {dayWarnings.length} alert{dayWarnings.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div style={{ padding: "8px 0" }}>
              {dayWarnings.map((warning, index) => (
                <div key={index} style={{ borderBottom: index < dayWarnings.length - 1 ? "1px solid #ffe4e6" : "none" }}>
                  <button
                    onClick={() => setOpenWarning(openWarning === index ? null : index)}
                    style={{ width: "100%", padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#e11d48", flexShrink: 0, marginTop: 6 }} />
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 800, color: "#be123c", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>{warning.type}</p>
                        <p style={{ fontSize: 17, fontWeight: 800, color: "#0f172a" }}>{warning.message.risky_day}</p>
                        <p style={{ fontSize: 14, color: "#334155", marginTop: 3 }}>
                          {warning.location} - {warning.start_date} to {warning.end_date}
                        </p>
                      </div>
                    </div>
                    <span style={{ color: "#be123c", fontSize: 12, transform: openWarning === index ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }}>v</span>
                  </button>

                  {openWarning === index && (
                    <div style={{ padding: "0 22px 22px 22px" }}>
                      <div style={{ marginLeft: 24, paddingLeft: 18, borderLeft: "2px solid #fda4af", display: "flex", flexDirection: "column", gap: 16 }}>
                        <div>
                          <p style={{ ...sectionLabel, color: "#9f1239" }}>Warning</p>
                          <p style={{ fontSize: 15, color: "#1e293b", lineHeight: 1.7 }}>{warning.message.main_warning_message}</p>
                        </div>
                        {warning.message.possible_situations?.length > 0 && (
                          <div>
                            <p style={{ ...sectionLabel, color: "#9f1239" }}>Possible situations</p>
                            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 7 }}>
                              {warning.message.possible_situations.map((item, i) => (
                                <li key={i} style={{ fontSize: 15, color: "#1e293b", display: "flex", alignItems: "flex-start", gap: 8 }}>
                                  <span style={{ color: "#e11d48", fontWeight: 800, flexShrink: 0, fontSize: 16 }}>{">"}</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {warning.message.mitigation_strategies?.length > 0 && (
                          <div>
                            <p style={{ ...sectionLabel, color: "#9f1239" }}>Mitigation strategies</p>
                            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 7 }}>
                              {warning.message.mitigation_strategies.map((step, i) => (
                                <li key={i} style={{ fontSize: 15, color: "#1e293b", display: "flex", alignItems: "flex-start", gap: 8 }}>
                                  <span style={{ color: "#16a34a", fontWeight: 800, flexShrink: 0, fontSize: 16 }}>+</span>
                                  {step}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ background: "#ffffff", borderRadius: 18, border: "1px solid #dbe4ef", overflow: "hidden", boxShadow: "0 12px 34px rgba(15,23,42,0.06)" }}>
          <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", padding: "22px 24px", borderBottom: "1px solid #334155" }}>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between" style={{ gap: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
                  <ThermometerSun className="h-6 w-6" style={{ color: "#fb923c" }} />
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: "#f8fafc" }}>Heat Index Protocol</h2>
                </div>
                <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.6 }}>
                  Standardized safety thresholds based on apparent temperature - how hot it feels when relative humidity is combined with air temperature.
                </p>
              </div>
              <a
                href="https://www.weather.gov/ama/heatindex"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#bfdbfe", background: "rgba(59,130,246,0.15)", border: "1px solid #3b82f6", padding: "8px 14px", borderRadius: 10, textDecoration: "none", whiteSpace: "nowrap", alignSelf: "flex-start" }}
              >
                <Info className="h-3.5 w-3.5" />
                National Weather Service(NWS)
              </a>
              <a
                href="https://www.cdc.gov/niosh/heat-stress/about/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#bfdbfe", background: "rgba(59,130,246,0.15)", border: "1px solid #3b82f6", padding: "8px 14px", borderRadius: 10, textDecoration: "none", whiteSpace: "nowrap", alignSelf: "flex-start" }}
              >
                <Info className="h-3.5 w-3.5" />
               Centers for Disease Control and Prevention(CDC)
              </a>
              <a
                href="https://www.who.int/home/search-results?indexCatalogue=genericsearchindex1&q=heat&wordsMode=AnyWord#gsc.tab=0&gsc.q=heat&gsc.page=1"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#bfdbfe", background: "rgba(59,130,246,0.15)", border: "1px solid #3b82f6", padding: "8px 14px", borderRadius: 10, textDecoration: "none", whiteSpace: "nowrap", alignSelf: "flex-start" }}
              >
                <Info className="h-3.5 w-3.5" />
                World Health Organization(WHO)
              </a>
            </div>
          </div>

          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
            {detailedClassification.map((item, idx) => (
              <div key={idx} style={{ borderRadius: 14, border: `1px solid ${item.border}`, overflow: "hidden", background: item.bg }}>
                <div className="flex flex-col lg:flex-row">
                  <div
                    style={{
                      background: item.leftBg,
                      padding: "18px 20px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      gap: 11,
                      minWidth: 220,
                      flexShrink: 0,
                      borderRight: `1px solid ${item.border}`,
                      borderBottom: `1px solid ${item.border}`,
                      
                    }}
                    className="lg:border-b-0"
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: item.badgeBg, color: item.textColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {item.icon}
                      </div>
                      <span style={{ fontSize: 16, fontWeight: 800, color: item.textColor }}>{item.level}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: item.labelColor, background: item.badgeBg, padding: "5px 12px", borderRadius: 8, display: "inline-block", alignSelf: "flex-start", border: `1px solid ${item.border}` }}>{item.range}</span>
                  </div>

                  <div style={{ flex: 1, padding: "18px 20px", borderRight: `1px solid ${item.border}`, borderBottom: `1px solid ${item.border}` }} className="lg:border-b-0">
                    <p style={{ ...sectionLabel, color: item.labelColor }}>Physiological Effect</p>
                    <p style={{ fontSize: 20, color: "#1e293b", lineHeight: 1.7, fontStyle: "italic" }}>
                      "{item.effects}"
                    </p>
                  </div>

                  <div style={{ flex: 1, padding: "18px 20px" }}>
                    <p style={{ ...sectionLabel, color: item.labelColor }}>Mitigation Strategy</p>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 9 }}>
                      {item.mitigation.map((step, i) => (
                        <li key={i} style={{ fontSize: 20, color: "#1e293b", display: "flex", alignItems: "flex-start", gap: 10, lineHeight: 1.55 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: item.dot, flexShrink: 0, marginTop: 7 }} />
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ margin: "0 20px 20px 20px", padding: "15px 18px", background: "#eff6ff", borderRadius: 12, border: "1px solid #bfdbfe", display: "flex", alignItems: "flex-start", gap: 13 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#bfdbfe", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldAlert className="h-4 w-4" style={{ color: "#1d4ed8" }} />
            </div>
            <p style={{ fontSize: 14, color: "#1e3a8a", lineHeight: 1.7 }}>
              <strong style={{ fontWeight: 800 }}>Important:</strong> The Heat Index indicates how hot it feels when relative humidity is combined with air temperature. 
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatAlert;
