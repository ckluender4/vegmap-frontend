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
 
 
    
TRAIN_PROGRESS_JSON = "outputs/training_progress.json"

@app.post("/train-field-model")
async def train_field_model(
    csv: UploadFile = File(...),
    lat_column: str = Form(...),
    lon_column: str = Form(...),
    response_column: str = Form(...)
):
    import sys

    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    os.makedirs("outputs", exist_ok=True)

    csv_path = os.path.join(upload_dir, "training_points.csv")

    with open(csv_path, "wb") as buffer:
        shutil.copyfileobj(csv.file, buffer)

    with open("outputs/training_progress.json", "w") as f:
        json.dump({
            "progress": 0.0,
            "status": "starting"
        }, f)

    subprocess.Popen([
        sys.executable,
        "run_training_pipeline.py",
        "uploads/uploaded_aoi.shp",
        csv_path,
        lat_column,
        lon_column,
        response_column
    ])

    return {
        "status": "started"
    }
    
@app.get("/training-progress")
def training_progress():

    path = "outputs/training_progress.json"

    if not os.path.exists(path):
        return {
            "progress": 0,
            "status": "starting"
        }

    try:
        with open(path) as f:
            return json.load(f)
    except PermissionError:
        return {"progress": 0}
    
    
@app.get("/training-result")
def training_result():

    path = "outputs/training_result.json"

    if not os.path.exists(path):
        return {"status": "not_ready"}

    with open(path) as f:
        return json.load(f)
    
    
@app.post("/predict-raster")
def predict_raster():

    import subprocess
    import sys

    subprocess.Popen(
        [sys.executable, "predict_raster.py"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )

    return {
        "status": "started"
    }
    

from fastapi import HTTPException

@app.get("/download-prediction")
async def download_prediction():

    path = "outputs/prediction_cog.tif"

    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Prediction raster not found.")

    return FileResponse(
        path,
        media_type="image/tiff",
        filename="prediction_cog.tif"
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
    progress_path = "outputs/prediction_progress.json"

    if not os.path.exists(path):
        return Response(status_code=404)

    vmin, vmax = 0.0, 100.0
    nodata_value = -9999.0

    if os.path.exists(progress_path):
        try:
            with open(progress_path) as f:
                prog = json.load(f)
                stretch = prog.get("stretch", {})
                vmin = float(stretch.get("vmin", 0.0))
                vmax = float(stretch.get("vmax", 100.0))
        except Exception:
            pass

    if vmax <= vmin:
        vmax = vmin + 1.0

    try:
        with Reader(path) as src:
            img = src.tile(x, y, z)

            data = img.data[0].astype("float32")

            # force transparency outside AOI / nodata areas
            valid = np.isfinite(data) & (data != nodata_value)

            if img.mask is not None:
                valid = valid & (img.mask > 0)

            alpha_mask = np.where(valid, 255, 0).astype("uint8")

            stretched = np.zeros_like(data, dtype=np.uint8)
            stretched[valid] = np.clip(
                ((data[valid] - vmin) / (vmax - vmin)) * 254 + 1,
                1,
                255
            ).astype(np.uint8)

            rendered = render(
                stretched,
                mask=alpha_mask,
                colormap=cmap.get("viridis")
            )

        return Response(
            content=rendered,
            media_type="image/png"
        )

    except TileOutsideBounds:
        return Response(status_code=204)
    
    
@app.get("/model-covariates")
def model_covariates():

    metrics_path = "outputs/model_metrics.json"

    if not os.path.exists(metrics_path):
        return {"covariates": []}

    with open(metrics_path) as f:
        metrics = json.load(f)

    predictors = metrics.get("predictors", [])

    # Human-readable descriptions
    description_lookup = {
        "elevation": "Terrain elevation, which often influences temperature, moisture, and vegetation distribution.",
        "slope": "Terrain steepness derived from elevation data.",
        "aspect": "Compass direction a slope faces, which can influence solar exposure and drying.",
        "heat_load": "A derived terrain variable representing potential solar heating.",
        "tpi": "Topographic Position Index, which indicates whether a location is on a ridge, slope, or valley.",
        "tri": "Terrain Ruggedness Index, a measure of local terrain roughness.",
        "ppt": "Precipitation-related covariate representing moisture inputs.",
        "precip": "Precipitation-related covariate representing moisture inputs.",
        "tmean": "Average temperature covariate.",
        "tmin": "Minimum temperature covariate.",
        "tmax": "Maximum temperature covariate.",
        "ndvi": "Vegetation greenness index derived from remotely sensed imagery.",
        "evi": "Enhanced Vegetation Index derived from remotely sensed imagery.",
        "soil_texture": "Soil texture-related covariate influencing water holding capacity and vegetation.",
        "sand": "Percent sand content in the soil.",
        "silt": "Percent silt content in the soil.",
        "clay": "Percent clay content in the soil.",
        "awc": "Available water capacity of the soil.",
        "ec": "Electrical conductivity, often related to salinity or soil chemistry.",
        "ph": "Soil pH.",
        "rap": "Rangeland Analysis Platform vegetation-related covariate.",
        "nlcd": "National Land Cover Database-based covariate.",
        "evt": "LANDFIRE Existing Vegetation Type covariate."
    }

    def get_description(name: str) -> str:
        key = name.lower()

        if key in description_lookup:
            return description_lookup[key]

        # partial matching fallback
        for known_key, desc in description_lookup.items():
            if known_key in key:
                return desc

        return "Raster predictor used in the trained model."

    covariates = [
        {
            "name": p,
            "description": get_description(p)
        }
        for p in predictors
    ]

    return {"covariates": covariates}
    