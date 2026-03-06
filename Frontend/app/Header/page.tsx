"use client";

import Image from "next/image";
import Logo from "@/app/Images/logo.png";
import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full bg-[#123985] text-white shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        
        {/* LEFT: Logo */}
        <Link href="/" >
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12">
            <Image
              src={Logo}
              alt="Logo"
              fill
              className="object-contain"
            />
          </div>
          {/* Optional: Logo Text */}
          <span className="font-medium text-sm md:text-base opacity-90 tracking-wide hidden md:inline">
          </span>
        </div>
        </Link>

        {/* CENTER: Title */}
        <div className="flex-1 text-center">
          <h1 className="text-lg md:text-xl lg:text-2xl font-bold tracking-tight leading-tight">
            ENVIRONMENTAL RISK AND RESOURCE MANAGEMENT AI SYSTEM
          </h1>
          <p className="text-xs md:text-sm opacity-80 mt-0.5">
            Towards Smart Environment
          </p>
        </div>

        {/* RIGHT: Placeholder for actions/icons */}
        <div className="flex items-center gap-4">
       
        </div>

      </div>
    </header>
  );
}