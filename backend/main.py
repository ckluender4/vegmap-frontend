from fastapi import FastAPI, UploadFile, File
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

@app.post("/upload-aoi")
async def upload_aoi(file: UploadFile = File(...)):

    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)

    with tempfile.TemporaryDirectory() as tmp:

        zip_path = os.path.join(tmp, file.filename)

        with open(zip_path, "wb") as f:
            f.write(await file.read())

        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall(tmp)

        shp_files = [f for f in os.listdir(tmp) if f.endswith(".shp")]
        shp_path = os.path.join(tmp, shp_files[0])

        # Save a copy for the sampling script
        saved_path = os.path.join(upload_dir, "uploaded_aoi.shp")

        gdf = gpd.read_file(shp_path)
        gdf.to_file(saved_path)

        geojson = gdf.to_crs(4326).__geo_interface__

        return geojson

import subprocess
import json

@app.post("/run-sampling")
async def run_sampling():

    subprocess.run([
        r"C:/Program Files/R/R-4.4.1/bin/Rscript.exe",
        "sampling_design.R",
        "uploads/uploaded_aoi.shp"
    ], check=True)

    with open("sampling_points.geojson") as f:
        points = json.load(f)

    return points