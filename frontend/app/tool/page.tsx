"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";


export default function ToolPage() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Waiting for input…");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const mode = searchParams.get("mode") ?? "vegetation";

  const [selectedTool, setSelectedTool] = useState(mode);
  const [aoiFile, setAoiFile] = useState<File | null>(null);
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<any>(null);

  useEffect(() => {
    if (map.current) return;

    if (mapContainer.current) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            satellite: {
              type: "raster",
              tiles: [
                "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              ],
              tileSize: 256
            }
          },
          layers: [
            {
              id: "satellite",
              type: "raster",
              source: "satellite"
            }
          ]
        },
        center: [-115, 43],
        zoom: 5,
      });
    }
  }, []);

  const runModel = async () => {
    if (running) return;

    setRunning(true);
    setProgress(10);
    setStatus("Running sampling design...");

    try {

      const formData = new FormData();

      const response = await fetch("http://127.0.0.1:8000/run-sampling", {
        method: "POST",
        body: formData,
      });

      const geojson = await response.json();

      if (!map.current) return;

      if (map.current.getSource("samples")) {
        map.current.removeLayer("samples");
        map.current.removeSource("samples");
      }

      map.current.addSource("samples", {
        type: "geojson",
        data: geojson
      });

      map.current.addLayer({
        id: "samples",
        type: "circle",
        source: "samples",
        paint: {
          "circle-radius": 5,
          "circle-color": "#2563eb",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1
        }
      });

      setProgress(100);
      setStatus("Sampling design complete");

    } catch (error) {
      console.error(error);
      setStatus("Error contacting backend API");
      setProgress(0);
    }

    setRunning(false);
  };

  /* ADD THIS RIGHT HERE */

  const uploadAOI = async (file: File) => {

    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch("http://127.0.0.1:8000/upload-aoi", {
      method: "POST",
      body: formData
    })

    const geojson = await res.json()

    console.log(geojson)

    if (!map.current) return

    // remove existing AOI if present
    if (map.current.getSource("aoi")) {
      map.current.removeLayer("aoi-fill")
      map.current.removeLayer("aoi-outline")
      map.current.removeSource("aoi")
    }

    map.current.addSource("aoi", {
      type: "geojson",
      data: geojson
    })

    map.current.addLayer({
      id: "aoi-fill",
      type: "fill",
      source: "aoi",
      paint: {
        "fill-color": "#3b82f6",
        "fill-opacity": 0.25
      }
    })

    map.current.addLayer({
      id: "aoi-outline",
      type: "line",
      source: "aoi",
      paint: {
        "line-color": "#60a5fa",
        "line-width": 2
      }
    })

    // zoom map to AOI extent
    const bounds = new maplibregl.LngLatBounds()

    geojson.features.forEach((feature: any) => {
      const coords = feature.geometry.coordinates.flat(Infinity)

      for (let i = 0; i < coords.length; i += 2) {
        bounds.extend([coords[i], coords[i + 1]])
      }
    })

    map.current.fitBounds(bounds, {
      padding: 40,
      duration: 1000
    })

  };


  return (
    <main className="relative h-[calc(100vh-72px)] flex overflow-hidden bg-slate-900">

      {/* AMBIENT BACKGROUND LIGHT */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-900 to-slate-950 pointer-events-none"></div>

      {/* SIDEBAR */}
      <aside className="w-80 border-r border-slate-700 bg-gradient-to-b from-slate-800 to-slate-900 p-6 flex flex-col shadow-2xl relative z-10">

        <h2 className="text-xl font-semibold text-blue-400 mb-1">
          {selectedTool === "vegetation" ? "Vegetation Mapping" : "Sampling Design"}
        </h2>

        <p className="text-sm text-slate-200 mb-6">
          {selectedTool === "vegetation"
            ? "Upload imagery and generate vegetation maps."
            : "Upload an AOI to generate optimized sampling locations."}
        </p>

        <div className="mb-4 border border-slate-700 rounded-lg p-4 bg-slate-800">
          <h3 className="font-medium mb-2 text-slate-100">Tool Type</h3>

          <select
            value={selectedTool}
            onChange={(e) => setSelectedTool(e.target.value)}
            className="w-full rounded-md bg-slate-900 border border-slate-700 text-slate-100 text-sm px-3 py-2"
          >
            <option value="vegetation">Vegetation Mapping</option>
            <option value="sampling">Sampling Design</option>
          </select>
        </div>

        {/* INPUT SECTION */}

        {selectedTool === "vegetation" && (
          <div className="mb-4 border border-slate-700 rounded-lg p-4 bg-slate-800">
            <h3 className="font-medium mb-2 text-slate-100">Imagery Input</h3>
            <p className="text-xs text-slate-400">
              Upload RGB imagery (GeoTIFF or image).
            </p>
          </div>
        )}

        {selectedTool === "sampling" && (
          <div className="mb-4 border border-slate-700 rounded-lg p-4 bg-slate-800">
            <h3 className="font-medium mb-2 text-slate-100">AOI Upload</h3>

            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-blue-500 transition text-slate-300 text-sm">

              <span>Click to upload AOI (.zip shapefile)</span>

              <input
                type="file"
                accept=".zip"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    const file = e.target.files[0];
                    setAoiFile(file);
                    uploadAOI(file);
                  }
                }}
              />

            </label>

            {aoiFile && (
              <p className="text-xs text-green-400 mt-2">
                Uploaded: {aoiFile.name}
              </p>
            )}

            <p className="text-xs text-slate-400 mt-2">
              Upload a zipped shapefile (.zip containing .shp, .dbf, .shx).
            </p>
          </div>
        )}

        {/* SETTINGS PANEL */}

        {selectedTool === "vegetation" && (
          <div className="mb-4 border border-slate-700 rounded-lg p-4 bg-slate-800">
            <h3 className="font-medium mb-2 text-slate-100">Model Settings</h3>
            <p className="text-xs text-slate-400">
              CNN inference parameters and tiling options.
            </p>
          </div>
        )}

        {selectedTool === "sampling" && (
          <div className="mb-4 border border-slate-700 rounded-lg p-4 bg-slate-800">
            <h3 className="font-medium mb-2 text-slate-100">Sampling Settings</h3>

            <div className="flex flex-col gap-3 text-xs text-slate-300">

              <label className="flex flex-col">
                Number of Samples
                <input
                  type="number"
                  defaultValue={20}
                  className="mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1"
                />
              </label>

              <label className="flex flex-col">
                Minimum Spacing (m)
                <input
                  type="number"
                  defaultValue={100}
                  className="mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1"
                />
              </label>

            </div>
          </div>
        )}
        {/* RUN BUTTON */}
        <button
          onClick={runModel}
          disabled={running}
          className={`w-full py-3 rounded-lg font-medium transition shadow-sm mb-4 ${running
            ? "bg-blue-900 text-blue-200 cursor-not-allowed"
            : "bg-blue-700 hover:bg-blue-800 text-white"
            }`}
        >
          {running
            ? "Running..."
            : selectedTool === "vegetation"
              ? "Run Vegetation Model"
              : "Run Sampling Design"}
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
        <div className="relative flex-1 min-h-[500px] rounded-xl border border-slate-700 overflow-hidden shadow-[0_0_60px_rgba(59,130,246,0.15)]">

          {/* MAPLIBRE MAP */}
          <div
            ref={mapContainer}
            className="w-full h-full"
          />

          {/* BASE MAP GRADIENT */}
          {/* <div className="absolute inset-0 z-10 bg-gradient-to-br from-slate-900/10 via-transparent to-black/20 pointer-events-none"></div> */}

          {/* RADIAL LIGHT */}
          {/* <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.15),transparent_60%)] pointer-events-none"></div> */}

          {/* GRID OVERLAY - MINOR */}
          {/* <div
            className="absolute inset-0 z-20 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          /> */}

          {/* GRID OVERLAY - MAJOR */}
          {/* <div
            className="absolute inset-0 z-20 opacity-25 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(59,130,246,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.12) 1px, transparent 1px)",
              backgroundSize: "200px 200px",
            }}
          /> */}

          {/* MAP LABELS */}
          {/* <div className="absolute top-4 left-4 text-xs text-slate-400 tracking-wide pointer-events-none">
            Workspace Projection: EPSG:5070
          </div>

          <div className="absolute bottom-4 right-4 text-xs text-slate-500 pointer-events-none">
            VegMap Viewer
          </div> */}

        </div>

      </section>

    </main>
  );
}