"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import Navigation from "../components/Navigation";

const HeatRiskMapClient = dynamic(
  () => import("../components/HeatRiskMapClient"),
  { ssr: false }
);

export default function MapPage() {
  const [allData, setAllData] = useState([]);
  const [dates, setDates] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const intervalRef = useRef(null);

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    fetch("http://localhost:5000/api/predictions")
      .then((res) => res.json())
      .then((json) => {
        setAllData(json);
      });
  }, []);

  /* ================= UPDATE DATES RANGE ================= */
  useEffect(() => {
    const todayStr = currentDate.toISOString().slice(0, 10);

    const startDate = new Date(currentDate);
    startDate.setDate(currentDate.getDate() - 7);
    const startStr = startDate.toISOString().slice(0, 10);

    const endDate = new Date(currentDate);
    endDate.setDate(currentDate.getDate() + 15);
    const endStr = endDate.toISOString().slice(0, 10);

    const uniqueDates = [
      ...new Set(allData.map((d) => d.date.slice(0, 10))),
    ].sort();

    const filteredDates = uniqueDates.filter(
      (d) => d >= startStr && d <= endStr
    );

    setDates(filteredDates);

    const todayIndex = filteredDates.indexOf(todayStr);
    setSelectedIndex(todayIndex !== -1 ? todayIndex : filteredDates.length - 1);
  }, [allData, currentDate]);

  /* ================= UPDATE CURRENT DATE ================= */
  useEffect(() => {
    const dateInterval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);

    return () => clearInterval(dateInterval);
  }, []);

  /* ================= PLAY MODE ================= */
  useEffect(() => {
    if (!playing) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setSelectedIndex((prev) =>
        prev < dates.length - 1 ? prev + 1 : prev
      );
    }, 1200);

    return () => clearInterval(intervalRef.current);
  }, [playing, dates]);

  const selectedDate = dates[selectedIndex];

  const mapData = allData.filter((d) =>
    d.date.startsWith(selectedDate)
  );

  return (
    <main className="min-h-screen bg-gray-100 p-3">
      <Navigation />
      <h1 className="text-2xl font-bold text-center text-amber-600 mb-3">
        🔥 Colombo District Heat Risk Map
      </h1>
      

      <section className="relative bg-white rounded-xl shadow overflow-hidden">
        {/* MAP */}
        <HeatRiskMapClient data={mapData} />

        {/* TIMELINE BAR */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-9999 w-[92%] max-w-5xl">
          <div >
            <div className=" text-center font-semibold mb-3 text-gray-700">
              📅 {selectedDate}
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setPlaying(!playing)}
                className="px-4 py-2 rounded-xl bg-linear-to-r from-red-500 to-orange-500 text-white font-semibold shadow"
              >
                {playing ? "⏸ Pause" : "▶ Play"}
              </button>

              <input
                type="range"
                min={0}
                max={dates.length - 1}
                value={selectedIndex}
                onChange={(e) => setSelectedIndex(+e.target.value)}
                className="timeline-slider"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Slider style */}
      <style jsx>{`
        .timeline-slider {
          width: 100%;
          height: 6px;
          appearance: none;
          background: linear-gradient(
            to right,
            #16a34a,
            #facc15,
            #ef4444
          );
          border-radius: 999px;
          outline: none;
        }
        .timeline-slider::-webkit-slider-thumb {
          appearance: none;
          width: 22px;
          height: 22px;
          background: white;
          border: 4px solid #ef4444;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(0,0,0,0.25);
        }
      `}</style>
    </main>
  );
}