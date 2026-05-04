//  thresholds in ascending order.
export const levels = [
  { threshold: 0, name: "Normal", firstAffected: "No areas affected", nextAffected: "", floodFeet: 0, icon: "🌿" },
  { threshold: 40, name: "Alert", firstAffected: "Megoda Kolonnawa GND — 1 ft ankle-deep", nextAffected: "", floodFeet: 4, icon: "⚠️" },
  { threshold: 75, name: "Minor", firstAffected: "Megoda Kolonnawa — 2 ft home entry\nWalpola GND Kaduwela — 1 ft yards", nextAffected: "", floodFeet: 5, icon: "💧" },
  { threshold: 110, name: "Moderate", firstAffected: "Megoda Kolonnawa — 3-4 ft major homes\nWalpola — 2 ft roads", nextAffected: "Wellampitiya — 1 ft pooling\nKelanimulla GND Kolonnawa — 1-2 ft", floodFeet: 6.5, icon: "🌊" },
  { threshold: 145, name: "Major", firstAffected: "Megoda Kolonnawa — 4-6 ft evacuation\nWalpola — 3 ft households", nextAffected: "Wellampitiya — 2-3 ft\nKelaniya — 1-2 ft\nMahadeniya Kaduwela — 2 ft", floodFeet: 7, icon: "🚨" },
  { threshold: 180, name: "Critical", firstAffected: "Megoda Kolonnawa — 6-10 ft severe\nWalpola — 4-6 ft", nextAffected: "Wellampitiya/Kelaniya — 3-5 ft\nKaduwela DSD — 3-4 ft", floodFeet: 8, icon: "🔥" },
] as const;

export type LevelName = (typeof levels)[number]["name"];


export type FloodCardHeaderPx = { icon: number; name: number; feet: number };

export const floodCardHeaderPx: Record<LevelName, FloodCardHeaderPx> = {
  Normal: { icon: 34, name: 22, feet: 22 },
  Alert: { icon: 34, name: 22, feet: 22 },
  Minor: { icon: 34, name: 22, feet: 22 },
  Moderate: { icon: 34, name: 22, feet: 22 },
  Major: { icon: 34, name: 22, feet: 22 },
  Critical: { icon: 34, name: 22, feet: 22 },
};

export interface WebAlertPolicy {
  channels: string[];
  repeatMinutes: number | null;
  requiresAcknowledge: boolean;
  showEmergencyModal: boolean;
}

// Warning message shown for each level.
export const levelWarnings: Record<LevelName, { headline: string; detail: string; bannerClass: string }> = {
  Normal: {
    headline: "Conditions stable",
    detail: "Water levels are within normal range. Continue routine activities and stay aware of weather updates.",
    bannerClass: "bg-green-600 text-white",
  },
  Alert: {
    headline: "Flood alert - early rise detected",
    detail: "Low-lying areas may see shallow water. Monitor official advisories and avoid unnecessary travel near streams and drains.",
    bannerClass: "bg-yellow-500 text-yellow-950",
  },
  Minor: {
    headline: "Minor flooding possible",
    detail: "Some roads and yards may flood. Protect valuables on ground floors and plan alternate routes before water deepens.",
    bannerClass: "bg-orange-400 text-orange-950",
  },
  Moderate: {
    headline: "Moderate flood risk",
    detail: "Homes and roads in listed areas may be significantly affected. Be ready to move to safer ground if conditions worsen.",
    bannerClass: "bg-orange-600 text-white",
  },
  Major: {
    headline: "Major flood warning",
    detail: "Evacuation may be required in low areas. Do not enter flood water; follow instructions from local authorities immediately.",
    bannerClass: "bg-red-600 text-white animate-pulse",
  },
  Critical: {
    headline: "Critical flood emergency",
    detail: "Severe inundation expected. Leave flood-prone zones now if safe to do so; avoid all flooded routes and underground spaces.",
    bannerClass: "bg-red-800 text-white animate-pulse ring-2 ring-red-300",
  },
};

// Web alert escalation plan for each risk level.
export const webAlertPolicies: Record<LevelName, WebAlertPolicy> = {
  Normal: {
    channels: ["In-app status card","Browser Notification Bell "],
    repeatMinutes: null,
    requiresAcknowledge: false,
    showEmergencyModal: false,
  },
  Alert: {
    channels: ["In-app banner","Browser Notification Bell "],
    repeatMinutes: null,
    requiresAcknowledge: false,
    showEmergencyModal: false,
  },
  Minor: {
    channels: ["In-app banner", "Browser Notification Bell "],
    repeatMinutes: null,
    requiresAcknowledge: false,
    showEmergencyModal: false,
  },
  Moderate: {
    channels: ["In-app banner", "Browser Notification Bell "],
    repeatMinutes: null,
    requiresAcknowledge: false,
    showEmergencyModal: false,
  },
  Major: {
    channels: ["In-app banner", "Browser Notification Bell ", "SMS)"],
    repeatMinutes: 15,
    requiresAcknowledge: false,
    showEmergencyModal: false,
  },
  Critical: {
    channels: ["Full-screen emergency modal", "Browser push","Browser Notification Bell ", "SMS"],
    repeatMinutes: 5,
    requiresAcknowledge: true,
    showEmergencyModal: true,
  },
};

