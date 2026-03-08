"use client";

import { useEffect, useState } from "react";
import PredictionsTable from "../components/PredictionsTable";
import HeatIndexChart from "../components/HeatIndexChart";
import SummaryCards from "../components/SummaryCards"; // ← Add this
import DivisionHeatMap from "../components/DivisionHeatMap";
import HistoricalForecastChart from "../components/HistoricalForecastChart";
import Navigation from "../components/Navigation";
import HeatSensor from "../components/HeatSensor";

export default function PredictionPage() {
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/predictions`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch table data");
        return res.json();
      })
      .then((json) => {
        setTableData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <Navigation />
      <h1 className="text-3xl font-bold mb-8 text-center text-orange-500">
         Heat Risk Forecast Dashboard
      </h1>

      {loading && <p className="text-center text-gray-500 text-lg">Loading predictions...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {!loading && !error && tableData.length > 0 && (
        <>
       <div className="mb-8">
          <HeatSensor />
        </div>
         
          {/* Summary Cards at the very top */}
<<<<<<< HEAD
          <SummaryCards data={tableData} />
          <HeatSensor />
=======
           {/* <SummaryCards data={tableData} />  */}
          
>>>>>>> 2ae796edc070db97a5c1dea88bf78fe17705f627


          {/* Chart */}
          {/*<HeatIndexChart data={tableData} />*/}

          <HistoricalForecastChart data={tableData}/>

          

          {/* Table */}
          <section className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <PredictionsTable data={tableData} />
          </section>
        </>
      )}

      {!loading && !error && tableData.length === 0 && (
        <p className="text-center text-gray-500">No prediction data available.</p>
      )}
    </main>
  );
}