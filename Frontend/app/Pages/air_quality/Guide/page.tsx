"use client";

import React from "react";
import { Wind, Flame, Thermometer } from "lucide-react";
import Navbar from "../NavBar/Navbar";
import Header from "@/app/Header/page";

export default function AirQualityGuide() {
  return (
    <div>
      <Header /> 
       
    <div className="min-h-screen bg-gray-100 ">
        <Navbar />  

   

      <p className="text-center text-gray-600 mb-10 max-w-3xl mx-auto">
        This guide helps pedestrians, drivers, and public transport users
        understand roadside pollution levels such as dust (PM2.5), gas emissions,
        and temperature conditions. Follow these recommendations to stay safe
        in urban environments.
      </p>

      <div className="grid md:grid-cols-3 gap-8">

        {/* ---------------- DUST GUIDE ---------------- */}
        <div className="bg-white rounded-xl shadow-lg p-6">

          <div className="flex items-center gap-3 mb-4">
            <Wind className="text-blue-500 w-8 h-8"/>
            <h2 className="text-xl text-black font-bold">Dust (PM2.5)</h2>
          </div>

          <div className="space-y-5">

            <GuideItem
              level="Low"
              color="green"
              tips={[
                "Air quality is good",
                "Outdoor activities are safe",
                "No mask required",
                "Safe for children and elderly",
                "Walking near roads is generally safe",
                "Public transport users can travel normally"
              ]}
            />

            <GuideItem
              level="Medium"
              color="yellow"
              tips={[
                "Sensitive groups should reduce outdoor activity",
                "People with asthma should be careful",
                "Avoid long outdoor exercise near busy roads",
                "Consider wearing a mask near traffic",
                "Use shaded sidewalks when walking",
                "Public transport users should avoid crowded polluted stops"
              ]}
            />

            <GuideItem
              level="High"
              color="red"
              tips={[
                "Avoid outdoor activities near busy roads",
                "Wear a protective mask (N95 recommended)",
                "Keep windows closed near highways",
                "Avoid walking near heavy traffic",
                "School children should limit outdoor sports",
                "Use public transport instead of walking long distances"
              ]}
            />

          </div>
        </div>


        {/* ---------------- GAS GUIDE ---------------- */}
        <div className="bg-white rounded-xl shadow-lg p-6">

          <div className="flex items-center gap-3 mb-4">
            <Flame className="text-red-500 w-8 h-8"/>
            <h2 className="text-xl text-black font-bold">Gas Level</h2>
          </div>

          <div className="space-y-5">

            <GuideItem
              level="Low"
              color="green"
              tips={[
                "Gas levels are safe",
                "Normal daily activities are safe",
                "No health risk detected",
                "Roadside travel is safe",
                "Drivers and passengers can travel normally"
              ]}
            />

            <GuideItem
              level="Medium"
              color="yellow"
              tips={[
                "Stay cautious near traffic congestion",
                "Avoid staying long at bus stops with heavy traffic",
                "Ensure good ventilation in vehicles",
                "Motorbike riders should wear masks",
                "Avoid idling vehicles for long periods"
              ]}
            />

            <GuideItem
              level="High"
              color="red"
              tips={[
                "Move away from polluted traffic areas",
                "Avoid breathing vehicle exhaust fumes",
                "Pedestrians should avoid busy intersections",
                "Public transport users should move to less crowded stops",
                "Drivers should close windows in heavy traffic",
                "Children and elderly should avoid roadside exposure"
              ]}
            />

          </div>
        </div>


        {/* ---------------- TEMPERATURE GUIDE ---------------- */}
        <div className="bg-white rounded-xl shadow-lg p-6">

          <div className="flex items-center gap-3 mb-4">
            <Thermometer className="text-orange-500 w-8 h-8"/>
            <h2 className="text-xl text-black font-bold">Temperature</h2>
          </div>

          <div className="space-y-5">

            <GuideItem
              level="Normal"
              color="green"
              tips={[
                "Comfortable temperature",
                "Safe for outdoor activities",
                "Safe for walking and cycling",
                "Drivers should stay hydrated"
              ]}
            />

            <GuideItem
              level="Moderate"
              color="yellow"
              tips={[
                "Weather is warm",
                "Drink water regularly",
                "Use hats or umbrellas when walking",
                "Public transport users should stay hydrated"
              ]}
            />

            <GuideItem
              level="High"
              color="orange"
              tips={[
                "Drink plenty of water",
                "Wear light clothing",
                "Avoid long sun exposure near roads",
                "Motorbike riders should take breaks",
                "Use shade at bus stops"
              ]}
            />

            <GuideItem
              level="Very High"
              color="red"
              tips={[
                "Stay indoors if possible",
                "Drink water frequently",
                "Avoid outdoor activity during midday",
                "Construction workers should take frequent breaks",
                "Children and elderly should stay in cool places"
              ]}
            />

          </div>
        </div>

      </div>

    </div>
    </div>
  );
}



const GuideItem = ({ level, tips, color }: any) => {

  const colorStyles: any = {
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
    orange: "bg-orange-100 text-orange-700",
    red: "bg-red-100 text-red-700"
  };

  return (
    <div className="border-l-4 border-gray-300 pl-4">

      <span className={`px-3 py-1 text-xs font-semibold rounded ${colorStyles[color]}`}>
        {level}
      </span>

      <ul className="text-gray-700 mt-2 list-disc ml-5 space-y-1">
        {tips.map((tip: string, index: number) => (
          <li key={index}>{tip}</li>
        ))}
      </ul>

    </div>
  );
};