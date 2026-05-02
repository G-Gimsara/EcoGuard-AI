"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import Navigation from "../components/Navigation";

const HeatRiskMapClient = dynamic(
  () => import("../components/HeatRiskMapClient"),
  { ssr: false }
);

const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return "--";
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

export default function MapPage() {
  const [allData, setAllData] = useState([]);
  const [dates, setDates] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const intervalRef = useRef(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/predictions")
      .then((res) => res.json())
      .then((json) => {
        setAllData(json);
      });
  }, []);

  useEffect(() => {
    const todayStr = formatLocalDate(currentDate);

    const startDate = new Date(currentDate);
    startDate.setDate(currentDate.getDate() - 7);
    const startStr = formatLocalDate(startDate);

    const endDate = new Date(currentDate);
    endDate.setDate(currentDate.getDate() + 15);
    const endStr = formatLocalDate(endDate);

    const uniqueDates = [...new Set(allData.map((d) => d.date.slice(0, 10)))].sort();
    const filteredDates = uniqueDates.filter((d) => d >= startStr && d <= endStr);

    setDates(filteredDates);

    const todayIndex = filteredDates.indexOf(todayStr);
    setSelectedIndex(todayIndex !== -1 ? todayIndex : 0);
  }, [allData, currentDate]);

  useEffect(() => {
    const dateInterval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);

    return () => clearInterval(dateInterval);
  }, []);

  useEffect(() => {
    if (!playing) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setSelectedIndex((prev) => (prev < dates.length - 1 ? prev + 1 : prev));
    }, 1200);

    return () => clearInterval(intervalRef.current);
  }, [playing, dates]);

  const selectedDate = dates[selectedIndex] || formatLocalDate(currentDate);
  const canGoPrev = selectedIndex > 0;
  const canGoNext = selectedIndex < dates.length - 1;

  const mapData = allData.filter((d) => d.date.startsWith(selectedDate));

  return (
    <main className="min-h-screen bg-gray-100 p-3">
      <Navigation />
      <h1 className="text-2xl font-bold text-center text-amber-600 mb-3">
        Colombo District Heat Map
      </h1>

      <section className="relative bg-white rounded-xl shadow overflow-hidden">
        <HeatRiskMapClient data={mapData} />

        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[9999]">
          <div className="flex items-center gap-3 px-4 py-3 rounded-3xl bg-gray-800 text-zinc-400 text-sm shadow-2xl backdrop-blur-sm border border-amber-700/50">
            <button
              onClick={() => setPlaying(!playing)}
              className="w-12 h-12 rounded-2xl bg-white/15 hover:bg-white/25 transition font-bold text-xl"
              title={playing ? "Pause Auto Play" : "Start Auto Play"}
            >
              {playing ? "||" : ">"}
            </button>

           

            <div className="flex flex-col items-center min-w-[110px]">
              <button
                onClick={() => canGoNext && setSelectedIndex((prev) => prev + 1)}
                disabled={!canGoNext}
                className="leading-none text-lg hover:text-amber-200 disabled:opacity-40"
                title="Next Day"
              >
               🠹
              </button>
              <div className="text-lg leading-6 font-semibold">{formatDisplayDate(selectedDate)}</div>
              <button
                onClick={() => canGoPrev && setSelectedIndex((prev) => prev - 1)}
                disabled={!canGoPrev}
                className="leading-none text-lg hover:text-amber-200 disabled:opacity-40"
                title="Previous Day"
              >
               🠻
              </button>
            </div>

          
          </div>
        </div>
      </section>
    </main>
  );
}
