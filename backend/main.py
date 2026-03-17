from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from PIL import Image

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


from fastapi import UploadFile, File
import geopandas as gpd
import zipfile
import tempfile
import os
import json

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

        # Save AOI for backend scripts
        saved_path = os.path.join(upload_dir, "uploaded_aoi.shp")
        gdf.to_file(saved_path)

        # Convert to web CRS for map display
        gdf_web = gdf.to_crs(4326)

        # Convert safely to GeoJSON
        geojson = json.loads(gdf_web.to_json())

        return geojson

import subprocess
import json

from fastapi import Form

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



from fastapi.responses import FileResponse
import shutil

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
    

import subprocess
import shutil
import os
import json
from fastapi import UploadFile, File, Form

@app.post("/train-field-model")
async def train_field_model(
    csv: UploadFile = File(...),
    lat_column: str = Form(...),
    lon_column: str = Form(...),
    response_column: str = Form(...)
):

    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)

    csv_path = os.path.join(upload_dir, "training_points.csv")

    # -----------------------------
    # Save uploaded CSV
    # -----------------------------
    with open(csv_path, "wb") as buffer:
        shutil.copyfileobj(csv.file, buffer)

    print("Received CSV:", csv_path)
    print("Lat column:", lat_column)
    print("Lon column:", lon_column)
    print("Response column:", response_column)

    # -----------------------------
    # STEP 1 — Build training table
    # -----------------------------
    subprocess.run([
        "python",
        "build_training_data.py",
        "uploads/uploaded_aoi.shp",
        csv_path,
        lat_column,
        lon_column
    ], check=True)

    print("Training table built.")

    # -----------------------------
    # STEP 2 — Train AutoML model
    # -----------------------------
    subprocess.run([
        "python",
        "train_h2o_model.py",
        response_column
    ], check=True)

    print("Model training complete.")

    # -----------------------------
    # STEP 3 — Load model metrics
    # -----------------------------
    metrics_path = "outputs/model_metrics.json"

    metrics = None
    if os.path.exists(metrics_path):
        with open(metrics_path) as f:
            metrics = json.load(f)

    # -----------------------------
    # Return results to frontend
    # -----------------------------
    return {
        "status": "model_trained",
        "metrics": metrics
    }
    
    
@app.post("/predict-raster")
async def predict_raster():

    import subprocess

    subprocess.run([
        "python",
        "predict_raster.py"
    ], check=True)

    return {
        "status": "success",
        "raster": "outputs/prediction.tif"
    }
    
from fastapi.responses import FileResponse

@app.get("/download-prediction")
async def download_prediction():

    return FileResponse(
        "outputs/prediction.tif",
        media_type="image/tiff",
        filename="prediction.tif"
    )