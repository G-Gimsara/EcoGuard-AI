"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import NotificationBell from "../Notifications/components/NotificationBell";
import { useFloodNotifications } from "../Notifications/hooks/useFloodNotifications";

const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { unreadCount } = useFloodNotifications();

  // Central route list for Flood Risk module tabs.
  const navLinks = [
    { name: "Home", path: "/Pages/Flood_Risk/Dashboard" },
    { name: "Alert", path: "/Pages/Flood_Risk/Alert" },
    { name: "Report", path: "/Pages/Flood_Risk/Report" },
    { name: "Safety", path: "/Pages/Flood_Risk/Safety" },
    { name: "Alert Subscription", path: "/Pages/Flood_Risk/Register" },
  ] as const;

  // Preload Flood routes to reduce click-to-render delay between tabs.
  useEffect(() => {
    navLinks.forEach((link) => router.prefetch(link.path));
  }, [router]);

  return (
    <nav className="relative z-20 flex w-full justify-center py-4">
      <div className="relative flex w-full max-w-7xl items-center justify-center px-6">
        <div className="flex flex-wrap items-center justify-center gap-0 border-b border-white/5 pr-14 sm:pr-16">
          {navLinks.map((link) => {
            // Alert tab stays active for nested route: /Alert/Live.
            const isActive =
              pathname === link.path ||
              (link.path === "/Pages/Flood_Risk/Alert" && pathname.startsWith("/Pages/Flood_Risk/Alert"));

            return (
              <Link
                key={link.path}
                href={link.path}
                prefetch
                className="group relative inline-flex items-center"
              >
                <span
                  className={`px-8 py-4 text-[12px] font-black uppercase tracking-[0.2em] transition-all duration-300
                bg-transparent text-black group-hover:text-orange-500
                ${isActive ? "text-orange-500" : ""}`}
                >
                  {link.name}
                </span>

                {/* Active underline */}
                <div
                  className={`absolute bottom-0 left-0 h-0.5 bg-orange-600/40 transition-all duration-300 ${
                    isActive ? "w-full" : "w-0"
                  } group-hover:opacity-0`}
                />

                {/* Hover underline */}
                <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-orange-500 transition-all duration-300 group-hover:w-full shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
              </Link>
            );
          })}
        </div>

        <div className="absolute right-6 top-1/2 z-30 flex -translate-y-1/2 shrink-0 items-center justify-center sm:right-8">
          <NotificationBell unreadCount={unreadCount} />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;