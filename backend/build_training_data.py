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

print("Creating point geometry...")
points = gpd.GeoDataFrame(
    df,
    geometry=gpd.points_from_xy(df[lon_col], df[lat_col]),
    crs="EPSG:4326"
)

print("Filtering points inside AOI...")
points = points.to_crs(aoi.crs)
points = gpd.sjoin(points, aoi, predicate="within")

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

training = pd.concat(
    [points_clean, X],
    axis=1
)

os.makedirs("outputs", exist_ok=True)

training.to_csv("outputs/training_table.csv", index=False)

print("Training table saved to outputs/training_table.csv")