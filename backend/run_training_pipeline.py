import os
import sys
import json
import subprocess
import pandas as pd
import geopandas as gpd

PROGRESS_JSON = "outputs/training_progress.json"
METRICS_JSON = "outputs/model_metrics.json"

aoi_path = sys.argv[1]
csv_path = sys.argv[2]
lat_column = sys.argv[3]
lon_column = sys.argv[4]
response_column = sys.argv[5]

INPUT_CRS = "EPSG:4326"  # current tool requirement

def write_progress(progress, status, message=None):
    payload = {
        "progress": progress,
        "status": status
    }
    if message is not None:
        payload["message"] = message

    with open(PROGRESS_JSON, "w") as f:
        json.dump(payload, f)

try:
    write_progress(0.05, "building_training_table")

    subprocess.run([
        sys.executable,
        "build_training_data.py",
        aoi_path,
        csv_path,
        lat_column,
        lon_column
    ], check=True)

    write_progress(0.35, "training_model")

    subprocess.run([
        sys.executable,
        "train_h2o_model.py",
        response_column
    ], check=True)

    write_progress(0.90, "loading_outputs")

    metrics = None
    if os.path.exists(METRICS_JSON):
        with open(METRICS_JSON) as f:
            metrics = json.load(f)

    df = pd.read_csv(csv_path)

    if lat_column not in df.columns or lon_column not in df.columns:
        raise Exception(f"CSV missing lat/lon columns: {lat_column}, {lon_column}")

    if response_column not in df.columns:
        raise Exception(f"CSV missing response column: {response_column}")

    # Force coordinates to numeric
    df[lat_column] = pd.to_numeric(df[lat_column], errors="coerce")
    df[lon_column] = pd.to_numeric(df[lon_column], errors="coerce")

    # Keep only rows with usable coordinates
    valid_mask = df[lat_column].notna() & df[lon_column].notna()
    df_valid = df.loc[valid_mask].copy()

    if df_valid.empty:
        raise Exception("No valid numeric latitude/longitude values found in CSV.")

    # Enforce WGS84 decimal degree ranges
    if ((df_valid[lat_column] < -90) | (df_valid[lat_column] > 90)).any():
        raise Exception(
            f"Latitude column '{lat_column}' contains values outside [-90, 90]. "
            "This tool currently requires WGS84 decimal degrees (EPSG:4326)."
        )

    if ((df_valid[lon_column] < -180) | (df_valid[lon_column] > 180)).any():
        raise Exception(
            f"Longitude column '{lon_column}' contains values outside [-180, 180]. "
            "This tool currently requires WGS84 decimal degrees (EPSG:4326)."
        )

    gdf = gpd.GeoDataFrame(
        df_valid.copy(),
        geometry=gpd.points_from_xy(df_valid[lon_column], df_valid[lat_column]),
        crs=INPUT_CRS
    )

    training_points_geojson = json.loads(gdf.to_json())

    with open("outputs/training_result.json", "w") as f:
        json.dump({
            "status": "complete",
            "metrics": metrics,
            "training_points": training_points_geojson
        }, f)

    write_progress(1.0, "complete")

except Exception as e:
    write_progress(0, "error", str(e))