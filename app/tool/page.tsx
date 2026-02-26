"use client";

import { useState } from "react";


export default function ToolPage() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Waiting for input…");
  const runModel = () => {
    if (running) return;

    setRunning(true);
    setProgress(0);
    setStatus("Initializing model...");

    let value = 0;

    const interval = setInterval(() => {
      value += 10;
      setProgress(value);

      if (value === 30) setStatus("Uploading imagery...");
      if (value === 60) setStatus("Running GPU inference...");
      if (value === 90) setStatus("Generating output raster...");

      if (value >= 100) {
        clearInterval(interval);
        setStatus("Model complete ✔ Output ready.");
        setRunning(false);
      }
    }, 400);
  };
  return (
    <main className="relative h-[calc(100vh-72px)] flex overflow-hidden bg-slate-900">

      {/* AMBIENT BACKGROUND LIGHT */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-900 to-slate-950 pointer-events-none"></div>

      {/* SIDEBAR */}
      <aside className="w-80 border-r border-slate-700 bg-gradient-to-b from-slate-800 to-slate-900 p-6 flex flex-col shadow-2xl relative z-10">

        <h2 className="text-xl font-semibold text-blue-400 mb-1">
          Mapping Tool
        </h2>

        <p className="text-sm text-slate-200 mb-6">
          Configure inputs and run model inference.
        </p>

        {/* INPUT SECTION */}
        <div className="mb-4 border border-slate-700 rounded-lg p-4 bg-slate-800">
          <h3 className="font-medium mb-2 text-slate-100">Input Data</h3>
          <p className="text-xs text-slate-400">
            Upload RGB imagery (GeoTIFF or image).
          </p>
        </div>

        {/* MODEL SETTINGS */}
        <div className="mb-4 border border-slate-700 rounded-lg p-4 bg-slate-800">
          <h3 className="font-medium mb-2 text-slate-100">Model Settings</h3>
          <p className="text-xs text-slate-400">
            Parameters and options will appear here.
          </p>
        </div>

        {/* RUN BUTTON */}
        <button
          onClick={runModel}
          disabled={running}
          className={`w-full py-3 rounded-lg font-medium transition shadow-sm mb-4 ${running
            ? "bg-blue-900 text-blue-200 cursor-not-allowed"
            : "bg-blue-700 hover:bg-blue-800 text-white"
            }`}
        >
          {running ? "Running..." : "Run Model"}
        </button>

        {/* STATUS PANEL */}
        <div className="border border-slate-700 rounded-lg p-4 bg-slate-800">
          <h3 className="font-medium mb-2 text-slate-100">Status</h3>
          <p className="text-xs text-slate-200 mb-3">
            {status}
          </p>

          <div className="w-full h-2 bg-slate-800 rounded overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

      </aside>

      {/* WORKSPACE */}
      <section className="relative z-10 flex-1 p-8 flex flex-col">

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-slate-100">
            Workspace
          </h1>

          <div className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-md">
            Idle
          </div>
        </div>

        <p className="text-slate-200 mb-6">
          Model outputs and spatial previews will appear here.
        </p>

        {/* MAP CANVAS */}
        <div className="relative flex-1 rounded-xl border border-slate-700 overflow-hidden shadow-[0_0_60px_rgba(59,130,246,0.15)]">

          {/* BASE MAP GRADIENT */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black"></div>

          {/* RADIAL LIGHT */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.18),transparent_60%)]"></div>

          {/* GRID OVERLAY - MINOR */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* GRID OVERLAY - MAJOR */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(rgba(59,130,246,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.22) 1px, transparent 1px)",
              backgroundSize: "200px 200px",
            }}
          />

          {/* FAKE MAP LABELS */}
          <div className="absolute top-4 left-4 text-xs text-slate-400 tracking-wide">
            Workspace Projection: EPSG:5070
          </div>

          <div className="absolute bottom-4 right-4 text-xs text-slate-500">
            VegMap Viewer
          </div>

          {/* CENTER LABEL */}
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
            Interactive Map Workspace (coming soon)
          </div>

        </div>

      </section>

    </main>
  );
}