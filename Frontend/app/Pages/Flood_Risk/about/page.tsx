"use client";

import React from "react";
import Navbar from "../NavBar/Navbar";

export default function AboutNew() {
  return (
    <div className="min-h-screen bg-gray-50"> 
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold text-blue-800">
            About the Flood Risk Prediction System
          </h1>
          <p className="text-gray-600 mt-3 max-w-3xl mx-auto">
            Comprehensive flood monitoring and early warning system for
            Colombo District, Sri Lanka.
          </p>
        </div>

        {/* Overview Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              System Overview
            </h2>
            <p className="text-gray-600 mb-3">
              This system provides real-time flood monitoring using IoT sensors
              and advanced machine learning models.
            </p>
            <p className="text-gray-600">
              It helps government authorities and residents receive early
              warnings to reduce flood-related damage.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Key Features
            </h2>
            <ul className="space-y-2 text-gray-600">
              <li>• Real-time water level monitoring</li>
              <li>• Rainfall analysis</li>
              <li>• 7-day flood prediction</li>
              <li>• Alert notification system</li>
              <li>• Area-based station filtering</li>
            </ul>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white p-8 rounded-lg shadow-sm border mb-16">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-blue-700 font-bold text-lg mb-2">1</div>
              <p className="text-gray-600">Data collected from IoT sensors</p>
            </div>

            <div>
              <div className="text-blue-700 font-bold text-lg mb-2">2</div>
              <p className="text-gray-600">
                Stored securely in PostgreSQL database
              </p>
            </div>

            <div>
              <div className="text-blue-700 font-bold text-lg mb-2">3</div>
              <p className="text-gray-600">
                Machine learning model predicts flood risk
              </p>
            </div>

            <div>
              <div className="text-blue-700 font-bold text-lg mb-2">4</div>
              <p className="text-gray-600">
                Alerts sent to users and authorities
              </p>
            </div>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="bg-white p-8 rounded-lg shadow-sm border mb-16">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            Technology Stack
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <h4 className="font-semibold text-blue-700">Python</h4>
              <p className="text-sm text-gray-600">Machine Learning</p>
            </div>

            <div>
              <h4 className="font-semibold text-green-700">Node.js</h4>
              <p className="text-sm text-gray-600">Backend API</p>
            </div>

            <div>
              <h4 className="font-semibold text-blue-500">Next.js</h4>
              <p className="text-sm text-gray-600">Frontend</p>
            </div>

            <div>
              <h4 className="font-semibold text-indigo-700">PostgreSQL</h4>
              <p className="text-sm text-gray-600">Database</p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-blue-100 p-8 rounded-lg text-center">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">
            Contact & Support
          </h2>
          <p className="text-blue-800">Email: support@floodrisk.lk</p>
          <p className="text-blue-800">Phone: +94 11 123 4567</p>
          <p className="text-blue-800">Available 24/7</p>
        </div>
      </div>
    </div>
  );
}
