"use client";

import React from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Thermometer,
  Droplets,
  Sun,
  ArrowRight,
  ShieldCheck,
  Activity,
  Waves,
  Navigation,
} from "lucide-react";

const HomePage = () => {
  return (
    <main className="relative min-h-screen w-full flex flex-col items-center text-slate-900 font-sans overflow-x-hidden bg-linear-to-b from-slate-50 via-white to-slate-50">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-20 left-[10%] w-96 h-96 bg-linear-to-br from-orange-200/30 to-red-200/20 rounded-full blur-[120px] -z-10" />
      <div className="absolute top-40 right-[10%] w-96 h-96 bg-linear-to-br from-blue-200/30 to-cyan-200/20 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-40 left-[20%] w-80 h-80 bg-linear-to-br from-amber-200/20 to-orange-200/15 rounded-full blur-[100px] -z-10" />

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-6 pt-24 pb-16 flex flex-col items-center">
        
        <header className="text-center mb-12 animate-fadeIn">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-linear-to-r from-orange-50 to-red-50 border border-orange-200/50 shadow-sm text-orange-700 text-xs font-bold uppercase tracking-widest mb-8">
            <Activity size={14} className="text-orange-500 animate-pulse" />
            <span>Live Environmental Monitoring</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-8 leading-[1.1]">
            <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-500 via-red-500 to-amber-500">
              Heat Risk
            </span> 
            <br />
            <span className="text-blue-600">
              Prediction & Alert System
            </span>
          </h1>
          
          <p className="text-slate-600 text-lg md:text-xl max-w-3xl mx-auto font-normal leading-relaxed mb-12">
            “Utilizing high-frequency meteorological data, IoT-based environmental sensors, and AI-driven predictive models to monitor and visualize urban thermal hazards before they impact communities”
          </p>

          {/* Primary CTA: Full Width Dashboard Entry */}
          <div className="w-full max-w-2xl mx-auto">
            <Link href="/Pages/Heat_risk/prediction" className="group">
              <div className="relative overflow-hidden bg-linear-to-br from-slate-900 to-slate-800 text-white p-1 rounded-[2.5rem] shadow-2xl shadow-slate-900/20 transition-all duration-500 hover:scale-[1.02] hover:shadow-3xl">
                <div className="flex items-center justify-between px-8 py-6 bg-linear-to-br from-slate-900 to-slate-800 rounded-[2.3rem] border border-white/10 group-hover:border-white/20 transition-all">
                  <div className="flex items-center gap-6 text-left">
                    <div className="hidden sm:flex bg-linear-to-br from-orange-500 to-red-500 w-16 h-16 rounded-2xl items-center justify-center shadow-lg shadow-orange-500/30">
                      <LayoutDashboard size={32} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Open Analytics Dashboard</h2>
                      <p className="text-slate-300 text-sm">Real-time heat maps & predictive modeling</p>
                    </div>
                  </div>
                  <div className="bg-white/10 p-4 rounded-full group-hover:bg-linear-to-br group-hover:from-orange-500 group-hover:to-red-500 transition-all group-hover:-rotate-45">
                    <ArrowRight size={24} />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </header>

        {/* Feature Grid: Why This Matters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mt-12 mb-20">
          <FeatureCard 
            icon={<Navigation className="text-orange-500" />}
            title="Localized Precision"
            desc="Hyper-local data tracking down to specific neighborhood micro-climates."
            gradient="from-orange-50 to-red-50"
            borderColor="border-orange-100"
          />
          <FeatureCard 
            icon={<ShieldCheck className="text-blue-500" />}
            title="Public Safety"
            desc="Early warning detection to reduce heat-related health emergencies."
            gradient="from-blue-50 to-cyan-50"
            borderColor="border-blue-100"
          />
          <FeatureCard 
            icon={<Waves className="text-emerald-500" />}
            title="Impact Analysis"
            desc="Detailed reports on how humidity and radiation affect urban cooling."
            gradient="from-emerald-50 to-teal-50"
            borderColor="border-emerald-100"
          />
        </div>

        {/* Detailed Metrics Breakdown */}
        <section className="w-full max-w-6xl border-t-2 border-slate-200 pt-20">
          <div className="flex flex-col lg:flex-row gap-16 items-start">
            <div className="lg:w-1/2 lg:sticky lg:top-24">
              <h2 className="text-4xl font-extrabold text-slate-900 mb-6">
                Environmental <br /> Risk Factors
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed mb-8">
                Our prediction engine processes a combination of atmospheric physics 
                and urban topography. Understanding these three pillars is key to 
                predicting the &quot;Heat Risk&quot; effect.
              </p>
              <div className="flex items-center gap-4 p-5 bg-linear-to-br from-orange-50 to-red-50 rounded-2xl border-2 border-orange-200/60 shadow-sm">
                <div className="p-2 bg-linear-to-br from-orange-500 to-red-500 rounded-lg text-white shadow-md">
                  <Activity size={20} />
                </div>
                <span className="text-orange-900 font-semibold">Active Monitoring Enabled</span>
              </div>
            </div>

            <div className="lg:w-1/2 grid grid-cols-1 gap-4">
              <MetricRow 
                icon={<Thermometer size={24} className="text-orange-500" />}
                title="Heat Index"
                desc="A composite value representing what the air feels like when humidity is combined with the air temperature."
                bgGradient="from-orange-50 to-red-50"
                iconBg="bg-gradient-to-br from-orange-100 to-red-100"
              />
              <MetricRow 
                icon={<Droplets size={24} className="text-blue-500" />}
                title="Relative Humidity"
                desc="Measures the moisture in the air. High humidity prevents sweat from evaporating, the body's primary cooling method."
                bgGradient="from-blue-50 to-cyan-50"
                iconBg="bg-gradient-to-br from-blue-100 to-cyan-100"
              />
              <MetricRow 
                icon={<Sun size={24} className="text-amber-500" />}
                title="Solar Radiation"
                desc="Direct energy from the sun that heats asphalt and concrete, creating long-term thermal retention in urban areas."
                bgGradient="from-amber-50 to-yellow-50"
                iconBg="bg-gradient-to-br from-amber-100 to-yellow-100"
              />
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </main>
  );
};

/* Component for the Feature Cards */
const FeatureCard = ({ 
  icon, 
  title, 
  desc, 
  gradient, 
  borderColor 
}: { 
  icon: React.ReactNode, 
  title: string, 
  desc: string,
  gradient: string,
  borderColor: string
}) => (
  <div className={`bg-linear-to-br ${gradient} border-2 ${borderColor} p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
    <div className="mb-4 w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
  </div>
);

/* Component for Metric Detailed Rows */
const MetricRow = ({ 
  icon, 
  title, 
  desc,
  bgGradient,
  iconBg
}: { 
  icon: React.ReactNode, 
  title: string, 
  desc: string,
  bgGradient: string,
  iconBg: string
}) => (
  <div className={`group bg-linear-to-br ${bgGradient} border-2 border-slate-200/60 p-6 rounded-3xl shadow-md hover:shadow-xl transition-all duration-300 flex gap-6 items-start hover:-translate-y-1`}>
    <div className={`p-4 ${iconBg} rounded-2xl shadow-sm group-hover:shadow-md transition-all`}>
      {icon}
    </div>
    <div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
    </div>
  </div>
);

export default HomePage;