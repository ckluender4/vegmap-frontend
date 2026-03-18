from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi import APIRouter

import numpy as np
from PIL import Image
import geopandas as gpd
import zipfile
import tempfile
import os
import json
import subprocess
import shutil

from titiler.core.factory import TilerFactory
from rio_tiler.io import Reader
from rio_tiler.colormap import cmap as default_cmaps
from rio_tiler.utils import render
from rio_tiler.errors import TileOutsideBounds
from rio_tiler.colormap import cmap
from fastapi.responses import Response


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "VegMap API is running"}


cog = TilerFactory()

router = APIRouter()
router.include_router(cog.router, prefix="/cog")

app.include_router(router)

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    
    contents = await file.read()

    image = Image.open(file.file)
    arr = np.array(image)

    h, w = arr.shape[:2]

    fake_prediction = np.random.randint(0, 5, (h, w))

    return {
        "status": "success",
        "shape": fake_prediction.shape
    }



@app.post("/upload-aoi")
async def upload_aoi(file: UploadFile = File(...)):

    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)

    with tempfile.TemporaryDirectory() as tmp:

        # Save uploaded zip
        zip_path = os.path.join(tmp, file.filename)
        with open(zip_path, "wb") as f:
            f.write(await file.read())

        # Extract shapefile contents
        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall(tmp)

        # Find the shapefile
        shp_files = [f for f in os.listdir(tmp) if f.lower().endswith(".shp")]
        if len(shp_files) == 0:
            return {"error": "No .shp file found in uploaded zip"}

        shp_path = os.path.join(tmp, shp_files[0])

        # Load AOI
        gdf = gpd.read_file(shp_path)

        # Remove empty geometry
        gdf = gdf[gdf.geometry.notnull()]

        # Fix topology issues (self intersections, open rings, etc.)
        gdf["geometry"] = gdf.geometry.buffer(0)

        # Drop still-invalid geometry
        gdf = gdf[gdf.is_valid]

        if len(gdf) == 0:
            return {"error": "Uploaded AOI contains no valid geometry"}

        # Ensure CRS exists
        if gdf.crs is None:
            gdf = gdf.set_crs(4326)

        # Dissolve to a single AOI polygon
        gdf = gdf.dissolve()
        gdf = gdf[gdf.geometry.notnull() & gdf.is_valid]

        if gdf.empty:
            return {"error": "AOI invalid after dissolve"}

        # Save AOI for backend scripts
        saved_path = os.path.join(upload_dir, "uploaded_aoi.shp")
        gdf.to_file(saved_path)

        # Convert to web CRS for map display
        gdf_web = gdf.to_crs(4326)
        gdf_web = gdf_web[gdf_web.is_valid & gdf_web.geometry.notnull()]

        # Convert safely to GeoJSON
        geojson = json.loads(gdf_web.to_json(na="null"))

        return geojson


@app.post("/run-sampling")
async def run_sampling(
    max_samples: int = Form(...),
    min_spacing: int = Form(...)
):

    subprocess.run([
        r"C:/Program Files/R/R-4.4.1/bin/Rscript.exe",
        "sampling_design.R",
        "uploads/uploaded_aoi.shp",
        str(max_samples),
        str(min_spacing)
    ], check=True)

    with open("sampling_output.json") as f:
        output = json.load(f)

    return output


@app.get("/download-sampling")
async def download_sampling():

    zip_path = "sampling_points.zip"

    shutil.make_archive(
        "sampling_points",
        "zip",
        "sampling_export"
    )

    return FileResponse(
        zip_path,
        media_type="application/zip",
        filename="sampling_points.zip"
    )
    


@app.post("/train-field-model")
async def train_field_model(
    csv: UploadFile = File(...),
    lat_column: str = Form(...),
    lon_column: str = Form(...),
    response_column: str = Form(...)
):
    import pandas as pd
    import geopandas as gpd
    from shapely.geometry import Point

    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    os.makedirs("outputs", exist_ok=True)

    csv_path = os.path.join(upload_dir, "training_points.csv")

    with open(csv_path, "wb") as buffer:
        shutil.copyfileobj(csv.file, buffer)

    print("Received CSV:", csv_path)
    print("Lat column:", lat_column)
    print("Lon column:", lon_column)
    print("Response column:", response_column)

    # Build training table
    subprocess.run([
        "python",
        "build_training_data.py",
        "uploads/uploaded_aoi.shp",
        csv_path,
        lat_column,
        lon_column
    ], check=True)

    print("Training table built.")

    # Train model
    subprocess.run([
        "python",
        "train_h2o_model.py",
        response_column
    ], check=True)

    print("Model training complete.")

    # Load model metrics
    metrics_path = "outputs/model_metrics.json"
    metrics = None
    if os.path.exists(metrics_path):
        with open(metrics_path) as f:
            metrics = json.load(f)

    # Load original CSV and convert points for map display
    df = pd.read_csv(csv_path)

    if lat_column not in df.columns or lon_column not in df.columns:
        return {
            "status": "error",
            "message": f"CSV missing lat/lon columns: {lat_column}, {lon_column}"
        }

    gdf = gpd.GeoDataFrame(
        df.copy(),
        geometry=gpd.points_from_xy(df[lon_column], df[lat_column]),
        crs="EPSG:4326"
    )

    training_points_geojson = json.loads(gdf.to_json())

    return {
        "status": "model_trained",
        "metrics": metrics,
        "training_points": training_points_geojson
    }
    
    
@app.post("/predict-raster")
async def predict_raster():

    import subprocess
    import sys

    result = subprocess.run(
        [sys.executable, "predict_raster.py"],
        capture_output=True,
        text=True
    )

    print(result.stdout)
    print(result.stderr)

    if result.returncode != 0:
        return {"status": "error", "stderr": result.stderr}

    return {
    "status": "success",
    "raster": "outputs/prediction_cog.tif"
    }
    

@app.get("/download-prediction")
async def download_prediction():

    return FileResponse(
        "outputs/prediction.tif",
        media_type="image/tiff",
        filename="prediction.tif"
    )
    
@app.get("/prediction-progress")
def prediction_progress():

    path = "outputs/prediction_progress.json"

    if not os.path.exists(path):
        return {
            "progress": 0,
            "status": "starting"
        }

    try:
        with open(path) as f:
            return json.load(f)

    except PermissionError:
        # file is temporarily locked while being written
        return {"progress": 0}
    

@app.get("/prediction-raster")
def prediction_raster():
    return FileResponse(
        "outputs/prediction.tif",
        media_type="image/tiff",
        filename="prediction.tif"
    )
    
    
    
@app.get("/prediction-legend")
def prediction_legend():
    return FileResponse(
        "outputs/prediction_legend.png",
        media_type="image/png"
    )
    

@app.get("/prediction-cog")
def prediction_cog():
    return FileResponse(
        "outputs/prediction_cog.tif",
        media_type="image/tiff",
        filename="prediction_cog.tif"
    )

@app.get("/prediction-tile/{z}/{x}/{y}.png")
def prediction_tile(z: int, x: int, y: int):

    path = "outputs/prediction_cog.tif"

    if not os.path.exists(path):
        return Response(status_code=404)

    try:
        with Reader(path) as src:

            img = src.tile(x, y, z)

            data = img.data[0]
            mask = img.mask

            rendered = render(
                data,
                mask=mask,
                colormap=cmap.get("viridis")
            )

        return Response(
            content=rendered,
            media_type="image/png"
        )

    except TileOutsideBounds:
        # Mapbox requested tile outside raster bounds
        return Response(status_code=204)
    