// Safety guidance shown for each level.
export const safetyGuidelines: Record<LevelName, string[]> = {
  Normal: [
    "Keep emergency contacts and a battery-powered radio or charged phone handy during heavy rain.",
    "Clear drains and gutters around your home when rain is forecast.",
    "Know your evacuation route and nearest shelter before any alert.",
  ],
  Alert: [
    "Charge phones and power banks; gather documents, medicines, and a torch in one place.",
    "Move vehicles to higher ground if you are in a listed or low-lying area.",
    "Avoid walking or driving through even shallow moving water.",
  ],
  Minor: [
    "Raise furniture and electrical items off the floor where flooding is possible.",
    "Do not let children play in flood water — it may hide holes or contamination.",
    "Use official updates only; avoid rumours on social media.",
  ],
  Moderate: [
    "Pack a go-bag: water, food, first aid, copies of ID, cash, and essential medication.",
    "Turn off gas and non-essential electricity only if instructed or if water is entering outlets.",
    "If you must travel, use only confirmed safe routes; never cross a flooded road.",
  ],
  Major: [
    "Evacuate to higher ground or a designated shelter when advised - delay increases risk.",
    "Never enter flood water: it can hide currents, debris, and live electrical hazards.",
    "Help neighbours who need assistance only if you can do so without putting yourself at risk.",
  ],
  Critical: [
    "Leave immediately if water is rising or authorities order evacuation; take your go-bag.",
    "Do not shelter in basements, underpasses, or near fast-moving water.",
    "After the peak, return only when officials say it is safe; beware of structural damage and mudslides.",
  ],
};

/** Full depth line for cards: non-overlapping bands, en dash, "ft", "<" on upper bound (Critical: 8+). */
export const estimatedDepthRangeByLevel: Record<LevelName, string> = {
  Normal: "Estimated Depth Range: (0-<4 ft)",
  Alert: "Estimated Depth Range: (4-<5 ft)",
  Minor: "Estimated Depth Range: (5-<6.5 ft)",
  Moderate: "Estimated Depth Range: (6.5-<7 ft)",
  Major: "Estimated Depth Range: (7-<8 ft)",
  Critical: "Estimated Depth Range: (8+ ft)",
};

/** Compact band next to level title (same numeric bands as `estimatedDepthRangeByLevel`). */
export const depthRangeCompact: Record<LevelName, string> = {
  Normal: "0-<4 ft",
  Alert: "4-<5 ft",
  Minor: "5-<6.5 ft",
  Moderate: "6.5-<7 ft",
  Major: "7-<8 ft",
  Critical: "8+ ft",
};

/** @deprecated Prefer `depthRangeCompact` or `estimatedDepthRangeByLevel`. */
export const feetRanges = depthRangeCompact;

// Returns left border color class for each level.
export function getColor(name: string) {
  switch (name) {
    case "Normal": return "border-green-500";
    case "Alert": return "border-yellow-500";
    case "Minor": return "border-orange-400";
    case "Moderate": return "border-orange-500";
    case "Major": return "border-red-500";
    case "Critical": return "border-red-700";
    default: return "border-gray-300";
  }
}

// Returns badge color class for each level.
export function getBadge(name: string) {
  switch (name) {
    case "Normal": return "bg-green-100 text-green-700";
    case "Alert": return "bg-yellow-100 text-yellow-700";
    case "Minor": return "bg-orange-100 text-orange-700";
    case "Moderate": return "bg-orange-200 text-orange-800";
    case "Major": return "bg-red-100 text-red-700";
    case "Critical": return "bg-red-600 text-white";
    default: return "bg-gray-100";
  }
}

// Returns highlight style for the active level card.
export function getActiveGradient(name: string) {
  switch (name) {
    case "Normal": return "bg-gradient-to-br from-green-200 to-green-400";
    case "Alert": return "bg-gradient-to-br from-yellow-200 to-yellow-400";
    case "Minor": return "bg-gradient-to-br from-orange-200 to-orange-400";
    case "Moderate": return "bg-gradient-to-br from-orange-300 to-orange-500";
    case "Major": return "bg-gradient-to-br from-red-400 to-red-600 text-white";
    case "Critical": return "bg-gradient-to-br from-red-700 to-red-900 text-white animate-pulse";
    default: return "bg-white";
  }
}

export function getLevelRow(severity: string) {
  // Returns full level details for a severity value.
  return levels.find((l) => l.name === severity);
}

/**
 * Affected-area lines for a level, derived from `levels` first/next affected text 
 * Normal returns an empty list; use `getNormalAffectedAreasLabel()` for the Normal display string.
 */
export function getAffectedAreaLinesForLevel(level: LevelName): string[] {
  const row = levels.find((l) => l.name === level);
  if (!row || level === "Normal") return [];
  const lines: string[] = [];
  if (row.firstAffected) {
    lines.push(...row.firstAffected.split("\n").map((s) => s.trim()).filter(Boolean));
  }
  if (row.nextAffected) {
    lines.push(...row.nextAffected.split("\n").map((s) => s.trim()).filter(Boolean));
  }
  return lines;
}

/** Label for Normal when no geographic list applies (from `levels` Normal row). */
export function getNormalAffectedAreasLabel(): string {
  return levels.find((l) => l.name === "Normal")?.firstAffected ?? "No areas affected";
}
