import type { ReactNode } from "react";
import { FloodNotificationsProvider } from "./Notifications/hooks/useFloodNotifications";

// Provider so bell + notifications page share one list
export default function FloodRiskLayout({ children }: { children: ReactNode }) {
  return <FloodNotificationsProvider>{children}</FloodNotificationsProvider>;
}

