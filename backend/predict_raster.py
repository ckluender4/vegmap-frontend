import os
import json
import subprocess
import h2o
import rasterio
import rasterio.mask
import numpy as np
import pandas as pd
import geopandas as gpd
import matplotlib.pyplot as plt
import matplotlib
from matplotlib.colors import Normalize
from rasterio.warp import transform_bounds

STACK = "S:/Shared Storage/FIREss/GIS DATA REPOSITORY/NEW CARBON/STACKS/WEST_FullStack_5070_30m.tif"
AOI = "uploads/uploaded_aoi.shp"

OUTPUT = "outputs/prediction.tif"
COG_OUTPUT = "outputs/prediction_cog.tif"
LEGEND_OUTPUT = "outputs/prediction_legend.png"
METRICS_JSON = "outputs/model_metrics.json"
PROGRESS_JSON = "outputs/prediction_progress.json"

os.makedirs("outputs", exist_ok=True)

print("Starting prediction...")

# clean old outputs
for path in [OUTPUT, COG_OUTPUT, LEGEND_OUTPUT, PROGRESS_JSON]:
    if os.path.exists(path):
        try:
            os.remove(path)
        except OSError:
            pass

# -----------------------------
# Initialize progress file
# -----------------------------
with open(PROGRESS_JSON, "w") as f:
    json.dump({
        "progress": 0.0,
        "tiles_done": 0,
        "tiles_total": 0,
        "status": "starting"
    }, f)

# -----------------------------
# Load model metadata
# -----------------------------
with open(METRICS_JSON) as f:
    metrics = json.load(f)

MODEL = metrics["model_path"]
predictors = metrics["predictors"]

# -----------------------------
# Initialize H2O
# -----------------------------
h2o.init(max_mem_size="4G")
model = h2o.import_mojo(MODEL)

# -----------------------------
# Load AOI
# -----------------------------
aoi = gpd.read_file(AOI)

# -----------------------------
# Open raster stack and clip
# -----------------------------
with rasterio.open(STACK) as src:
    aoi = aoi.to_crs(src.crs)

    clipped, transform = rasterio.mask.mask(
        src,
        aoi.geometry,
        crop=True,
        filled=True,
        nodata=np.nan
    )

    band_names = list(src.descriptions)
    if not band_names or all(b is None for b in band_names):
        band_names = [str(i + 1) for i in range(src.count)]

    print("Raster band names:")
    print(band_names)

    missing = [p for p in predictors if p not in band_names]
    if missing:
        raise Exception(f"Predictors not found in raster stack: {missing}")

    predictor_idx = [band_names.index(p) for p in predictors]
    predictor_stack = clipped[predictor_idx]

    rows, cols = predictor_stack.shape[1:]
    print("Prediction grid size:", rows, cols)

    meta = src.meta.copy()
    meta.update({
        "driver": "GTiff",
        "height": rows,
        "width": cols,
        "transform": transform,
        "count": 1,
        "dtype": "float32",
        "nodata": -9999.0,
        "compress": "LZW",
        "tiled": True,
        "blockxsize": 512,
        "blockysize": 512
    })

    left = transform.c
    top = transform.f
    right = left + transform.a * cols
    bottom = top + transform.e * rows

    bounds_wgs84 = transform_bounds(
        src.crs,
        "EPSG:4326",
        left,
        bottom,
        right,
        top
    )

# -----------------------------
# Tile prediction
# -----------------------------
tile = 512
prediction = np.full((rows, cols), np.nan, dtype="float32")

tiles_x = int(np.ceil(cols / tile))
tiles_y = int(np.ceil(rows / tile))
total_tiles = tiles_x * tiles_y
tile_counter = 0

with open(PROGRESS_JSON, "w") as f:
    json.dump({
        "progress": 0.0,
        "tiles_done": 0,
        "tiles_total": total_tiles,
        "status": "predicting"
    }, f)

