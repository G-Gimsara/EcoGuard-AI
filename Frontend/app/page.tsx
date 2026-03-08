'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Droplets, Wind, Thermometer, Waves, Cpu, Activity } from 'lucide-react';
import Header from './Header/page';
import FloodImg from '@/app/Images/flood.jpg';
import AirImg from '@/app/Images/air.jpg';
import HeatImg from '@/app/Images/heat.jpg';
import CoralImg from '@/app/Images/coral.jpg';
import Footer from './Footer/Footer';

// Module Configuration
const MODULES = [
  {
    id: 1,
    title: 'Flood Risk Detection',
    description: 'AI-driven flood monitoring using real time IoT data from rainfall sensors, river levels, and environmental conditions.',
    icon: Droplets,
    image: FloodImg,
    link: '/Pages/Flood_Risk/Dashboard',
    tag: 'IoT • AI • Hydrology'
  },
  {
    id: 2,
    title: 'Air Quality Management',
    description: 'Real-time air quality monitoring with PM2.5, PM10, CO₂ levels and predictive analytics.',
    icon: Wind,
    image: AirImg,
    link: '/Pages/air-quality/Dashboard',
    tag: 'IoT • Environmental Health'
  },
  {
    id: 3,
    title: 'Urban Heat Risk Monitoring ',
    description: 'Urban heat island detection using temperature sensors, satellite data, and ML models.',
    icon: Thermometer,
    image: HeatImg,
    link: '/Pages/Heat_risk',
    tag: 'IoT • AI • Climate'
  },
  {
    id: 4,
    title: 'Coral Reef Health Monitoring',
    description: 'Marine ecosystem analysis using water temperature, pH levels, and coral bleaching indices.',
    icon: Waves,
    image: CoralImg,
    link: '/Pages/Coral_reef/login',
    tag: 'IoT • Marine AI'
  }
];

const RESEARCH_OBJECTIVES = [
  'Develop predictive models for environmental risk assessment',
  'Integrate real-time IoT sensor data with AI analytics',
  'Provide early warnings for floods, heat waves, and air pollution',
  'Support sustainable resource management and policy decisions',
  'Improve resilience of urban and coastal ecosystems'
];

const TECH_STACK = [
  'Next.js & React',
  'Node.js & Express',
  'Python (ML Models)',
  'MongoDB',
  'IoT Sensors',
  'Cloud Computing',
  'REST APIs',
  'Data Visualization'
];

// Hero Section Component
function HeroSection() {
  return (
    <section className="py-20 bg-linear-to-br from-slate-900 via-blue-900 to-slate-900 text-white text-center">
      <h1 className="text-5xl font-bold mb-4">Environmental Risk & Resource Management</h1>
      <p className="text-xl text-slate-200 max-w-3xl mx-auto">
        An AI + IoT powered platform for predictive environmental risk analysis, real-time monitoring, and sustainable resource management.
      </p>
      <div className="flex gap-8 justify-center mt-12">
        <div className="flex items-center gap-3">
          <Cpu className="w-6 h-6 text-blue-400" />
          <span className="font-semibold">AI Models</span>
        </div>
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-green-400" />
          <span className="font-semibold">IoT Sensors</span>
        </div>
      </div>
    </section>
  );
}

