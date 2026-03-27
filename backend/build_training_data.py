import geopandas as gpd
import pandas as pd
import rasterio
import sys
import os

aoi_path = sys.argv[1]
csv_path = sys.argv[2]
lat_col = sys.argv[3]
lon_col = sys.argv[4]

stack_path = "S:/Shared Storage/FIREss/GIS DATA REPOSITORY/NEW CARBON/STACKS/WEST_FullStack_5070_30m.tif"

print("Loading AOI...")
aoi = gpd.read_file(aoi_path)

print("Loading CSV...")
df = pd.read_csv(csv_path)

if lat_col not in df.columns:
    raise Exception(f"Latitude column '{lat_col}' not found in CSV.")

if lon_col not in df.columns:
    raise Exception(f"Longitude column '{lon_col}' not found in CSV.")

print("Coercing coordinates to numeric...")
df[lat_col] = pd.to_numeric(df[lat_col], errors="coerce")
df[lon_col] = pd.to_numeric(df[lon_col], errors="coerce")

df = df.dropna(subset=[lat_col, lon_col]).copy()

if df.empty:
    raise Exception("No valid numeric latitude/longitude values found in CSV.")

print("Validating WGS84 coordinate ranges...")
if ((df[lat_col] < -90) | (df[lat_col] > 90)).any():
    raise Exception(
        f"Latitude column '{lat_col}' contains values outside [-90, 90]. "
        "This tool currently requires WGS84 decimal degrees (EPSG:4326)."
    )

if ((df[lon_col] < -180) | (df[lon_col] > 180)).any():
    raise Exception(
        f"Longitude column '{lon_col}' contains values outside [-180, 180]. "
        "This tool currently requires WGS84 decimal degrees (EPSG:4326)."
    )

print("Creating point geometry...")
points = gpd.GeoDataFrame(
    df.copy(),
    geometry=gpd.points_from_xy(df[lon_col], df[lat_col]),
    crs="EPSG:4326"
)

print("Filtering points inside AOI...")
points = points.to_crs(aoi.crs)
points = gpd.sjoin(points, aoi, predicate="within")

if points.empty:
    raise Exception("No training points fall inside the uploaded AOI.")

print(f"{len(points)} points inside AOI")

print("Extracting raster predictors...")
with rasterio.open(stack_path) as src:
    points = points.to_crs(src.crs)

    coords = [(geom.x, geom.y) for geom in points.geometry]
    samples = list(src.sample(coords))

    band_names = list(src.descriptions)
    if not band_names or all(b is None for b in band_names):
        band_names = [str(i + 1) for i in range(src.count)]

    X = pd.DataFrame(samples, columns=band_names)

# Remove geometries and AOI join fields
points_clean = points.reset_index(drop=True).drop(
    columns=[
        "geometry",
        "index_right",
        "POLY",
        "Shape_Leng",
        "Shape_Area"
    ],
    errors="ignore"
)

training = pd.concat([points_clean, X], axis=1)

# Drop points with no extracted predictor data
predictor_cols = band_names
training = training.dropna(subset=predictor_cols, how="all").copy()

if training.empty:
    raise Exception(
        "Training points were inside the AOI, but no valid raster predictor values were extracted."
    )

os.makedirs("outputs", exist_ok=True)
training.to_csv("outputs/training_table.csv", index=False)

print(f"Training table saved to outputs/training_table.csv with {len(training)} rows")