for y in range(0, rows, tile):
    for x in range(0, cols, tile):
        tile_counter += 1

        y2 = min(y + tile, rows)
        x2 = min(x + tile, cols)

        data = predictor_stack[:, y:y2, x:x2]
        X = data.reshape(len(predictors), -1).T
        df = pd.DataFrame(X, columns=predictors)

        valid = ~df.isna().any(axis=1)
        pred = np.full(len(df), np.nan, dtype="float32")

        if valid.any():
            hf = h2o.H2OFrame(df.loc[valid, predictors])
            pred_valid = model.predict(hf).as_data_frame().iloc[:, 0].values

            # constrain predictions to valid range
            pred_valid = np.clip(pred_valid, 0, 100)

            pred[valid] = pred_valid.astype("float32")

        pred = pred.reshape(y2 - y, x2 - x)
        prediction[y:y2, x:x2] = pred

        with open(PROGRESS_JSON, "w") as f:
            json.dump({
                "progress": tile_counter / total_tiles,
                "tiles_done": tile_counter,
                "tiles_total": total_tiles,
                "status": "predicting"
            }, f)

        print(f"Tile {tile_counter}/{total_tiles}")

# -----------------------------
# Write GeoTIFF
# -----------------------------

# convert predictions to 0–100 scale
prediction = np.clip(prediction, 0, 100).astype("float32")

valid_mask = np.isfinite(prediction)
if valid_mask.any():
    vmin = float(np.nanmin(prediction[valid_mask]))
    vmax = float(np.nanmax(prediction[valid_mask]))
else:
    vmin, vmax = 0.0, 100.0

prediction_out = prediction.copy()
prediction_out[~valid_mask] = -9999.0

with open(PROGRESS_JSON, "w") as f:
    json.dump({
        "progress": 0.97,
        "tiles_done": tile_counter,
        "tiles_total": total_tiles,
        "status": "writing_raster"
    }, f)

with rasterio.open(OUTPUT, "w", **meta) as dst:
    dst.write(prediction, 1)

print(f"Prediction raster written: {OUTPUT}")

# -----------------------------
# Convert to COG
# -----------------------------
with open(PROGRESS_JSON, "w") as f:
    json.dump({
        "progress": 0.99,
        "tiles_done": tile_counter,
        "tiles_total": total_tiles,
        "status": "building_cog"
    }, f)

subprocess.run([
    "gdal_translate",
    OUTPUT,
    COG_OUTPUT,
    "-of", "COG",
    "-co", "COMPRESS=LZW",
    "-co", "BLOCKSIZE=512",
    "-co", "OVERVIEWS=AUTO"
], check=True)

print(f"COG written: {COG_OUTPUT}")

# -----------------------------
# Build legend only
# -----------------------------
try:
    vmin = float(np.nanmin(prediction))
    vmax = float(np.nanmax(prediction))

    norm = Normalize(vmin=vmin, vmax=vmax)
    cmap = matplotlib.colormaps["viridis"]

    fig, ax = plt.subplots(figsize=(6, 1.2))
    cb = plt.colorbar(
        plt.cm.ScalarMappable(norm=norm, cmap=cmap),
        cax=ax,
        orientation="horizontal"
    )
    cb.set_label("Predicted value")
    plt.tight_layout()
    plt.savefig(LEGEND_OUTPUT, dpi=200, bbox_inches="tight")
    plt.close()

    print(f"Legend written: {LEGEND_OUTPUT}")

except Exception as e:
    print(f"Legend generation failed: {e}")

# -----------------------------
# Final completion update
# -----------------------------
with open(PROGRESS_JSON, "w") as f:
    json.dump({
        "progress": 1.0,
        "tiles_done": tile_counter,
        "tiles_total": total_tiles,
        "status": "complete",
        "bounds": {
            "west": bounds_wgs84[0],
            "south": bounds_wgs84[1],
            "east": bounds_wgs84[2],
            "north": bounds_wgs84[3]
        },
        "stretch": {
            "vmin": vmin,
            "vmax": vmax
        },
        "cog": COG_OUTPUT
    }, f)

print("Prediction complete.")
h2o.cluster().shutdown(prompt=False)