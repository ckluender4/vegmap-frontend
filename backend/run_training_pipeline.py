import os
import sys
import json
import shutil
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

def write_progress(progress, status):
    with open(PROGRESS_JSON, "w") as f:
        json.dump({
            "progress": progress,
            "status": status
        }, f)

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

    write_progress(0.9, "loading_outputs")

    metrics = None
    if os.path.exists(METRICS_JSON):
        with open(METRICS_JSON) as f:
            metrics = json.load(f)

    df = pd.read_csv(csv_path)

    if lat_column not in df.columns or lon_column not in df.columns:
        raise Exception(f"CSV missing lat/lon columns: {lat_column}, {lon_column}")

    gdf = gpd.GeoDataFrame(
        df.copy(),
        geometry=gpd.points_from_xy(df[lon_column], df[lat_column]),
        crs="EPSG:4326"
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
    with open(PROGRESS_JSON, "w") as f:
        json.dump({
            "progress": 0,
            "status": "error",
            "message": str(e)
        }, f)