"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Navbar: React.FC = () => {
  const pathname = usePathname();

  // Central route list for Flood Risk module tabs.
  const navLinks = [
    { name: "Home", path: "/Pages/Flood_Risk/Dashboard" },
    { name: "Alert", path: "/Pages/Flood_Risk/Alert" },
    { name: "Report", path: "/Pages/Flood_Risk/Report" },
    { name: "Safety", path: "/Pages/Flood_Risk/Safety" },
  ] as const;

  return (
    <nav className="w-full flex justify-center py-4 relative z-20">
      <div className="flex flex-wrap items-center justify-center gap-0 border-b border-white/5">
        {navLinks.map((link) => {
          // Alert tab stays active for nested route: /Alert/Live.
          const isActive =
            pathname === link.path ||
            (link.path === "/Pages/Flood_Risk/Alert" && pathname.startsWith("/Pages/Flood_Risk/Alert"));

          return (
            <Link
              key={link.path} // ✅ unique key
              href={link.path} // ✅ correct href
              className="group relative"
            >
              <button
                className={`px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300
                bg-transparent text-black group-hover:text-orange-500
                ${isActive ? "text-orange-500" : ""}`}
              >
                {link.name}
              </button>

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
    </nav>
  );
};

export default Navbar;