// Module Card Component
function ModuleCard({ module, isHovered, onHover, onLeave }: { module: typeof MODULES[0]; isHovered: boolean; onHover: () => void; onLeave: () => void }) {
  const Icon = module.icon;

  return (
    <Link href={module.link}>
      <div
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        className="group relative h-96 rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl cursor-pointer"
      >
        {/* Background Image */}
        <img
          src={module.image.src}
          alt={module.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />

        {/* Overlay */}
        <div className={`absolute inset-0 bg-black transition-opacity duration-300 ${isHovered ? 'opacity-60' : 'opacity-40'}`} />

        {/* Content */}
        <div className="relative h-full flex flex-col justify-between p-6 text-white">
          {/* Top - Tag and Icon */}
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold bg-blue-500 bg-opacity-80 px-3 py-1 rounded-full">
              {module.tag}
            </span>
            <Icon className="w-8 h-8 opacity-75" />
          </div>

          {/* Bottom - Title and Description */}
          <div>
            <h3 className="text-2xl font-bold mb-3">{module.title}</h3>
            <p className="text-sm text-slate-100 mb-4">{module.description}</p>
            <span className="inline-flex items-center text-sm font-semibold hover:translate-x-1 transition-transform">
              View Dashboard →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Modules Grid Component
function ModulesGrid() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <section className="py-16 px-4 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-center text-slate-900 mb-12">Core Monitoring Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {MODULES.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              isHovered={hoveredCard === module.id}
              onHover={() => setHoveredCard(module.id)}
              onLeave={() => setHoveredCard(null)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// Overview Section Component
function OverviewSection() {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-slate-900 mb-6">Why Environmental Risk Management?</h2>
        <p className="text-lg text-slate-700 leading-relaxed">
          Climate change, urbanization, and environmental degradation have increased the frequency and intensity of natural hazards. Traditional monitoring systems lack predictive capabilities and real-time responsiveness. This platform integrates Artificial Intelligence (AI) and Internet of Things (IoT) technologies to provide proactive risk detection, predictive analytics, and data-driven decision support for environmental sustainability.
        </p>
      </div>
    </section>
  );
}

// Architecture Section Component
function ArchitectureSection() {
  const pillars = [
    {
      title: 'IoT Data Collection',
      description: 'Environmental sensors collect real-time data including temperature, humidity, air quality indices, water levels, and marine conditions.',
      icon: Activity
    },
    {
      title: 'AI & Machine Learning',
      description: 'Machine learning models analyze historical and real-time data to predict floods, heat waves, pollution spikes, and ecosystem degradation.',
      icon: Cpu
    },
    {
      title: 'Cloud & Dashboards',
      description: 'Cloud-based processing enables scalable analytics, real-time dashboards, alerts, and decision support for authorities and researchers.',
      icon: Waves
    }
  ];

  return (
    <section className="py-16 px-4 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">System Architecture</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar, idx) => {
            const IconComponent = pillar.icon;
            return (
              <div key={idx} className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <IconComponent className="w-10 h-10 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{pillar.title}</h3>
                <p className="text-slate-600 leading-relaxed">{pillar.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Objectives Section Component
function ObjectivesSection() {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-slate-900 mb-8">Key Research Objectives</h2>
        <div className="space-y-4">
          {RESEARCH_OBJECTIVES.map((objective, idx) => (
            <div key={idx} className="flex gap-4 items-start">
              <span className="text-green-500 font-bold text-xl mt-1 shrink-0">✔</span>
              <p className="text-lg text-slate-700">{objective}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Impact Section Component
function ImpactSection() {
  return (
    <section className="py-16 px-4 bg-linear-to-r from-blue-50 to-slate-50">
      <div className="max-w-4xl mx-auto bg-white p-10 rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-slate-900 mb-6">Expected Impact</h2>
        <p className="text-lg text-slate-700 leading-relaxed">
          The proposed system enhances disaster preparedness, improves environmental monitoring accuracy, and supports evidence-based decision-making. It can be utilized by government agencies, researchers, urban planners, and environmental organizations to mitigate risks and promote sustainability.
        </p>
      </div>
    </section>
  );
}

// Technology Stack Section Component
function TechStackSection() {
  return (
    <section className="py-16 px-4 bg-slate-50">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Technology Stack</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {TECH_STACK.map((tech, idx) => (
            <div key={idx} className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
              <p className="font-semibold text-slate-800">{tech}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Main Home Component
export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeroSection />
      <ModulesGrid />
      <OverviewSection />
      <ArchitectureSection />
      <ObjectivesSection />
      <ImpactSection />
      <TechStackSection />
      <Footer/>
    </div>
  );
}