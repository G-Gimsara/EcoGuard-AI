"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/app/Images/logo.png";
import Header from "@/app/Header/page";

type Message = {
  role: "user" | "bot";
  text: string;
};

type Sensor = {
  key: string;
  label: string;
  icon: string;
  desc: string;
};

const SENSORS: Sensor[] = [
  { key: "co",   label: "CO",          icon: "💨", desc: "Carbon Monoxide" },
  { key: "co2",  label: "CO₂",         icon: "🌫️", desc: "Carbon Dioxide" },
  { key: "dust", label: "Dust",        icon: "🌪️", desc: "Particulate Matter" },
  { key: "temp", label: "Temperature", icon: "🌡️", desc: "Ambient Temp" },
  { key: "gas",  label: "NH₃ Gas",     icon: "⚗️", desc: "Ammonia Gas" },
];

export default function Chat() {
  const [sensorType, setSensorType]   = useState<string>("co2");
  const [question, setQuestion]       = useState<string>("");
  const [messages, setMessages]       = useState<Message[]>([]);
  const [loading, setLoading]         = useState<boolean>(false);
  const [selected, setSelected]       = useState<boolean>(false);
  const [sensorInfo, setSensorInfo]   = useState<string>("");
  const bottomRef                     = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!selected) return;
    const fetchLatest = async () => {
      try {
        const res = await axios.post<{ reply: { message: string } }>(
          "http://localhost:5000/api/air/chat",
          {
            sensorType,
            question: "Give me current air quality status",
          }
        );
        setSensorInfo(res.data.reply.message);
        setMessages([{ role: "bot", text: "👋 How can I help you today?" }]);
      } catch (err) {
        console.error(err);
      }
    };
    fetchLatest();
  }, [sensorType, selected]);

  const sendMessage = async () => {
    if (!question.trim()) return;
    const userMsg = question;
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setQuestion("");
    setLoading(true);
    try {
      const res = await axios.post<{ reply: { message: string } }>(
        "http://localhost:5000/api/air/chat",
        {
          sensorType,
          question: userMsg,
        }
      );
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: res.data.reply.message },
      ]);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const currentSensor = SENSORS.find((s) => s.key === sensorType);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* ── HEADER ── */}
     <Header/>

      {/* ── ACCENT LINE ── */}
      <div className="h-1 bg-gradient-to-r from-[#123985] via-blue-400 to-[#123985] flex-shrink-0" />

      {/* ── PAGE BODY ── */}
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-2xl flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200"
          style={{ minHeight: "78vh" }}>

          {/* ── CHAT TITLE BAR ── */}
          <div className="bg-[#123985] px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-lg">
                🌍
              </div>
              <div>
                <p className="text-white font-semibold text-xl tracking-wide">Air Quality AI Chat</p>
                <p className="text-blue-200 text-[14px]">
                  {selected ? `Monitoring: ${currentSensor?.label}` : "Select an air type to begin"}
                </p>
              </div>
            </div>
            {selected && (
              <button
                onClick={() => { setSelected(false); setMessages([]); setSensorInfo(""); }}
                className="text-xs text-blue-200 hover:text-white border border-white/20 hover:border-white/50 px-3 py-1.5 rounded-lg transition-all"
              >
                ← Change Sensor
              </button>
            )}
          </div>

          {/* ── SENSOR SELECTION ── */}
          {!selected ? (
           <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-gradient-to-br from-blue-50 via-white to-blue-100">
  
  <div className="w-full max-w-xl backdrop-blur-lg bg-white/70 border border-white/40 rounded-2xl shadow-xl p-5 sm:p-6 md:p-8">
    
    <div className="text-center mb-6 sm:mb-8">
      <h2 className="text-xl sm:text-2xl font-bold text-[#123985]">
        Select Air Quality Type
      </h2>
      <p className="text-gray-800 mt-2 text-xs sm:text-sm">
        Start a conversation and get AI-powered health insights
      </p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {SENSORS.map((s) => (
        <button
          key={s.key}
          onClick={() => {
            setSensorType(s.key);
            setSelected(true);
            setMessages([]);
            setSensorInfo("");
          }}
          className="flex items-center gap-3 p-3 sm:p-4 rounded-xl 
                     bg-white/80 border border-gray-200
                     hover:bg-blue-100 hover:border-[#123985]
                     hover:shadow-lg sm:hover:-translate-y-1
                     transition-all duration-300 group"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-blue-100 text-lg sm:text-xl group-hover:bg-[#123985] group-hover:text-white transition">
            {s.icon}
          </div>

          <div className="text-left">
            <p className="font-semibold text-sm sm:text-base text-gray-800 group-hover:text-[#123985]">
              {s.label}
            </p>
            <p className="text-[17px] sm:text-xs text-gray-800">
              {s.desc}
            </p>
          </div>
        </button>
      ))}
    </div>

  </div>
</div>

          ) : (
            <>
              {sensorInfo && (
                <div className="flex-shrink-0 mx-4 mt-4 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 flex gap-3">
                  <div className="text-xl flex-shrink-0">{currentSensor?.icon}</div>
                  <div>
                    <p className="text-xs font-semibold text-[#123985] uppercase tracking-wider mb-0.5">
                      Current Status — {currentSensor?.label}
                    </p>
                    <p className="text-xs text-blue-800 leading-relaxed">{sensorInfo}</p>
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    {m.role === "bot" && (
                      <div className="w-7 h-7 rounded-full bg-[#123985] flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-1">
                        🤖
                      </div>
                    )}
                    <div
                      className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line
                        ${m.role === "user"
                          ? "bg-[#123985] text-white rounded-br-sm"
                          : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm"
                        }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#123985] flex items-center justify-center text-xs flex-shrink-0">
                      🤖
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex gap-1 items-center">
                      <span className="w-2 h-2 rounded-full bg-[#123985] animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-[#123985] animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-[#123985] animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 bg-white flex gap-2 items-end">
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about air quality..."
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#123985] focus:ring-2 focus:ring-[#123985]/20 transition-all resize-none"
                />
                <button
                  onClick={sendMessage}
                  disabled={!question.trim() || loading}
                  className="flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={
                    question.trim() && !loading
                      ? { background: "#123985", color: "white", cursor: "pointer" }
                      : { background: "#e5e7eb", color: "#9ca3af", cursor: "not-allowed" }
                  }
                >
                  Send
                </button>
              </div>
            </>
          )}

        </div>
      </div>

      <footer className="text-center py-4 flex-shrink-0">
        <p className="text-xs text-gray-400">
          © 2025 Environmental Risk &amp; Resource Management AI System
        </p>
      </footer>

    </div>
  );
}