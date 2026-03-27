"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ReferenceLine,
    CartesianGrid,
    ResponsiveContainer,
    BarChart,
    Bar
} from "recharts";


export default function ToolWorkspace() {

    const searchParams = useSearchParams();
    const mode = searchParams.get("mode") ?? "field-model";
    const selectedTool =
        mode === "sampling" ? "sampling" :
            mode === "field-model" ? "field-model" :
                mode === "vegetation" ? "vegetation" :
                    mode === "eag-fronts" ? "eag-fronts" :
                        "field-model";

    const isSampling = selectedTool === "sampling";
    const isFieldModel = selectedTool === "field-model";
    const isVegetation = selectedTool === "vegetation";
    const isEagFronts = selectedTool === "eag-fronts";

    const [running, setRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState("Waiting for input…");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const [aoiFile, setAoiFile] = useState<File | null>(null);
    const [maxSamples, setMaxSamples] = useState(20);
    const [minSpacing, setMinSpacing] = useState(100);
    const [recommendedSamples, setRecommendedSamples] = useState<number | null>(null);
    const [coverageCurve, setCoverageCurve] = useState<{ n: number; p_covered: number }[]>([]);
    const [samplingComplete, setSamplingComplete] = useState(false);
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const map = useRef<any>(null);
    const [trainingCsv, setTrainingCsv] = useState<File | null>(null);
    const [responseColumn, setResponseColumn] = useState("eag_cover");
    const [latColumn, setLatColumn] = useState("lat");
    const [lonColumn, setLonColumn] = useState("lon");
    const [modelComplete, setModelComplete] = useState(false);
    const [metrics, setMetrics] = useState<any>(null);
    const [predictionComplete, setPredictionComplete] = useState(false);
    const [eagComplete, setEagComplete] = useState(false);
    const [showCovariates, setShowCovariates] = useState(false);
    const [covariates, setCovariates] = useState<{ name: string; description: string }[]>([]);
    const [covariatesLoading, setCovariatesLoading] = useState(false);
    const [workspaceTab, setWorkspaceTab] = useState<"map" | "details">("map");
    const [legendUrl, setLegendUrl] = useState<string | null>(null);
    const [legendAvailable, setLegendAvailable] = useState(false);
    const [convertFile, setConvertFile] = useState<File | null>(null);
    const [convertInputType, setConvertInputType] = useState<"csv" | "shp_zip">("csv");
    const [convertInputCrs, setConvertInputCrs] = useState("EPSG:4326");
    const [convertXColumn, setConvertXColumn] = useState("");
    const [convertYColumn, setConvertYColumn] = useState("");
    const [convertResponseColumn, setConvertResponseColumn] = useState("");
    const [convertStatus, setConvertStatus] = useState("");
    const [convertPreview, setConvertPreview] = useState<any>(null);
    const [convertColumns, setConvertColumns] = useState<string[]>([]);
    const [predictionRunId, setPredictionRunId] = useState<string | null>(null);
    const [showCoordinatePrep, setShowCoordinatePrep] = useState(false);



    useEffect(() => {
        setWorkspaceTab("map");
    }, [selectedTool]);

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

    useEffect(() => {
        if (!map.current) return;

        if (workspaceTab === "map") {
            setTimeout(() => {
                map.current?.resize();
            }, 0);
        }
    }, [workspaceTab]);

    const clearPredictionLayer = () => {
        if (!map.current) return;

        const mapInstance = map.current;

        if (mapInstance.getLayer("prediction")) {
            mapInstance.removeLayer("prediction");
        }

        if (mapInstance.getSource("prediction")) {
            mapInstance.removeSource("prediction");
        }
    };


    const handleConvertFileChange = async (file: File | null) => {
        setConvertFile(file);
        setConvertColumns([]);
        setConvertXColumn("");
        setConvertYColumn("");
        setConvertResponseColumn("");

        if (!file) return;

        if (file.name.toLowerCase().endsWith(".csv")) {
            setConvertInputType("csv");

            const text = await file.text();
            const firstLine = text.split(/\r?\n/)[0];
            const cols = firstLine.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
            setConvertColumns(cols);
        } else if (file.name.toLowerCase().endsWith(".zip")) {
            setConvertInputType("shp_zip");
        }
    };

    const handleConvertInputData = async () => {
        if (!convertFile) {
            setConvertStatus("Please upload a CSV or zipped shapefile.");
            return;
        }

        if (convertInputType === "csv" && (!convertXColumn || !convertYColumn)) {
            setConvertStatus("Please select the X and Y columns.");
            return;
        }

        try {
            setConvertStatus("Converting input data...");

            const formData = new FormData();
            formData.append("file", convertFile);
            formData.append("input_type", convertInputType);
            formData.append("input_crs", convertInputCrs);
            formData.append("x_column", convertXColumn);
            formData.append("y_column", convertYColumn);
            formData.append("response_column", convertResponseColumn || "");

            const res = await fetch("http://127.0.0.1:8000/convert-input-data", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                let errorMessage = `Request failed with status ${res.status}`;
                try {
                    const errorData = await res.json();
                    errorMessage =
                        errorData?.detail ||
                        errorData?.message ||
                        errorMessage;
                } catch { }
                throw new Error(errorMessage);
            }

            const result = await res.json();

            setConvertPreview(result.preview_geojson ?? null);
            setConvertStatus(`Conversion complete. ${result.feature_count} features processed.`);

            if (map.current && result.preview_geojson) {
                if (map.current.getSource("converted-preview")) {
                    map.current.removeLayer("converted-preview");
                    map.current.removeSource("converted-preview");
                }

                map.current.addSource("converted-preview", {
                    type: "geojson",
                    data: result.preview_geojson,
                });

                map.current.addLayer({
                    id: "converted-preview",
                    type: "circle",
                    source: "converted-preview",
                    paint: {
                        "circle-radius": 4,
                        "circle-color": "#22c55e",
                        "circle-stroke-color": "#ffffff",
                        "circle-stroke-width": 1,
                    },
                });
            }
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Conversion failed";
            setConvertStatus(message);
        }
    };

    const runModel = async () => {
        if (running) return;

        setRunning(true);
        setProgress(10);
        setStatus("Running sampling design...");

        try {

            const formData = new FormData();
            formData.append("max_samples", String(maxSamples));
            formData.append("min_spacing", String(minSpacing));

            const response = await fetch("http://127.0.0.1:8000/run-sampling", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            const geojson = result.points;
            setRecommendedSamples(result.summary?.recommended_n ?? null);
            setCoverageCurve(result.coverage_curve ?? []);

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
            setSamplingComplete(true);

        } catch (error) {
            console.error(error);
            setStatus("Error contacting backend API");
            setProgress(0);
        }

        setRunning(false);
    };

    const runFieldModel = async () => {

        if (!aoiFile) {
            setStatus("Please upload an AOI.");
            return;
        }

        if (!trainingCsv) {
            setStatus("Please upload a field data CSV.");
            return;
        }

        setShowCovariates(false);
        setCovariates([]);
        setModelComplete(false);
        setPredictionComplete(false);
        setMetrics(null);
        setLegendUrl(null);
        setLegendAvailable(false);
        setRunning(true);
        setProgress(0);
        setStatus("Starting model training...");

        if (!trainingCsv) {
            setStatus("Please upload a training CSV.");
            return;
        }

        if (!latColumn || !lonColumn || !responseColumn) {
            setStatus("Please select latitude, longitude, and response columns.");
            return;
        }

        try {
            setRunning(true);
            setModelComplete(false);
            setMetrics(null);
            setProgress(0);
            setStatus("Submitting training data...");

            const formData = new FormData();
            formData.append("csv", trainingCsv);
            formData.append("lat_column", latColumn);
            formData.append("lon_column", lonColumn);
            formData.append("response_column", responseColumn);

            const trainRes = await fetch("http://127.0.0.1:8000/train-field-model", {
                method: "POST",
                body: formData,
            });

            if (!trainRes.ok) {
                let errorMessage = `Request failed with status ${trainRes.status}`;

                try {
                    const errorData = await trainRes.json();
                    errorMessage =
                        errorData?.detail ||
                        errorData?.message ||
                        errorData?.error ||
                        errorMessage;
                } catch {
                }

                throw new Error(errorMessage);
            }

            const interval = setInterval(async () => {
                try {
                    const res = await fetch("http://127.0.0.1:8000/training-progress");
                    const data = await res.json();

                    const pct = Math.round((data.progress ?? 0) * 100);
                    setProgress(pct);

                    if (data.status === "starting") {
                        setStatus("Starting model training...");
                    } else if (data.status === "building_training_table") {
                        setStatus("Building training table...");
                    } else if (data.status === "training_model") {
                        setStatus("Training model...");
                    } else if (data.status === "loading_outputs") {
                        setStatus("Loading model outputs...");
                    } else if (data.status === "error") {
                        clearInterval(interval);
                        setRunning(false);
                        setStatus(data.message || "Training failed");
                        setProgress(0);
                        return;
                    } else if (data.status === "complete") {
                        clearInterval(interval);

                        const resultRes = await fetch("http://127.0.0.1:8000/training-result");
                        const result = await resultRes.json();

                        if (result.training_points && map.current) {
                            if (map.current.getSource("training-points")) {
                                map.current.removeLayer("training-points");
                                map.current.removeSource("training-points");
                            }

                            map.current.addSource("training-points", {
                                type: "geojson",
                                data: result.training_points,
                            });

                            map.current.addLayer({
                                id: "training-points",
                                type: "circle",
                                source: "training-points",
                                paint: {
                                    "circle-radius": 4,
                                    "circle-color": "#f59e0b",
                                    "circle-stroke-color": "#ffffff",
                                    "circle-stroke-width": 1,
                                },
                            });
                        }

                        setMetrics(result.metrics ?? null);
                        setModelComplete(true);
                        setRunning(false);
                        setProgress(100);
                        setStatus("Model training complete");
                    }
                } catch (error) {
                    console.error("Training progress polling failed", error);
                }
            }, 1000);
        } catch (error: unknown) {
            console.error(error);

            const message =
                error instanceof Error
                    ? error.message
                    : "Error contacting modeling API";

            setStatus(message);
            setProgress(0);
            setRunning(false);
        }
    };


    const runEagFronts = async () => {
        if (!aoiFile) {
            setStatus("Please upload an AOI.");
            return;
        }

        setRunning(true);
        setProgress(10);
        setStatus("Starting exotic annual grass invasion front analysis...");
        setEagComplete(false);

        try {
            const response = await fetch("http://127.0.0.1:8000/run-eag-fronts", {
                method: "POST"
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.detail || "EAG analysis failed.");
            }

            setProgress(100);
            setStatus(result.message || "EAG invasion front analysis complete");
            setEagComplete(true);
            await loadEagLayer();

        } catch (error) {
            console.error(error);
            setStatus("Error running EAG invasion front analysis");
            setProgress(0);
        }

        setRunning(false);
    };


    const uploadAOI = async (file: File) => {
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("http://127.0.0.1:8000/upload-aoi", {
                method: "POST",
                body: formData
            });

            if (!res.ok) {
                const err = await res.json();
                console.error("AOI upload backend error:", err);
                throw new Error(err.detail || err.error || "AOI upload failed.");
            }

            const geojson = await res.json();
            console.log("AOI geojson:", geojson);

            setStatus("AOI uploaded successfully.");

            if (!map.current) return;

            if (map.current.getLayer("aoi-fill")) {
                map.current.removeLayer("aoi-fill");
            }
            if (map.current.getLayer("aoi-outline")) {
                map.current.removeLayer("aoi-outline");
            }
            if (map.current.getSource("aoi")) {
                map.current.removeSource("aoi");
            }

            map.current.addSource("aoi", {
                type: "geojson",
                data: geojson
            });

            map.current.addLayer({
                id: "aoi-fill",
                type: "fill",
                source: "aoi",
                paint: {
                    "fill-color": "#3b82f6",
                    "fill-opacity": 0.25
                }
            });

            map.current.addLayer({
                id: "aoi-outline",
                type: "line",
                source: "aoi",
                paint: {
                    "line-color": "#60a5fa",
                    "line-width": 2
                }
            });

            function extendBoundsFromCoords(
                coords: any,
                bounds: maplibregl.LngLatBounds
            ): boolean {
                let added = false;

                if (
                    Array.isArray(coords) &&
                    coords.length >= 2 &&
                    typeof coords[0] === "number" &&
                    typeof coords[1] === "number"
                ) {
                    const lng = coords[0];
                    const lat = coords[1];

                    if (!Number.isNaN(lng) && !Number.isNaN(lat)) {
                        bounds.extend([lng, lat]);
                        return true;
                    }
                    return false;
                }

                if (Array.isArray(coords)) {
                    for (const c of coords) {
                        if (extendBoundsFromCoords(c, bounds)) {
                            added = true;
                        }
                    }
                }

                return added;
            }

            const bounds = new maplibregl.LngLatBounds();
            let hasValidCoords = false;

            if (geojson?.features && Array.isArray(geojson.features)) {
                geojson.features.forEach((feature: any) => {
                    if (!feature?.geometry?.coordinates) return;
                    if (extendBoundsFromCoords(feature.geometry.coordinates, bounds)) {
                        hasValidCoords = true;
                    }
                });
            }

            if (hasValidCoords) {
                map.current.fitBounds(bounds, {
                    padding: 40,
                    duration: 1000
                });
            } else {
                console.error("No valid AOI coordinates found:", geojson);
                setStatus("AOI uploaded, but no valid geometry was found.");
            }

        } catch (error: any) {
            console.error(error);
            setStatus(error.message || "Error uploading AOI");
            setProgress(0);
        }
    };


    const loadPredictionLayer = async () => {
        if (!map.current) return;

        const res = await fetch("http://127.0.0.1:8000/prediction-progress");
        const data = await res.json();

        if (!data.bounds) {
            console.error("Prediction bounds not available.");
            return;
        }

        const mapInstance = map.current;

        if (mapInstance.getLayer("prediction")) {
            mapInstance.removeLayer("prediction");
        }

        if (mapInstance.getSource("prediction")) {
            mapInstance.removeSource("prediction");
        }

        mapInstance.addSource("prediction", {
            type: "raster",
            tiles: [
                `http://127.0.0.1:8000/prediction-tile/{z}/{x}/{y}.png?run_id=${predictionRunId ?? Date.now()}`
            ],
            tileSize: 256
        });

        mapInstance.addLayer({
            id: "prediction",
            type: "raster",
            source: "prediction",
            paint: {
                "raster-opacity": 0.9
            }
        });

        const { west, south, east, north } = data.bounds;

        mapInstance.fitBounds(
            [
                [west, south],
                [east, north]
            ],
            { padding: 40, duration: 1000 }
        );
    };


    const loadEagLayer = async () => {
        if (!map.current) return;

        const res = await fetch("http://127.0.0.1:8000/eag-kernel-bounds");
        const data = await res.json();

        if (!data.bounds) {
            console.error("EAG kernel bounds not available.");
            return;
        }

        const mapInstance = map.current;

        if (mapInstance.getLayer("eag-kernel")) {
            mapInstance.removeLayer("eag-kernel");
        }

        if (mapInstance.getSource("eag-kernel")) {
            mapInstance.removeSource("eag-kernel");
        }

        mapInstance.addSource("eag-kernel", {
            type: "raster",
            tiles: [
                `http://127.0.0.1:8000/eag-kernel-tile/{z}/{x}/{y}.png?ts=${Date.now()}`
            ],
            tileSize: 256
        });

        mapInstance.addLayer({
            id: "eag-kernel",
            type: "raster",
            source: "eag-kernel",
            paint: {
                "raster-opacity": 0.8
            }
        });

        const { west, south, east, north } = data.bounds;

        mapInstance.fitBounds(
            [
                [west, south],
                [east, north]
            ],
            { padding: 40, duration: 1000 }
        );
    };


    const loadCovariates = async () => {
        try {
            setCovariatesLoading(true);

            const res = await fetch("http://127.0.0.1:8000/model-covariates");
            const data = await res.json();

            setCovariates(data.covariates ?? []);
        } catch (error) {
            console.error("Failed to load covariates", error);
            setCovariates([]);
        } finally {
            setCovariatesLoading(false);
        }
    };


    return (
        <main className="relative h-[calc(100vh-72px)] flex overflow-hidden bg-slate-900">

            {/* AMBIENT BACKGROUND LIGHT */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-900 to-slate-950 pointer-events-none"></div>

            {/* SIDEBAR */}
            <aside className="w-80 border-r border-slate-700 bg-gradient-to-b from-slate-800 to-slate-900 p-6 flex flex-col shadow-2xl relative z-10">

                <h2 className="text-xl font-semibold text-blue-400 mb-1">
                    {isSampling
                        ? "Sampling Design"
                        : isFieldModel
                            ? "Field-Based Vegetation Modeling"
                            : isEagFronts
                                ? "Exotic Annual Grass Invasion Fronts"
                                : "Vegetation Tool"}
                </h2>

                <p className="text-sm text-slate-200 mb-6">
                    {isSampling
                        ? "Upload an AOI to generate optimized sampling locations."
                        : isFieldModel
                            ? "Upload an AOI and field data points to train a spatial vegetation model."
                            : isEagFronts
                                ? "Upload an AOI and generate a distance-weighted kernel raster identifying likely exotic annual grass invasion fronts."
                                : "Run vegetation analysis tools in the workspace."}
                </p>



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

                {selectedTool === "field-model" && (
                    <div className="mb-4 border border-slate-700 rounded-lg bg-slate-900/60 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setShowCoordinatePrep((prev) => !prev)}
                            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-800/80"
                        >
                            <div>
                                <h3 className="font-medium text-slate-100">Coordinate Prep Tool</h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    Convert a CSV or zipped shapefile into VegMap-ready formats.
                                </p>
                            </div>
                            <span className="text-slate-300 text-sm">
                                {showCoordinatePrep ? "▲" : "▼"}
                            </span>
                        </button>

                        {showCoordinatePrep && (
                            <div className="border-t border-slate-700 p-4 space-y-4">
                                <input
                                    type="file"
                                    accept=".csv,.zip"
                                    onChange={(e) => handleConvertFileChange(e.target.files?.[0] ?? null)}
                                    className="block w-full text-sm text-slate-300"
                                />

                                <div>
                                    <label className="block text-sm text-slate-300 mb-1">Input CRS</label>
                                    <select
                                        value={convertInputCrs}
                                        onChange={(e) => setConvertInputCrs(e.target.value)}
                                        className="w-full rounded-lg bg-slate-800 border border-slate-700 text-slate-100 p-2"
                                    >
                                        <option value="EPSG:4326">WGS84 (EPSG:4326)</option>
                                        <option value="EPSG:5070">NAD83 / Conus Albers (EPSG:5070)</option>
                                        <option value="EPSG:3857">Web Mercator (EPSG:3857)</option>
                                        <option value="EPSG:26911">UTM Zone 11N (EPSG:26911)</option>
                                        <option value="EPSG:26912">UTM Zone 12N (EPSG:26912)</option>
                                    </select>
                                </div>

                                {convertInputType === "csv" && convertColumns.length > 0 && (
                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <label className="block text-sm text-slate-300 mb-1">X column</label>
                                            <select
                                                value={convertXColumn}
                                                onChange={(e) => setConvertXColumn(e.target.value)}
                                                className="w-full rounded-lg bg-slate-800 border border-slate-700 text-slate-100 p-2"
                                            >
                                                <option value="">Select X column</option>
                                                {convertColumns.map((col) => (
                                                    <option key={col} value={col}>{col}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm text-slate-300 mb-1">Y column</label>
                                            <select
                                                value={convertYColumn}
                                                onChange={(e) => setConvertYColumn(e.target.value)}
                                                className="w-full rounded-lg bg-slate-800 border border-slate-700 text-slate-100 p-2"
                                            >
                                                <option value="">Select Y column</option>
                                                {convertColumns.map((col) => (
                                                    <option key={col} value={col}>{col}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm text-slate-300 mb-1">Response column (optional)</label>
                                            <select
                                                value={convertResponseColumn}
                                                onChange={(e) => setConvertResponseColumn(e.target.value)}
                                                className="w-full rounded-lg bg-slate-800 border border-slate-700 text-slate-100 p-2"
                                            >
                                                <option value="">None</option>
                                                {convertColumns.map((col) => (
                                                    <option key={col} value={col}>{col}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handleConvertInputData}
                                    className="w-full py-2 rounded-lg font-medium bg-emerald-600 hover:bg-emerald-500 text-white"
                                >
                                    Convert Input Data
                                </button>

                                {convertStatus && (
                                    <p className="text-sm text-slate-300">{convertStatus}</p>
                                )}

                                <div className="flex flex-col gap-2">
                                    <a
                                        href="http://127.0.0.1:8000/download-converted-5070"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sm text-amber-300 hover:text-amber-200 underline"
                                    >
                                        Download EPSG:5070 shapefile
                                    </a>

                                    <a
                                        href="http://127.0.0.1:8000/download-converted-wgs84-csv"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sm text-amber-300 hover:text-amber-200 underline"
                                    >
                                        Download WGS84 CSV
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {selectedTool === "field-model" && (
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
                            Upload a zipped shapefile defining the area to model.
                        </p>
                    </div>
                )}

                {selectedTool === "eag-fronts" && (
                    <div className="mb-4 border border-slate-700 rounded-lg p-4 bg-slate-800">
                        <h3 className="font-medium mb-2 text-slate-100">AOI Upload</h3>

                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-emerald-500 transition text-slate-300 text-sm">
                            <span>Click to upload AOI (.zip shapefile)</span>

                            <input
                                type="file"
                                accept=".zip"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files) {
                                        const file = e.target.files[0];
                                        setAoiFile(file);
                                        setEagComplete(false);
                                        setProgress(0);
                                        setStatus("AOI uploaded. Ready to run EAG front analysis.");
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
                            Upload a zipped shapefile defining the analysis area for the EAG invasion front kernel raster.
                        </p>
                    </div>
                )}

                {selectedTool === "field-model" && (
                    <div className="mb-4 border border-slate-700 rounded-lg p-4 bg-slate-800">
                        <h3 className="font-medium mb-2 text-slate-100">Field Data Upload</h3>

                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-blue-500 transition text-slate-300 text-sm">
                            <span>Click to upload CSV</span>

                            <input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files) {
                                        setTrainingCsv(e.target.files[0]);
                                    }
                                }}
                            />
                        </label>

                        {trainingCsv && (
                            <p className="text-xs text-green-400 mt-2">
                                Uploaded: {trainingCsv.name}
                            </p>
                        )}

                        <p className="text-xs text-slate-400 mt-2">
                            CSV must include latitude, longitude, and a vegetation response column. Coordinates must be in WGS84 decimal degrees (EPSG:4326), for example lat = 43.6123 and lon = -116.2019.
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
                                Max number of sampling locations
                                <input
                                    type="number"
                                    value={maxSamples}
                                    onChange={(e) => setMaxSamples(Number(e.target.value))}
                                    className="mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1"
                                />
                            </label>

                            <label className="flex flex-col">
                                Minimum Spacing (m)
                                <input
                                    type="number"
                                    value={minSpacing}
                                    onChange={(e) => setMinSpacing(Number(e.target.value))}
                                    className="mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1"
                                />
                            </label>

                        </div>
                        {recommendedSamples !== null && (
                            <div className="mt-3 rounded-md border border-blue-700/40 bg-slate-900 px-3 py-2">
                                <div className="text-xs text-slate-400">Recommended sample size</div>
                                <div className="text-lg font-semibold text-blue-300">
                                    {recommendedSamples}
                                </div>
                                <div className="text-[11px] text-slate-400 mt-1">
                                    Environmental coverage ≥ 95%
                                </div>
                            </div>
                        )}

                    </div>
                )}

                {selectedTool === "field-model" && (
                    <div className="mb-4 border border-slate-700 rounded-lg p-4 bg-slate-800">
                        <h3 className="font-medium mb-2 text-slate-100">Model Settings</h3>

                        <div className="flex flex-col gap-3 text-xs text-slate-300">
                            <label className="flex flex-col">
                                Response column
                                <input
                                    type="text"
                                    value={responseColumn}
                                    onChange={(e) => setResponseColumn(e.target.value)}
                                    className="mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1"
                                />
                            </label>

                            <label className="flex flex-col">
                                Latitude column
                                <input
                                    type="text"
                                    value={latColumn}
                                    onChange={(e) => setLatColumn(e.target.value)}
                                    className="mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1"
                                />
                            </label>

                            <label className="flex flex-col">
                                Longitude column
                                <input
                                    type="text"
                                    value={lonColumn}
                                    onChange={(e) => setLonColumn(e.target.value)}
                                    className="mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1"
                                />
                            </label>
                        </div>
                    </div>
                )}

                {selectedTool === "eag-fronts" && (
                    <div className="mb-4 border border-slate-700 rounded-lg p-4 bg-slate-800">
                        <h3 className="font-medium mb-2 text-slate-100">Analysis Output</h3>

                        <p className="text-xs text-slate-300 leading-relaxed">
                            This tool uses the uploaded AOI and fixed backend annual grass inputs to generate a
                            distance-weighted kernel raster highlighting likely invasion front pressure.
                        </p>

                        <p className="text-xs text-slate-400 mt-3">
                            Current export: kernel raster (.tif)
                        </p>
                    </div>
                )}

                {/* RUN BUTTON */}
                <button
                    onClick={() => {
                        if (selectedTool === "sampling") runModel();
                        if (selectedTool === "field-model") runFieldModel();
                        if (selectedTool === "eag-fronts") runEagFronts();
                    }}
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
                            : selectedTool === "sampling"
                                ? "Run Sampling Design"
                                : selectedTool === "field-model"
                                    ? "Run Field-Based Model"
                                    : selectedTool === "eag-fronts"
                                        ? "Run EAG Front Analysis"
                                        : "Run Tool"}
                </button>

                {samplingComplete && selectedTool === "sampling" && (
                    <button
                        onClick={() => window.open("http://127.0.0.1:8000/download-sampling")}
                        className="w-full py-3 rounded-lg font-medium transition shadow-sm mb-4 bg-green-700 hover:bg-green-800 text-white"
                    >
                        Export Sampling Points (.shp)
                    </button>
                )}

                {eagComplete && selectedTool === "eag-fronts" && (
                    <button
                        onClick={() => window.open("http://127.0.0.1:8000/download-eag-kernel")}
                        className="w-full py-3 rounded-lg font-medium transition shadow-sm mb-4 bg-green-700 hover:bg-green-800 text-white"
                    >
                        Export Kernel Raster (.tif)
                    </button>
                )}

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
                        {isSampling
                            ? "Sampling Design Workspace"
                            : isFieldModel
                                ? "Field-Based Vegetation Modeling"
                                : isEagFronts
                                    ? "Exotic Annual Grass Invasion Front Workspace"
                                    : "Vegetation Workspace"}
                    </h1>

                    <div className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-md">
                        {running
                            ? "Running"
                            : predictionComplete
                                ? "Prediction complete"
                                : eagComplete
                                    ? "EAG complete"
                                    : samplingComplete
                                        ? "Sampling complete"
                                        : modelComplete
                                            ? "Model complete"
                                            : "Idle"}
                    </div>

                </div>

                <p className="text-slate-200 mb-6">
                    {isSampling
                        ? "Sampling locations and environmental coverage diagnostics will appear here."
                        : isFieldModel
                            ? "Model training outputs and predicted vegetation maps will appear here."
                            : isEagFronts
                                ? "The EAG invasion front kernel raster will be generated for the uploaded AOI and made available for export."
                                : "Vegetation analysis outputs will appear here."}
                </p>

                {/* TAB BUTTONS */}
                {selectedTool === "field-model" && (
                    <div className="mb-4 flex items-center gap-2">
                        <button
                            onClick={() => setWorkspaceTab("map")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${workspaceTab === "map"
                                ? "bg-blue-700 text-white"
                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                }`}
                        >
                            Map View
                        </button>

                        <button
                            onClick={() => setWorkspaceTab("details")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${workspaceTab === "details"
                                ? "bg-blue-700 text-white"
                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                }`}
                        >
                            Model Details
                        </button>
                    </div>
                )}

                {/* MAP CANVAS */}
                <div
                    className={`relative flex-1 min-h-[500px] rounded-xl border border-slate-700 overflow-hidden shadow-[0_0_60px_rgba(59,130,246,0.15)] ${selectedTool === "field-model" && workspaceTab === "details"
                        ? "hidden"
                        : "block"
                        }`}
                >

                    {/* MAP */}
                    <div ref={mapContainer} className="w-full h-full" />

                    {/* COVARIATES PANEL */}
                    {selectedTool === "field-model" && showCovariates && (
                        <div className="absolute top-4 left-4 z-20 w-[380px] max-h-[420px] overflow-y-auto bg-slate-900/95 border border-slate-700 rounded-lg p-4 shadow-xl">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-blue-300">
                                    Raster Covariates
                                </h3>

                                <button
                                    onClick={() => setShowCovariates(false)}
                                    className="text-xs text-slate-400 hover:text-slate-200"
                                >
                                    Close
                                </button>
                            </div>

                            <p className="text-xs text-slate-400 mb-4">
                                These raster predictors were used by the trained field-based vegetation model.
                            </p>

                            {covariatesLoading ? (
                                <div className="text-xs text-slate-300">Loading covariates...</div>
                            ) : covariates.length === 0 ? (
                                <div className="text-xs text-slate-400">
                                    No covariate information available yet.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {covariates.map((item) => (
                                        <div
                                            key={item.name}
                                            className="rounded-md border border-slate-800 bg-slate-950/60 p-3"
                                        >
                                            <div className="text-sm font-medium text-slate-100">
                                                {item.name}
                                            </div>
                                            <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                                                {item.description}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* MODEL DIAGNOSTICS */}
                    {modelComplete && metrics && selectedTool === "field-model" && (
                        <div className="absolute bottom-4 left-4 z-20 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl">
                            <div className="bg-slate-900/95 border border-slate-700 rounded-lg p-4 min-w-[260px]">
                                <h3 className="text-sm font-semibold text-blue-300 mb-3">
                                    Model Performance
                                </h3>

                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <div className="text-xs text-slate-400">R²</div>
                                        <div className="text-lg font-semibold text-green-400">
                                            {typeof metrics.r2 === "number" ? metrics.r2.toFixed(3) : "NA"}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs text-slate-400">RMSE</div>
                                        <div className="text-lg font-semibold text-blue-400">
                                            {typeof metrics.rmse === "number" ? metrics.rmse.toFixed(3) : "NA"}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs text-slate-400">MAE</div>
                                        <div className="text-lg font-semibold text-purple-400">
                                            {typeof metrics.mae === "number" ? metrics.mae.toFixed(3) : "NA"}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 text-xs text-slate-400">
                                    Response: <span className="text-slate-200">{metrics.response_column}</span>
                                </div>
                            </div>

                            {metrics.var_importance?.length > 0 && (
                                <div className="bg-slate-900/95 border border-slate-700 rounded-lg p-4 w-[420px]">
                                    <h3 className="text-sm font-semibold text-blue-300 mb-3">
                                        Variable Importance
                                    </h3>

                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={metrics.var_importance} layout="vertical">
                                            <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                                            <YAxis
                                                type="category"
                                                dataKey="variable"
                                                stroke="#94a3b8"
                                                tick={{ fontSize: 10 }}
                                                width={120}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    background: "#0f172a",
                                                    border: "1px solid #334155"
                                                }}
                                            />
                                            <Bar dataKey="relative_importance" fill="#3b82f6" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    )}

                    {selectedTool === "field-model" && modelComplete && (
                        <div className="absolute top-4 right-4 z-20 flex flex-col gap-3 w-72">

                            <button
                                onClick={async () => {
                                    if (!showCovariates && covariates.length === 0) {
                                        await loadCovariates();
                                    }
                                    setShowCovariates(!showCovariates);
                                }}
                                className="w-full py-3 rounded-lg font-medium bg-slate-800 hover:bg-slate-700 text-white border border-slate-600"
                            >
                                {showCovariates ? "Hide Covariate Info" : "Show Covariate Info"}
                            </button>

                            {!predictionComplete && (
                                <button
                                    onClick={async () => {
                                        try {
                                            clearPredictionLayer();
                                            setPredictionRunId(null);

                                            setRunning(true);
                                            setPredictionComplete(false);
                                            setLegendUrl(null);
                                            setLegendAvailable(false);
                                            setStatus("Generating prediction raster...");
                                            setProgress(0);

                                            const startRes = await fetch("http://127.0.0.1:8000/predict-raster", {
                                                method: "POST"
                                            });

                                            if (!startRes.ok) {
                                                throw new Error("Prediction process failed to start.");
                                            }

                                            const startData = await startRes.json();

                                            if (startData.status !== "started") {
                                                throw new Error("Prediction process failed to start.");
                                            }

                                            const currentRunId = startData.run_id;
                                            setPredictionRunId(currentRunId);

                                            const interval = setInterval(async () => {
                                                try {
                                                    const res = await fetch("http://127.0.0.1:8000/prediction-progress");
                                                    const data = await res.json();

                                                    if (data.run_id && data.run_id !== currentRunId) {
                                                        return;
                                                    }

                                                    const pct = Math.round((data.progress ?? 0) * 100);
                                                    setProgress(pct);

                                                    if (data.status === "starting") {
                                                        setStatus("Preparing prediction...");
                                                    } else if (data.status === "predicting") {
                                                        setStatus(`Predicting tiles (${data.tiles_done}/${data.tiles_total})`);
                                                    } else if (data.status === "writing_raster") {
                                                        setStatus("Writing raster...");
                                                    } else if (data.status === "building_cog") {
                                                        setStatus("Building COG for map display...");
                                                    } else if (data.status === "complete") {
                                                        setStatus("Prediction complete");
                                                    } else if (data.status === "error") {
                                                        clearInterval(interval);
                                                        setRunning(false);
                                                        setProgress(0);
                                                        setStatus(data.message || "Prediction failed");
                                                        return;
                                                    }

                                                    if (data.status === "complete") {
                                                        clearInterval(interval);

                                                        setRunning(false);
                                                        setPredictionComplete(true);
                                                        setProgress(100);
                                                        setStatus("Prediction raster complete");
                                                        setLegendAvailable(true);
                                                        setLegendUrl(`http://127.0.0.1:8000/prediction-legend?ts=${currentRunId}`);

                                                        await loadPredictionLayer();
                                                    }
                                                } catch (err) {
                                                    console.error("Progress polling failed", err);
                                                }
                                            }, 1000);

                                        } catch (error) {
                                            console.error(error);
                                            setStatus("Error generating prediction raster");
                                            setRunning(false);
                                            setProgress(0);
                                        }
                                    }}
                                    disabled={running}
                                    className="w-full py-3 rounded-lg font-medium bg-purple-700 hover:bg-purple-800 text-white disabled:bg-slate-700"
                                >
                                    Generate Prediction Map
                                </button>
                            )}

                            {predictionComplete && (
                                <button
                                    onClick={() => window.open("http://127.0.0.1:8000/download-prediction")}
                                    className="w-full py-3 rounded-lg font-medium bg-green-700 hover:bg-green-800 text-white"
                                >
                                    Download Prediction Raster
                                </button>
                            )}
                        </div>
                    )}

                    {predictionComplete && (
                        <div className="absolute top-4 left-4 z-20 bg-slate-900/95 border border-slate-700 rounded-lg p-3 shadow-xl">
                            <h3 className="text-xs font-semibold text-blue-300 mb-2">
                                Prediction Legend
                            </h3>

                            {legendAvailable && legendUrl ? (
                                <img
                                    src={legendUrl}
                                    alt="Prediction legend"
                                    className="w-48"
                                    onError={() => {
                                        console.warn("Prediction legend not available yet.");
                                        setLegendAvailable(false);
                                    }}
                                />
                            ) : (
                                <p className="text-xs text-slate-400">
                                    Legend not available yet.
                                </p>
                            )}
                        </div>
                    )}

                    {selectedTool === "field-model" && running && (
                        <div className="absolute top-20 right-4 z-20 w-72 bg-slate-900/95 border border-slate-700 rounded-lg p-4 shadow-xl">
                            <h3 className="text-sm font-semibold text-blue-300 mb-2">
                                Prediction Progress
                            </h3>

                            <p className="text-xs text-slate-300 mb-3">
                                {status}
                            </p>

                            <div className="w-full h-3 bg-slate-700 rounded overflow-hidden">
                                <div
                                    className="h-full bg-purple-500 transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            <div className="mt-2 text-right text-xs text-slate-400">
                                {progress}%
                            </div>
                        </div>
                    )}

                    {/* COVERAGE CURVE PANEL */}
                    {selectedTool === "sampling" && samplingComplete && (
                        <div className="absolute bottom-4 left-4 w-72 bg-slate-900/95 border border-slate-700 rounded-lg p-3 shadow-xl">

                            <h3 className="text-xs font-semibold text-blue-300 mb-2">
                                Environmental Coverage
                            </h3>

                            <ResponsiveContainer width="100%" height={160}>
                                <LineChart data={coverageCurve}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />

                                    <XAxis
                                        dataKey="n"
                                        stroke="#94a3b8"
                                        tick={{ fontSize: 10 }}
                                    />

                                    <YAxis
                                        stroke="#94a3b8"
                                        domain={[0, 1]}
                                        tickFormatter={(v) => `${Math.round(v * 100)}%`}
                                        tick={{ fontSize: 10 }}
                                    />

                                    <Tooltip
                                        formatter={(value) =>
                                            typeof value === "number"
                                                ? `${(value * 100).toFixed(1)}%`
                                                : value
                                        }
                                        contentStyle={{
                                            background: "#0f172a",
                                            border: "1px solid #334155"
                                        }}
                                    />

                                    <ReferenceLine y={0.95} stroke="#22c55e" strokeDasharray="3 3" />

                                    <Line
                                        type="monotone"
                                        dataKey="p_covered"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>

                        </div>
                    )}

                </div>


                {/* MODEL DETAILS PANEL */}
                {selectedTool === "field-model" && workspaceTab === "details" && (
                    <div className="flex-1 min-h-[500px] rounded-xl border border-slate-700 bg-slate-900/95 p-6 overflow-y-auto shadow-[0_0_60px_rgba(59,130,246,0.10)]">
                        <div className="max-w-4xl space-y-6">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-100 mb-2">
                                    Field-Based Vegetation Model Details
                                </h2>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    This tool uses field observations and landscape raster covariates to train a spatial model
                                    that predicts vegetation cover across the uploaded area of interest. The goal is to extend
                                    plot-level measurements into a continuous map while preserving relationships with terrain,
                                    soils, climate, and other environmental variables.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
                                    <h3 className="text-sm font-semibold text-blue-300 mb-2">Required Inputs</h3>
                                    <ul className="text-sm text-slate-300 space-y-2">
                                        <li><span className="text-slate-100 font-medium">AOI shapefile:</span> defines the prediction boundary.</li>
                                        <li><span className="text-slate-100 font-medium">Field CSV:</span> includes plot coordinates and a response variable.</li>
                                        <li><span className="text-slate-100 font-medium">Latitude / longitude columns:</span> must be WGS84 decimal degrees (EPSG:4326).</li>
                                        <li><span className="text-slate-100 font-medium">Response column:</span> the vegetation variable being modeled.</li>
                                    </ul>
                                </div>

                                <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
                                    <h3 className="text-sm font-semibold text-blue-300 mb-2">Outputs</h3>
                                    <ul className="text-sm text-slate-300 space-y-2">
                                        <li>Mapped training points</li>
                                        <li>Model performance metrics</li>
                                        <li>Variable importance</li>
                                        <li>Prediction raster clipped to the AOI</li>
                                        <li>Downloadable GeoTIFF output</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
                                <h3 className="text-sm font-semibold text-blue-300 mb-3">How the workflow operates</h3>

                                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                    {[
                                        "Upload AOI",
                                        "Upload field data",
                                        "Extract raster values to plots",
                                        "Train model",
                                        "Predict across the AOI"
                                    ].map((step, i) => (
                                        <div key={step} className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                                            <div className="text-xs text-blue-400 mb-1">Step {i + 1}</div>
                                            <div className="text-sm text-slate-200">{step}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
                                <h3 className="text-sm font-semibold text-blue-300 mb-2">How to interpret the metrics</h3>
                                <div className="space-y-2 text-sm text-slate-300">
                                    <p><span className="text-slate-100 font-medium">R²:</span> indicates how much variation in the response is explained by the model.</p>
                                    <p><span className="text-slate-100 font-medium">RMSE:</span> summarizes the typical size of prediction errors, with larger errors weighted more strongly.</p>
                                    <p><span className="text-slate-100 font-medium">MAE:</span> summarizes the average absolute prediction error and is often easier to interpret in the units of the response variable.</p>
                                    <p><span className="text-slate-100 font-medium">Variable importance:</span> shows which predictors contributed most strongly to the fitted model.</p>
                                </div>
                            </div>

                            <div className="rounded-xl border border-amber-700/40 bg-amber-950/20 p-4">
                                <h3 className="text-sm font-semibold text-amber-300 mb-2">Interpretation and limitations</h3>
                                <div className="space-y-2 text-sm text-slate-300">
                                    <p>Predictions are strongest where field plots represent the environmental conditions found across the AOI.</p>
                                    <p>Predictions may be less reliable in poorly sampled environments or where raster covariates do not capture important ecological drivers.</p>
                                    <p>The output raster is a modeled estimate of vegetation cover, not a direct measurement at every pixel.</p>
                                    <p>Users should interpret the map together with field knowledge, model metrics, and the spatial distribution of training points.</p>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-blue-300">Raster covariates</h3>
                                    <button
                                        onClick={async () => {
                                            if (covariates.length === 0) {
                                                await loadCovariates();
                                            }
                                            setShowCovariates(true);
                                            setWorkspaceTab("map");
                                        }}
                                        className="px-3 py-1.5 rounded-md bg-slate-800 text-slate-200 text-xs hover:bg-slate-700"
                                    >
                                        Open covariate list on map
                                    </button>
                                </div>

                                <p className="text-sm text-slate-300 leading-relaxed">
                                    The model uses raster covariates that describe landscape conditions such as terrain, soils,
                                    climate, and vegetation-related predictors. These variables are sampled at field plot locations
                                    during training and then used to predict the response continuously across the AOI.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

            </section>

        </main>
    );
}