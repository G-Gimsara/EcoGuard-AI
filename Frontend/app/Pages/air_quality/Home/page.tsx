"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import Logo from "@/app/Images/logo.png";
import Header from "@/app/Header/page";
import ManageSubscription from "@/app/Pages/air_quality/ManageSubscription/page";
import Navbar from "../NavBar/Navbar";

type FormType = {
  name: string;
  phone: string;
  alert_frequency: string;
};

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [showManage, setShowManage] = useState<boolean>(false);
 const [showOTP, setShowOTP] = useState<boolean>(false);
const [otp, setOtp] = useState<string>("");


  const [form, setForm] = useState<FormType>({
    name: "",
    phone: "94",
    alert_frequency: "daily",
  });

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (!value.startsWith("94")) value = "94";
    if (value.length > 11) value = value.slice(0, 11);
    setForm({ ...form, phone: value });
  };

  const validatePhone = (phone: string) => /^94\d{9}$/.test(phone);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

 const sendOTP = async (): Promise<void> => {
  const { name, phone } = form;

  if (!name || !phone) {
    alert("⚠ Fill all fields");
    return;
  }

  if (!validatePhone(phone)) {
    alert("❌ Phone must be 94XXXXXXXXX format");
    return;
  }

  try {
    setLoading(true);

    await axios.post("http://localhost:5000/api/air/send-otp", form);

    setShowOTP(true); // open OTP popup
  } catch (err: unknown) {
    const error = err as any;
    alert(error?.response?.data?.message || "Error sending OTP");
  } finally {
    setLoading(false);
  }
};


const verifyOTP = async (): Promise<void> => {
  try {
    await axios.post("http://localhost:5000/api/air/verify-otp", {
      phone: form.phone,
      otp,
    });

    alert("✅ OTP Verified!");

    // Activate user AFTER verification
    await axios.post("http://localhost:5000/api/air/sms", form);

    setShowOTP(false);
    setOtp("");

    alert("🎉 Registration complete!");
  } catch (err: unknown) {
    const error = err as any;
    alert(error?.response?.data?.message || "Invalid OTP");
  }
};


  const isFormValid = form.name.trim() && validatePhone(form.phone);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f0f4fb" }}>

      <Header />
       <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        <div className="grid md:grid-cols-5 gap-8 items-start">

          {/* LEFT */}
          <div className="md:col-span-3 bg-white rounded-3xl shadow-2xl overflow-hidden border border-blue-100">

            <div className="px-8 py-6 flex items-center bg-[#123985] gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-xl">📡</div>
              <div>
                <h3 className="text-white font-bold text-base tracking-wide">Register for SMS Alerts</h3>
                <p className="text-blue-200 text-xs mt-0.5">Get air pollution alerts delivered directly to your phone</p>
              </div>
            </div>

            <div className="p-8 flex flex-col gap-5">

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-800 placeholder-gray-400 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Mobile Number</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">🇱🇰</span>
                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handlePhoneChange}
                    placeholder="94XXXXXXXXX"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-800 placeholder-gray-400 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5 ml-1">Format: 94 followed by 9 digits</p>
              </div>

              <div>
  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
    Alert Frequency
  </label>

  <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-gray-50">
    📅 Daily Alerts
  </div>
</div>

              <div className="border-t border-gray-100 my-1" />

              <button
                onClick={sendOTP}
                disabled={!isFormValid || loading}
                className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-widest uppercase transition-all duration-200 shadow-lg
                  ${isFormValid && !loading
                    ? "text-white hover:opacity-90 active:scale-95 shadow-blue-200"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                  }`}
                style={isFormValid && !loading ? { background: "linear-gradient(135deg, #0a1f5c, #1a4fa8)" } : {}}
              >
                {loading ? "Submitting…" : "Register Now"}
              </button>
            </div>
          </div>

          {/* RIGHT */}
          <div className="md:col-span-2 flex flex-col gap-6">

            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-blue-100">
              <div className="px-6 py-5 bg-[#123985]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center text-lg">🤖</div>
                  <div>
                    <h3 className="text-white font-bold text-md">AI Assistant</h3>
                    <p className="text-blue-200 text-xs">Real-time conversion using AI</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-800 text-sm mb-5 leading-relaxed">
                  Ask questions about air quality, pollution levels, and environmental risks in your area using our intelligent assistant.
                </p>
                <button
                  onClick={() => router.push("/Pages/air_quality/Chat")}
                  className="w-full py-3 rounded-xl font-bold text-sm tracking-wider uppercase text-white transition-all duration-200 hover:opacity-90 active:scale-95 shadow-lg bg-[#123985] shadow-blue-200"
                >
                  Open AI Chat →
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-blue-100">
              <div className="px-6 py-5 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-lg">📱</div>
                  <div>
                    <h3 className="text-gray-800 font-bold text-md">Manage Subscription</h3>
                    <p className="text-gray-700 text-xs">Update or cancel alerts</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-800 text-sm mb-5 leading-relaxed">
                  Modify your alert preferences, update your phone number, or unsubscribe from notifications at any time.
                </p>
                <button
              onClick={() => setShowManage(true)}
                 className="w-full py-3 rounded-xl font-bold text-sm tracking-wider uppercase text-white transition-all duration-200 hover:opacity-90 active:scale-95 shadow-lg bg-[#123985] shadow-blue-200"
                
                >
                  Manage Now
                </button>
              </div>
            </div>

          </div>

        </div>
      </main>

        {showManage && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    
    {/* Modal box */}
    <div className="relative w-full max-w-lg max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl 
                    bg-white/70 backdrop-blur-xl border border-white/40">
      
      {/* Close button */}
      <button
        onClick={() => setShowManage(false)}
        className="absolute top-3 right-3 bg-white/60 hover:bg-white text-gray-700 w-8 h-8 rounded-full flex items-center justify-center shadow"
      >
        ✕
      </button>

      {/* Content (hidden scrollbar) */}
      <div className="max-h-[85vh] overflow-y-auto scrollbar-hidden">
        <ManageSubscription />
      </div>

    </div>

  </div>
)}


{showOTP && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
    
    <div className="bg-white p-6  text-gray-900 rounded-xl w-80">
      <h2 className="text-lg font-bold mb-3">Enter OTP</h2>

      <input
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        className="w-full border text-gray-900  p-2 rounded mb-3"
        placeholder="Enter OTP"
      />

      <button
        onClick={verifyOTP}
        className="w-full bg-[#123985] text-white py-2 rounded"
      >
        Verify
      </button>

      <button
        onClick={sendOTP} // resend OTP
        className="w-full mt-2 text-sm text-blue-500"
      >
        Resend OTP
      </button>
    </div>

  </div>
)}


<div className="mt-8 py-5 border-t border-gray-200 flex flex-wrap gap-5 items-center">
  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
    References
  </h3>

  <ul className="text-xs text-gray-600 space-y-1">
    <li>
      Alert Example
      <a
        href="https://drive.google.com/file/d/1bU45eSIUxxThSlohcEmEOBiOQowEhboy/view?usp=sharing"
        target="_blank"
        className="text-blue-600 hover:underline ml-1"
      >
        Alert Example
      </a>
    </li>
  </ul>
</div>
      


    </div>
  );
}