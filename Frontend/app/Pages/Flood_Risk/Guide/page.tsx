"use client";

import React from "react";
import Navbar from "../NavBar/Navbar";

export default function SafetyNew() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-10 flex items-center">
          <div className="bg-red-100 p-3 rounded-full mr-4">
            <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-red-800">
              Emergency Preparedness
            </h1>
            <p className="text-red-700 mt-1">
              Stay safe during flood situations
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white border rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-6">
                Flood Safety Guidelines
              </h2>

              {/* Medium Risk */}
              <div className="border-l-4 border-orange-500 bg-orange-50 rounded-lg p-5 mb-6">
                <h3 className="text-orange-600 font-semibold mb-3">
                  Alert – Stay Alert
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Monitor weather updates regularly</li>
                  <li>• Prepare an emergency kit</li>
                  <li>• Review evacuation plans</li>
                </ul>
              </div>

              {/* High Risk */}
              <div className="border-l-4 border-red-500 bg-red-50 rounded-lg p-5 mb-6">
                <h3 className="text-red-600 font-semibold mb-3">
                  Minor Flood – Take Action
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Move to higher ground immediately</li>
                  <li>• Secure loose outdoor items</li>
                  <li>• Charge all electronic devices</li>
                </ul>
              </div>

              {/* Critical Risk */}
              <div className="border-l-4 border-red-800 bg-red-100 rounded-lg p-5 mb-8">
                <h3 className="text-red-800 font-semibold mb-3">
                  Major Flood – Evacuate Now
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Evacuate immediately if ordered</li>
                  <li>• Do NOT drive through flood water</li>
                  <li>• Contact emergency services if trapped</li>
                </ul>
              </div>

              {/* Emergency Kit */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-yellow-800 mb-4">
                  Emergency Kit Essentials
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <ul className="space-y-1">
                    <li>✔ Water (3+ days)</li>
                    <li>✔ Non-perishable food</li>
                    <li>✔ First aid kit</li>
                    <li>✔ Flashlight & batteries</li>
                  </ul>

                  <ul className="space-y-1">
                    <li>✔ ID documents</li>
                    <li>✔ Insurance papers</li>
                    <li>✔ Medical records</li>
                    <li>✔ Cash & cards</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Emergency Contacts */}
            <div className="bg-white border rounded-lg p-6 shadow-sm mb-6">
              <h3 className="text-xl font-bold mb-4 text-red-700">
                Emergency Contacts
              </h3>

              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="font-semibold">Emergency</div>
                  <div className="text-xl font-bold text-red-600">
                    117 / 118
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="font-semibold">Disaster Management</div>
                  <div className="text-blue-700">+94 11 267 1096</div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="font-semibold">Flood Support</div>
                  <div className="text-green-700">+94 11 243 6136</div>
                </div>
              </div>
            </div>

            {/* Safety Tips */}
            <div className="bg-blue-50 border rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-bold text-blue-900 mb-4">
                Safety Tips
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• 6 inches of water can knock you down</li>
                <li>• 12 inches can carry vehicles</li>
                <li>• Never touch wet electrical equipment</li>
                <li>• Avoid downed power lines</li>
                <li>• Follow evacuation orders immediately</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
