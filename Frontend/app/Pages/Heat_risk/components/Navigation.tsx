"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NavigationBar: React.FC = () => {
  const pathname = usePathname();

  const navLinks = [
    { name: "Risk Alerts", href: "/Pages/Heat_risk/alerts" },
    { name: "Alert Subscription", href: "/Pages/Heat_risk/alert-subscription" },
    { name: "Forecasts", href: "/Pages/Heat_risk/prediction" },
    { name: "Division Comparison", href: "/Pages/Heat_risk/divisionHeatmap" },
    { name: "Geographical Map", href: "/Pages/Heat_risk/map" },
  ] as const;

  return (
    <nav className="w-full flex justify-center py-4 relative z-20">
      <div className="flex flex-wrap items-center justify-center gap-0 border-b border-white/5">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className="group relative"
            >
              <button
                className={`px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300
                bg-transparent text-black group-hover:text-orange-500
                ${isActive ? "text-orange-500" : ""}`}
              >
                {link.name}
              </button>

              {/* Active line */}
              <div
                className={`absolute bottom-0 left-0 h-0.5 bg-orange-600/40 transition-all duration-300 ${
                  isActive ? "w-full" : "w-0"
                } group-hover:opacity-0`}
              />

              {/* Hover line */}
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-orange-500 transition-all duration-300 group-hover:w-full shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default NavigationBar;

