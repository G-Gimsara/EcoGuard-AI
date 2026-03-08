"use client";

import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../NavBar/Navbar";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
} from "@tanstack/react-table";

interface AirReading {
  id: number;
  device_id: string;
  dust?: number;
  gas_ppm?: number;
  temperature?: number;
  humidity?: number;
  createdAt: string;
}

import Header from "@/app/Header/page";

export default function DashboardReport() {
  const [dustData, setDustData] = useState<AirReading[]>([]);
  const [gasData, setGasData] = useState<AirReading[]>([]);
  const [tempHumData, setTempHumData] = useState<AirReading[]>([]);
  const [combinedData, setCombinedData] = useState<AirReading[]>([]);
  const [pageSize] = useState(5); // rows per page

  // Fetch sensor data
  useEffect(() => {
    fetch("http://localhost:5000/api/dust").then((res) => res.json()).then(setDustData).catch(console.error);
    fetch("http://localhost:5000/api/gas").then((res) => res.json()).then(setGasData).catch(console.error);
    fetch("http://localhost:5000/api/temp_hum").then((res) => res.json()).then(setTempHumData).catch(console.error);
  }, []);

  // Merge data
  useEffect(() => {
    const maxLength = Math.max(dustData.length, gasData.length, tempHumData.length);
    const merged: AirReading[] = [];
    for (let i = 0; i < maxLength; i++) {
      merged.push({
        id: dustData[i]?.id ?? gasData[i]?.id ?? tempHumData[i]?.id ?? i,
        device_id: dustData[i]?.device_id ?? gasData[i]?.device_id ?? tempHumData[i]?.device_id ?? "Unknown",
        dust: dustData[i]?.dust,
        gas_ppm: gasData[i]?.gas_ppm,
        temperature: tempHumData[i]?.temperature,
        humidity: tempHumData[i]?.humidity,
        createdAt:
          tempHumData[i]?.createdAt ?? dustData[i]?.createdAt ?? gasData[i]?.createdAt ?? new Date().toISOString(),
      });
    }
    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setCombinedData(merged);
  }, [dustData, gasData, tempHumData]);

  const columns = useMemo<ColumnDef<AirReading>[]>(
    () => [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "device_id", header: "Device" },
      { accessorKey: "dust", header: "Dust (µg/m³)" },
      { accessorKey: "gas_ppm", header: "Gas (ppm)" },
      { accessorKey: "temperature", header: "Temp (°C)" },
      { accessorKey: "humidity", header: "Humidity (%)" },
      {
        accessorKey: "createdAt",
        header: "Timestamp",
        cell: (info) => new Date(info.getValue() as string).toLocaleString(),
      },
    ],
    []
  );

  const table = useReactTable({
    data: combinedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize } },
  });

  return (
    <div className="min-h-screen bg-gray-100">
       <Header />
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-6">Sensor Report</h1>

        {/* Table Container */}
        <div className="overflow-x-auto shadow-lg rounded-xl bg-white">
          <table className="min-w-full border-collapse border border-gray-200">
            {/* Header */}
            <thead className="bg-blue-900 text-white">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="text-left px-4 py-3 font-semibold text-sm border-b border-gray-300"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            {/* Body */}
            <tbody>
              {table.getRowModel().rows.map((row, idx) => (
                <tr
                  key={row.id}
                  className={idx % 2 === 0 ? "bg-gray-50 hover:bg-blue-50" : "hover:bg-blue-50"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2 text-gray-800 border-b border-gray-200">
                      {flexRender(cell.column.columnDef.cell, cell.getContext()) ?? "--"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-gray-700 font-medium">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}