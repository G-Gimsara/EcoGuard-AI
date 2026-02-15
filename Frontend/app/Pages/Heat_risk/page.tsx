"use client";

import React from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  UserPlus,
  Thermometer,
  Droplets,
  Sun,
  Wind,
} from "lucide-react";

const HomePage = () => {
  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center text-white font-sans overflow-x-hidden">
      {/* Background Image with Dark Overlay */}
      <div
        className="fixed "
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1449156001447-fd698256f5bb?q=80&w=2070&auto=format&fit=crop')",
        }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 container mx-auto px-6 py-12 flex flex-col items-center">
        {/* Main Heading */}
        <header className="text-center mb-16 animate-fadeIn">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-orange-400 via-red-500 to-yellow-400 mb-4">
            Heat Island Risk Prediction <br /> &amp; Alert System
          </h1>
          <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto font-light">
            Advanced meteorological analysis to protect communities from
            extreme thermal conditions.
          </p>
        </header>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mb-20">
          {/* Dashboard Card */}
          <Link href="/Pages/Heat_risk/prediction" className="group">
            <div className="cursor-pointer bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl shadow-2xl hover:bg-white/20 transition-all duration-300 hover:-translate-y-2">
              <div className="bg-orange-500 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <LayoutDashboard size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-3">View Dashboard</h2>
              <p className="text-gray-300 mb-6">
                Access real-time data monitoring for future risk predictions
                and detailed analysis.
              </p>
              <button className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-orange-500 hover:text-white transition-colors">
                Open Dashboard
              </button>
            </div>
          </Link>

          {/* Register Card */}
          <Link href="/Pages/Heat_risk/register" className="group">
            <div className="cursor-pointer bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl shadow-2xl hover:bg-white/20 transition-all duration-300 hover:-translate-y-2">
              <div className="bg-blue-500 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <UserPlus size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-3">Register</h2>
              <p className="text-gray-300 mb-6">
                Register with our system to get critical risk alerts sent
                directly to your mobile device.
              </p>
              <button className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20">
                Join Now
              </button>
            </div>
          </Link>
        </div>

        {/* Info Section: Why Heat is Dangerous */}
        <section className="w-full max-w-5xl bg-black/40 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-sm">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-4">
              Why Heat is Dangerous
            </h2>
            <div className="h-1 w-20 bg-orange-500 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <p className="text-gray-300 leading-relaxed text-lg">
                Your body cools itself by sweating. When <strong>heat and humidity</strong> combine,
                sweat cannot evaporate effectively. This failure in natural
                cooling can quickly lead to{" "}
                <span className="text-orange-400 font-semibold">
                  heat exhaustion
                </span>{" "}
                or{" "}
                <span className="text-red-500 font-semibold">heatstroke</span>.
              </p>
              <p className="text-gray-400 italic">
                Our tool combines multiple complex factors to give you a true
                personal Heat Risk assessment so you can plan your day safely.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3 mb-2 text-orange-400 font-bold">
                  <Thermometer size={20} /> Heat Index
                </div>
                <p className="text-sm text-gray-400">
                  The &quot;Feels-like&quot; temperature combining air temp and
                  humidity.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3 mb-2 text-blue-400 font-bold">
                  <Droplets size={20} /> Humidity
                </div>
                <p className="text-sm text-gray-400">
                  High moisture content that prevents sweat-based cooling.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3 mb-2 text-green-400 font-bold">
                  <Wind size={20} /> Dew Point
                </div>
                <p className="text-sm text-gray-400">
                  The best measure of mugginess. Higher values feel more
                  oppressive.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3 mb-2 text-yellow-400 font-bold">
                  <Sun size={20} /> Solar Radiation
                </div>
                <p className="text-sm text-gray-400">
                  Direct sun adds 10–15°F to what you actually feel.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 1s ease-out forwards;
        }
      `}</style>
    </main>
  );
};

export default HomePage;

