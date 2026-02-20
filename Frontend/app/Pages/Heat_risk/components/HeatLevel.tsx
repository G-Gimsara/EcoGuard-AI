
'use client';

import React, { useState } from 'react';
import { Thermometer, AlertTriangle, AlertCircle, ShieldAlert } from 'lucide-react';

const heatIndexData = [
  {
    classification: 'Caution',
    range: '80°F - 90°F',
    effects: 'Fatigue possible with prolonged exposure and/or physical activity',
    color: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    icon: AlertTriangle,
    iconColor: 'text-yellow-500'
  },
  {
    classification: 'Extreme Caution',
    range: '90°F - 103°F',
    effects: 'Heat stroke, heat cramps, or heat exhaustion possible with prolonged exposure and/or physical activity',
    color: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-800',
    icon: AlertCircle,
    iconColor: 'text-orange-500'
  },
  {
    classification: 'Danger',
    range: '103°F - 124°F',
    effects: 'Heat cramps or heat exhaustion likely, and heat stroke possible with prolonged exposure and/or physical activity',
    color: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    icon: ShieldAlert,
    iconColor: 'text-red-500'
  },
  {
    classification: 'Extreme Danger',
    range: '125°F or higher',
    effects: 'Heat stroke highly likely',
    color: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-800',
    icon: Thermometer,
    iconColor: 'text-purple-500'
  }
] as const;

const HeatIndexDashboard: React.FC = () => {
  const [activeCard, setActiveCard] = useState<number | null>(null);

  return (
    <div className="space-y-8">
      {/* Overview Card */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Thermometer className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Heat Index Overview</h2>
            <p className="text-gray-600">Risk levels based on temperature and humidity</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {heatIndexData.map((item, index) => (
            <div
              key={item.classification}
              className={`p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer hover:scale-[1.02] ${
                activeCard === index ? 'ring-2 ring-offset-2 ring-gray-400' : ''
              } ${item.color} ${item.borderColor}`}
              onMouseEnter={() => setActiveCard(index)}
              onMouseLeave={() => setActiveCard(null)}
              onClick={() => setActiveCard(index === activeCard ? null : index)}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-bold text-lg ${item.textColor}`}>
                  {item.classification}
                </h3>
                <item.icon className={`w-5 h-5 ${item.iconColor}`} />
              </div>
              <div className="text-sm font-semibold text-gray-700 mb-2">
                {item.range}
              </div>
              <p className="text-sm text-gray-600">
                {item.effects}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Visual Scale */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Heat Index Scale</h3>
          
          <div className="space-y-4">
            {heatIndexData.map((item) => (
              <div key={item.classification} className="flex items-center">
                <div className={`w-32 p-3 rounded-l-lg font-medium ${item.color} ${item.textColor} border ${item.borderColor}`}>
                  {item.range}
                </div>
                <div className={`flex-1 p-3 rounded-r-lg border border-l-0 ${item.borderColor} bg-white`}>
                  <div className="flex items-center gap-2">
                    <item.icon className={`w-4 h-4 ${item.iconColor}`} />
                    <span className="font-medium">{item.classification}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-bold text-gray-700 mb-2">💡 Safety Recommendations</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                Stay hydrated and take breaks in shaded areas
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500">•</span>
                Wear lightweight, light-colored clothing
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                Limit outdoor activities during peak heat hours
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500">•</span>
                Seek air-conditioned spaces during extreme heat
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column - Effects Details */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Health Effects</h3>
          
          <div className="space-y-6">
            {heatIndexData.map((item, index) => (
              <div 
                key={item.classification}
                className={`p-4 rounded-xl border ${item.borderColor} ${item.color} transition-all duration-300 ${
                  activeCard === index ? 'scale-[1.02] shadow-md' : ''
                }`}
                onMouseEnter={() => setActiveCard(index)}
                onMouseLeave={() => setActiveCard(null)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${item.iconColor} bg-white/50`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className={`font-bold ${item.textColor}`}>
                      {item.classification}
                    </h4>
                    <div className="text-sm font-medium text-gray-700">
                      {item.range}
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-700">
                  {item.effects}
                </p>
                
                <div className="mt-4 pt-4 border-t border-white/30">
                  <div className="text-sm font-medium text-gray-600">
                    Risk Level: {index + 1}/4
                  </div>
                  <div className="flex gap-1 mt-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 flex-1 rounded-full ${
                          i <= index ? item.iconColor : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h4 className="font-bold text-blue-800 mb-2">📊 About the Data</h4>
            <p className="text-sm text-blue-700">
              This heat index classification is based on data from the National Oceanic and Atmospheric Administration (NOAA). 
              The heat index combines air temperature and relative humidity to determine the human-perceived equivalent temperature.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatIndexDashboard;

