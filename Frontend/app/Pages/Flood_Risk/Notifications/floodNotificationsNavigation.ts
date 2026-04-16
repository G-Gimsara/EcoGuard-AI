// sessionStorage: where to return after closing notifications (bell)
const STORAGE_KEY = "ecoguard_flood_notifications_return";

export const FLOOD_NOTIFICATIONS_PATH = "/Pages/Flood_Risk/Notifications";
export const FLOOD_NOTIFICATIONS_FALLBACK = "/Pages/Flood_Risk/Alert";

const FLOOD_RISK_PREFIX = "/Pages/Flood_Risk";

function isValidStoredPath(path: string): boolean {
  if (!path.startsWith(FLOOD_RISK_PREFIX)) return false;
  if (path === FLOOD_NOTIFICATIONS_PATH || path.startsWith(`${FLOOD_NOTIFICATIONS_PATH}/`)) {
    return false;
  }
  return true;
}

export function setFloodReturnPathFromNavigation(currentPathname: string): void {
  if (typeof window === "undefined") return;
  if (!isValidStoredPath(currentPathname)) return;
  sessionStorage.setItem(STORAGE_KEY, currentPathname);
}

export function getFloodReturnPath(): string | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw || !isValidStoredPath(raw)) return null;
  return raw;
}

export function clearFloodReturnPath(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
