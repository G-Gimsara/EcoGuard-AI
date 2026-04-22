"use client";

import React, { useEffect, useState } from 'react';
import {
  RefreshCw, AlertTriangle, ThermometerSun, Droplets,
  Clock, Wind, Sun, Info, ShieldAlert, WifiOff,
  Activity, ShieldCheck, HeartPulse, AlertCircle
} from 'lucide-react';

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
    effects: "Fatigue possible with prolonged exposure and/or physical activity.",
    mitigation: [
      "Drink water frequently (250 ml every 20 mins)",
      "Wear lightweight, light-colored clothing",
      "Take regular rest breaks in shaded areas",
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
    range: "32°C – 39°C",
    effects: "Heat stroke, cramps, or exhaustion possible with prolonged exposure and/or physical activity.",
    mitigation: [
      "Use electrolyte-replacement drinks",
      "Limit strenuous activities to early morning",
      "Monitor vulnerable peers, children, and elderly",
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
    range: "39°C – 51°C",
    effects: "Heat cramps or exhaustion likely, and heat stroke possible with prolonged exposure and/or physical activity.",
    mitigation: [
      "Strict work/rest cycles (15 min rest per 45 min work)",
      "Stay in air-conditioned environments if possible",
      "Wet skin with cool water or use damp cloths",
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
    range: "52°C or higher",
    effects: "Heat stroke highly likely. High risk of severe organ damage or failure.",
    mitigation: [
      "Cease all outdoor activity immediately",
      "Call emergency services if symptoms appear",
      "Evacuate to designated cooling centers",
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
      const res = await fetch('http://localhost:5000/api/heat-warning');
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

  const bannerBg = error ? '#1e293b' : hasDanger ? '#dc2626' : '#059669';
  const bannerLabel = error
    ? 'Service Unavailable'
    : hasDanger
      ? `${data?.dangerCount} Danger Alert${data?.dangerCount !== 1 ? 's' : ''} Active`
      : 'No Extreme Heat Detected';
  const bannerSub = error
    ? 'Cannot reach weather server. Showing standard safety guidelines below.'
    : hasDanger
      ? data?.warnings?.map(w => `${w.message.risky_day} · ${w.location}`).join('  •  ')
      : 'Next 15 days look safe for the Colombo district.';
  const bannerIcon = error
    ? <WifiOff className="h-6 w-6 text-white" />
    : hasDanger
      ? <AlertTriangle className="h-6 w-6 text-white" />
      : <Sun className="h-6 w-6 text-white" />;

  /* shared card style */
  const card: React.CSSProperties = {
    background: '#ffffff',
    borderRadius: 20,
    border: '2px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: 11, fontWeight: 800,
    textTransform: 'uppercase', letterSpacing: '0.12em',
    marginBottom: 8,
  };

  return (
    <div className="w-full max-w-[100%] mx-auto min-h-screen" style={{ backgroundColor: '#e8edf3' }}>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          STATUS BANNER
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div style={{ background: bannerBg }}>
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between b"
          style={{ gap: 16 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 50, height: 50, borderRadius: 14,
              background: 'rgba(255,255,255,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {bannerIcon}
            </div>
            <div>
              <p style={{ fontSize: 21, fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>{bannerLabel}</p>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.88)', marginTop: 4, lineHeight: 1.4 }}>{bannerSub}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, alignSelf: 'flex-end' }} className="sm:self-auto">
            {lastUpdated && !error && (
              <span style={{ color: 'rgba(255,255,255,0.82)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Clock className="h-3.5 w-3.5" />
                {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={fetchHeatWarning}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 18px', borderRadius: 10,
                background: 'rgba(255,255,255,0.18)',
                border: '1.5px solid rgba(255,255,255,0.4)',
                color: '#ffffff', fontSize: 14, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Syncing…' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          PAGE TITLE
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ paddingTop: 32, paddingBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ThermometerSun className="h-7 w-7" style={{ color: '#ea580c' }} />
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a' }}>Colombo Heat Alert System</h1>
        </div>
        <p style={{ fontSize: 16, color: '#334155', marginTop: 6 }}>
          Real-time heat index monitoring and safety guidance for the Colombo district.
        </p>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          CONTENT
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ paddingTop: 24, paddingBottom: 40, display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* QUICK ACTIONS */}
        <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 16 }}>
          {[
            { icon: <Droplets className="h-5 w-5" />, iconColor: '#1d4ed8', iconBg: '#dbeafe', title: "Hydrate Often", sub: "Drink water every 15–20 minutes" },
            { icon: <Sun className="h-5 w-5" />, iconColor: '#b45309', iconBg: '#fef3c7', title: "Avoid Peak Sun", sub: "Stay indoors between 10 AM – 4 PM" },
            { icon: <Wind className="h-5 w-5" />, iconColor: '#0f766e', iconBg: '#ccfbf1', title: "Seek Cool Spaces", sub: "Find AC or shaded areas to rest" },
          ].map((tip, i) => (
            <div key={i} style={{
              background: '#ffffff', borderRadius: 16,
              border: '2px solid #e2e8f0',
              padding: '18px 20px',
              display: 'flex', alignItems: 'center', gap: 16,
              boxShadow: '0 1px 5px rgba(0,0,0,0.06)',
            }}>
              <div style={{
                width: 46, height: 46, borderRadius: 13,
                background: tip.iconBg, color: tip.iconColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {tip.icon}
              </div>
              <div>
                <p style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>{tip.title}</p>
                <p style={{ fontSize: 14, color: '#334155', marginTop: 3 }}>{tip.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* LIVE DANGER WARNINGS */}
        {!error && hasDanger && dayWarnings.length > 0 && (
          <div style={{ ...card, border: '2px solid #fca5a5', boxShadow: '0 2px 12px rgba(220,38,38,0.10)' }}>
            <div style={{
              background: '#fee2e2', padding: '18px 24px',
              borderBottom: '2px solid #fca5a5',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <AlertTriangle className="h-5 w-5" style={{ color: '#dc2626' }} />
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#7f1d1d' }}>Active Heat Warnings</h2>
              <span style={{
                marginLeft: 'auto', fontSize: 13, fontWeight: 700,
                background: '#fca5a5', color: '#7f1d1d',
                padding: '4px 14px', borderRadius: 20,
              }}>
                {dayWarnings.length} alert{dayWarnings.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div style={{ padding: '8px 0' }}>
              {dayWarnings.map((warning, index) => (
                <div key={index} style={{ borderBottom: index < dayWarnings.length - 1 ? '1.5px solid #fee2e2' : 'none' }}>
                  <button
                    onClick={() => setOpenWarning(openWarning === index ? null : index)}
                    style={{
                      width: '100%', padding: '16px 24px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: '#dc2626', flexShrink: 0, marginTop: 6,
                      }} />
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 3 }}>
                          {warning.type}
                        </p>
                        <p style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>{warning.message.risky_day}</p>
                        <p style={{ fontSize: 14, color: '#334155', marginTop: 3 }}>
                          {warning.location} &middot; {warning.start_date} to {warning.end_date}
                        </p>
                      </div>
                    </div>
                    <span style={{
                      color: '#dc2626', fontSize: 13,
                      transform: openWarning === index ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s', flexShrink: 0,
                    }}>▼</span>
                  </button>

                  {openWarning === index && (
                    <div style={{ padding: '0 24px 22px 24px' }}>
                      <div style={{
                        marginLeft: 24, paddingLeft: 20,
                        borderLeft: '3px solid #fca5a5',
                        display: 'flex', flexDirection: 'column', gap: 18,
                      }}>
                        <div>
                          <p style={{ ...sectionLabel, color: '#991b1b' }}>Warning</p>
                          <p style={{ fontSize: 15, color: '#1e293b', lineHeight: 1.7 }}>{warning.message.main_warning_message}</p>
                        </div>
                        {warning.message.possible_situations?.length > 0 && (
                          <div>
                            <p style={{ ...sectionLabel, color: '#991b1b' }}>Possible situations</p>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
                              {warning.message.possible_situations.map((item, i) => (
                                <li key={i} style={{ fontSize: 15, color: '#1e293b', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                  <span style={{ color: '#dc2626', fontWeight: 800, flexShrink: 0, fontSize: 16 }}>›</span>{item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {warning.message.mitigation_strategies?.length > 0 && (
                          <div>
                            <p style={{ ...sectionLabel, color: '#991b1b' }}>Mitigation strategies</p>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
                              {warning.message.mitigation_strategies.map((step, i) => (
                                <li key={i} style={{ fontSize: 15, color: '#1e293b', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                  <span style={{ color: '#16a34a', fontWeight: 800, flexShrink: 0, fontSize: 16 }}>✓</span>{step}
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

        {/* HEAT INDEX PROTOCOL */}
        <div style={card}>
          {/* Header */}
          <div style={{
            background: '#1e293b', padding: '22px 24px',
            borderBottom: '2px solid #334155',
          }}>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between" style={{ gap: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <ThermometerSun className="h-6 w-6" style={{ color: '#fb923c' }} />
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f8fafc' }}>Heat Index Protocol</h2>
                </div>
                <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>
                  Standardized safety thresholds based on apparent temperature — how hot it feels when relative humidity is combined with air temperature.
                </p>
              </div>
              <a
                href="https://www.weather.gov/ama/heatindex"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  fontSize: 13, fontWeight: 700, color: '#93c5fd',
                  background: 'rgba(59,130,246,0.15)', border: '1.5px solid #3b82f6',
                  padding: '9px 18px', borderRadius: 10,
                  textDecoration: 'none', whiteSpace: 'nowrap', alignSelf: 'flex-start',
                }}
              >
                <Info className="h-3.5 w-3.5" />
                NOAA / NWS Source
              </a>
            </div>
          </div>

          {/* Classification rows */}
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {detailedClassification.map((item, idx) => (
              <div key={idx} style={{
                borderRadius: 16,
                border: `2px solid ${item.border}`,
                overflow: 'hidden',
                background: item.bg,
              }}>
                <div className="flex flex-col lg:flex-row">

                  {/* Left: level */}
                  <div style={{
                    background: item.leftBg,
                    padding: '20px 22px',
                    display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', gap: 12,
                    minWidth: 200, flexShrink: 0,
                  }}
                    className="border-b-2 lg:border-b-0 lg:border-r-2"
                    // Tailwind dynamic won't work for custom colors; border set via style
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 10,
                        background: item.badgeBg, color: item.textColor,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {item.icon}
                      </div>
                      <span style={{ fontSize: 17, fontWeight: 800, color: item.textColor }}>{item.level}</span>
                    </div>
                    <span style={{
                      fontSize: 14, fontWeight: 700, color: item.labelColor,
                      background: item.badgeBg,
                      padding: '5px 14px', borderRadius: 8,
                      display: 'inline-block', alignSelf: 'flex-start',
                      border: `1px solid ${item.border}`,
                    }}>
                      {item.range}
                    </span>
                  </div>

                  {/* Middle: effect */}
                  <div style={{
                    flex: 1, padding: '20px 22px',
                    borderRight: `2px solid ${item.border}`,
                  }}
                    className="border-b-2 lg:border-b-0"
                  >
                    <p style={{ ...sectionLabel, color: item.labelColor }}>Physiological Effect</p>
                    <p style={{ fontSize: 15, color: '#1e293b', lineHeight: 1.7, fontStyle: 'italic' }}>
                      "{item.effects}"
                    </p>
                  </div>

                  {/* Right: mitigation */}
                  <div style={{ flex: 1, padding: '20px 22px' }}>
                    <p style={{ ...sectionLabel, color: item.labelColor }}>Mitigation Strategy</p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
                      {item.mitigation.map((step, i) => (
                        <li key={i} style={{ fontSize: 15, color: '#1e293b', display: 'flex', alignItems: 'flex-start', gap: 10, lineHeight: 1.55 }}>
                          <span style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: item.dot, flexShrink: 0, marginTop: 6,
                          }} />
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div style={{
            margin: '0 20px 20px 20px', padding: '16px 20px',
            background: '#eff6ff', borderRadius: 14,
            border: '1.5px solid #bfdbfe',
            display: 'flex', alignItems: 'flex-start', gap: 14,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: '#bfdbfe', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ShieldAlert className="h-4 w-4" style={{ color: '#1d4ed8' }} />
            </div>
            <p style={{ fontSize: 15, color: '#1e3a8a', lineHeight: 1.7 }}>
              <strong style={{ fontWeight: 800 }}>Important:</strong> The Heat Index indicates how hot it feels when relative humidity is combined with air temperature.
              Exposure to full sunshine can increase heat index values by up to{' '}
              <strong style={{ fontWeight: 800 }}>8°C</strong> beyond the shaded reading.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HeatAlert;
