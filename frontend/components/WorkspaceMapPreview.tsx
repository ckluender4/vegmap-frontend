"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function WorkspaceMapPreview() {
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const map = useRef<maplibregl.Map | null>(null);

    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        let shimmerInterval: any;
        let scanInterval: any;
        let driftInterval: any;

        const mapInstance = new maplibregl.Map({
            container: mapContainer.current,

            style: {
                version: 8,
                sources: {
                    esri: {
                        type: "raster",
                        tiles: [
                            "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        ],
                        tileSize: 256,
                        attribution: "Esri, Maxar, Earthstar Geographics"
                    }
                },

                layers: [
                    {
                        id: "satellite",
                        type: "raster",
                        source: "esri"
                    }
                ]
            },

            center: [-115, 43],
            zoom: 6,
            pitch: 50,
            bearing: -10
        });

        map.current = mapInstance;

        mapInstance.addControl(new maplibregl.NavigationControl(), "top-right");

        mapInstance.on("load", () => {

            mapInstance.resize();

            /* ---------------------------------- */
            /* Irregular AOI polygon              */
            /* ---------------------------------- */

            const aoiGeoJSON: GeoJSON.Feature = {
                type: "Feature",
                properties: {},
                geometry: {
                    type: "Polygon",
                    coordinates: [[
                        [-115.35, 43.25],
                        [-115.15, 43.55],
                        [-114.85, 43.6],
                        [-114.7, 43.45],
                        [-114.8, 43.25],
                        [-115.1, 43.15],
                        [-115.35, 43.25]
                    ]]
                }
            };

            mapInstance.addSource("demo-aoi", {
                type: "geojson",
                data: aoiGeoJSON
            });

            mapInstance.addLayer({
                id: "aoi-fill",
                type: "fill",
                source: "demo-aoi",
                paint: {
                    "fill-color": "#3b82f6",
                    "fill-opacity": 0.15
                }
            });

            mapInstance.addLayer({
                id: "aoi-outline",
                type: "line",
                source: "demo-aoi",
                paint: {
                    "line-color": "#60a5fa",
                    "line-width": 2
                }
            });

            /* ---------------------------------- */
            /* Zoom map to AOI                    */
            /* ---------------------------------- */

            const bounds = new maplibregl.LngLatBounds();

            (aoiGeoJSON.geometry as GeoJSON.Polygon).coordinates[0].forEach(coord => {
                bounds.extend(coord as [number, number]);
            });

            mapInstance.fitBounds(bounds, {
                padding: 80,
                duration: 1200
            });


            /* ---------------------------------- */
            /* High-resolution CNN vegetation map */
            /* with spatial autocorrelation       */
            /* ---------------------------------- */

            const vegCells: GeoJSON.Feature[] = [];

            const cellSize = 0.002;     // raster resolution
            const seedSize = 0.01;      // vegetation patch size

            const aoiCoords = (aoiGeoJSON.geometry as GeoJSON.Polygon).coordinates[0];

            const classes = [
                "shrub",
                "grass",
                "bare",
                "cheatgrass",
                "tree",
                "forb"
            ];


            /* ---------------------------------- */
            /* Helper: point in polygon           */
            /* ---------------------------------- */

            function pointInPolygon(point: number[], polygon: number[][]) {

                let x = point[0];
                let y = point[1];
                let inside = false;

                for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {

                    const xi = polygon[i][0];
                    const yi = polygon[i][1];
                    const xj = polygon[j][0];
                    const yj = polygon[j][1];

                    const intersect =
                        ((yi > y) !== (yj > y)) &&
                        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

                    if (intersect) inside = !inside;
                }

                return inside;
            }


            /* ---------------------------------- */
            /* Generate coarse vegetation seeds   */
            /* ---------------------------------- */

            const seeds: { x: number, y: number, cls: string }[] = [];

            for (let x = -115.35; x < -114.7; x += seedSize) {
                for (let y = 43.15; y < 43.6; y += seedSize) {

                    seeds.push({
                        x,
                        y,
                        cls: classes[Math.floor(Math.random() * classes.length)]
                    });

                }
            }


            /* ---------------------------------- */
            /* Find nearest seed class            */
            /* ---------------------------------- */

            function nearestClass(x: number, y: number) {

                let best = seeds[0];
                let bestDist = Infinity;

                for (const s of seeds) {

                    const d =
                        (x - s.x) * (x - s.x) +
                        (y - s.y) * (y - s.y);

                    if (d < bestDist) {
                        bestDist = d;
                        best = s;
                    }

                }

                return best.cls;
            }


            /* ---------------------------------- */
            /* Build vegetation raster            */
            /* ---------------------------------- */

            for (let x = -115.35; x < -114.7; x += cellSize) {
                for (let y = 43.15; y < 43.6; y += cellSize) {

                    const center = [x + cellSize / 2, y + cellSize / 2];

                    if (!pointInPolygon(center, aoiCoords)) continue;

                    let cls = nearestClass(x, y);


                    /* edge smoothing (class mixing) */

                    if (Math.random() < 0.08) {
                        cls = classes[Math.floor(Math.random() * classes.length)];
                    }


                    vegCells.push({
                        type: "Feature",
                        properties: { class: cls },
                        geometry: {
                            type: "Polygon",
                            coordinates: [[
                                [x, y],
                                [x + cellSize, y],
                                [x + cellSize, y + cellSize],
                                [x, y + cellSize],
                                [x, y]
                            ]]
                        }
                    });

                }
            }


            /* ---------------------------------- */
            /* Add raster to map                  */
            /* ---------------------------------- */

            mapInstance.addSource("veg-demo", {
                type: "geojson",
                data: {
                    type: "FeatureCollection",
                    features: vegCells
                }
            });


            mapInstance.addLayer({
                id: "veg-layer",
                type: "fill",
                source: "veg-demo",
                paint: {
                    "fill-color": [
                        "match",
                        ["get", "class"],

                        "shrub", "#2ecc71",
                        "grass", "#f1c40f",
                        "bare", "#a67c52",
                        "cheatgrass", "#e74c3c",
                        "tree", "#1b5e20",
                        "forb", "#9b59b6",

                        "#cccccc"
                    ],
                    "fill-opacity": 0.55
                }
            });

            /* ---------------------------------- */
            /* AI scan animation                  */
            /* ---------------------------------- */

            mapInstance.addSource("scan-line", {
                type: "geojson",
                data: {
                    type: "Feature",
                    properties: {},
                    geometry: {
                        type: "Polygon",
                        coordinates: [[
                            [-115.3, 43.2],
                            [-115.3, 43.6],
                            [-115.28, 43.6],
                            [-115.28, 43.2],
                            [-115.3, 43.2]
                        ]]
                    }
                }
            });

            mapInstance.addLayer({
                id: "scan-layer",
                type: "fill",
                source: "scan-line",
                paint: {
                    "fill-color": "#ffffff",
                    "fill-opacity": 0.08
                }
            });

            /* ---------------------------------- */
            /* CNN confidence shimmer             */
            /* ---------------------------------- */

            let shimmerPhase = 0;

            scanInterval = setInterval(() => {

                shimmerPhase += 0.18;

                const opacity =
                    0.55 + Math.sin(shimmerPhase) * 0.18;

                mapInstance.setPaintProperty(
                    "veg-layer",
                    "fill-opacity",
                    opacity
                );

            }, 100);

            /* ---------------------------------- */
            /* Sampling network (inside AOI)      */
            /* ---------------------------------- */

            const points: GeoJSON.Feature[] = [];

            const aoiPoly = (aoiGeoJSON.geometry as GeoJSON.Polygon).coordinates[0];

            const minX = -115.35;
            const maxX = -114.7;
            const minY = 43.15;
            const maxY = 43.6;

            const targetPoints = 120;

            while (points.length < targetPoints) {

                const x = minX + Math.random() * (maxX - minX);
                const y = minY + Math.random() * (maxY - minY);

                if (!pointInPolygon([x, y], aoiPoly)) continue;

                points.push({
                    type: "Feature",
                    properties: {},
                    geometry: {
                        type: "Point",
                        coordinates: [x, y]
                    }
                });

            }

            const samplePoints: GeoJSON.FeatureCollection = {
                type: "FeatureCollection",
                features: points
            };

            mapInstance.addSource("samples", {
                type: "geojson",
                data: samplePoints
            });

            mapInstance.addLayer({
                id: "samples-layer",
                type: "circle",
                source: "samples",
                paint: {
                    "circle-radius": 3,
                    "circle-color": "#ffffff",
                    "circle-stroke-color": "#1d4ed8",
                    "circle-stroke-width": 1.4,
                    "circle-opacity": 0.9
                }
            });

            /* ---------------------------------- */
            /* Slow cinematic drift               */
            /* ---------------------------------- */

            let scanX = -115.3;

            driftInterval = setInterval(() => {

                scanX += 0.02;

                const scanGeom: GeoJSON.Feature = {
                    type: "Feature",
                    properties: {},
                    geometry: {
                        type: "Polygon",
                        coordinates: [[
                            [scanX, 43.2],
                            [scanX, 43.6],
                            [scanX + 0.02, 43.6],
                            [scanX + 0.02, 43.2],
                            [scanX, 43.2]
                        ]]
                    }
                };

                const source = mapInstance.getSource("scan-line") as maplibregl.GeoJSONSource;

                source.setData(scanGeom);

                if (scanX > -114.7) scanX = -115.3;

            }, 120);

            let lng = -115;
            let lat = 43;

            setInterval(() => {

                lng += 0.003;
                lat += 0.0015;

                mapInstance.easeTo({
                    center: [lng, lat],
                    duration: 8000,
                    easing: (t) => t
                });

            }, 8000);

        });

        return () => {

            if (shimmerInterval) clearInterval(shimmerInterval);
            if (scanInterval) clearInterval(scanInterval);
            if (driftInterval) clearInterval(driftInterval);

            mapInstance.remove();
            map.current = null;

        };

    }, []);

    return (
        <div className="relative w-full h-full">
            <div
                ref={mapContainer}
                className="absolute inset-0 w-full h-full"
            />
        </div>
    );
}