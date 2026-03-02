"use client";

import React, { useState } from "react";
import { Upload, Sparkles, User, Brain, CheckCircle } from "lucide-react";
import Navbar from "../NavBar/Navbar";
import Header from "@/app/Header/page";

interface PredictionResult {
  prediction: string;
  suggestions: string;
}

export default function AnalyzeCoral() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [role, setRole] = useState<string>("researcher");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<PredictionResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
    setResult(null);
  };

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!file) return alert("Please select an image.");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("role", role);

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/predict", {
        method: "POST",
        body: formData,
      });

      const data: PredictionResult = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      alert("Error predicting coral image.");
    }
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const roleDescriptions: { [key: string]: string } = {
    researcher: "Get detailed scientific analysis and metrics",
    tourism_guide: "Receive tourist-friendly insights and facts",
    general: "Get simplified information about coral health",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 text-black">
      <Header/>
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Upload Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8 print:hidden">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2"></div>

          <div className="p-10 space-y-8">
            {/* Upload */}
            <div>
              <label className="block text-lg font-semibold mb-4 text-black">
                <Upload size={20} className="inline mr-2 text-blue-600" />
                Upload Coral Image
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                id="file-input"
                className="hidden"
              />

              <label
                htmlFor="file-input"
                className="block border-2 border-dashed border-blue-300 rounded-2xl p-10 text-center cursor-pointer hover:bg-blue-50"
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded-lg shadow"
                  />
                ) : (
                  <p className="text-black">
                    Click or drag image here (PNG / JPG)
                  </p>
                )}
              </label>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-lg font-semibold mb-4 text-black">
                <User size={20} className="inline mr-2 text-green-600" />
                Select Your Role
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { value: "researcher", label: "Researcher", emoji: "🔬" },
                  { value: "tourism_guide", label: "Tourism Guide", emoji: "🗺️" },
                  { value: "general", label: "General User", emoji: "👤" },
                ].map((option) => (
                  <div
                    key={option.value}
                    onClick={() => setRole(option.value)}
                    className={`p-4 rounded-xl border-2 cursor-pointer ${
                      role === option.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <p className="text-2xl">{option.emoji}</p>
                    <p className="font-semibold text-black">
                      {option.label}
                    </p>
                    <p className="text-xs text-black">
                      {roleDescriptions[option.value]}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading || !file}
              className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
            >
              <Sparkles className="inline mr-2" />
              {loading ? "Analyzing..." : "Analyze Coral"}
            </button>
          </div>
        </div>

        {/* RESULTS */}
        {result && (
          <div className="print-area space-y-6 text-black">
            {/* Report Header */}
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold">
                Coral Reef Health Assessment Report
              </h1>
              <p className="mt-2 text-black">
                AI-Based Coral Image Analysis
              </p>
              <hr className="mt-4" />
            </div>

            {/* Prediction */}
            <div className="bg-white rounded-xl shadow p-6 border-l-4 border-green-500">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CheckCircle className="text-green-600" />
                Prediction Result
              </h2>
              <p className="mt-4 text-black whitespace-pre-line">
                {result.prediction}
              </p>
            </div>

            {/* Suggestions */}
            <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Brain className="text-blue-600" />
                AI Recommendations
              </h2>
              <p className="mt-4 text-black whitespace-pre-line">
                {result.suggestions}
              </p>
            </div>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold print:hidden"
            >
              🖨️ Print Final Prediction & Recommendations
            </button>

            {/* Reset */}
            <button
              onClick={() => {
                setFile(null);
                setPreview(null);
                setResult(null);
              }}
              className="w-full py-3 bg-gray-200 rounded-xl print:hidden text-black"
            >
              Analyze Another Image
            </button>
          </div>
        )}
      </div>

      {/* PRINT STYLES */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area,
          .print-area * {
            visibility: visible;
            color: black !important;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 40px;
            background: white;
          }
        }
      `}</style>
    </div>
  );
}
