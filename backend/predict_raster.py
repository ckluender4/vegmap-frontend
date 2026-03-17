import h2o
import rasterio
import numpy as np
import pandas as pd
from rasterio.windows import Window
import os

STACK = "S:/Shared Storage/FIREss/GIS DATA REPOSITORY/NEW CARBON/STACKS/WEST_FullStack_5070_30m.tif"
MODEL = "models/GBM_model.zip"
OUTPUT = "outputs/prediction.tif"

print("Starting prediction...")

h2o.init(max_mem_size="4G")

model = h2o.import_mojo(MODEL)

with rasterio.open(STACK) as src:

    meta = src.meta.copy()
    meta.update(count=1, dtype="float32")

    with rasterio.open(OUTPUT, "w", **meta) as dst:

        for ji, window in src.block_windows(1):

            data = src.read(window=window)

            rows, cols = data.shape[1:]

            X = data.reshape(data.shape[0], -1).T

            df = pd.DataFrame(X)

            hf = h2o.H2OFrame(df)

            pred = model.predict(hf).as_data_frame().values.flatten()

            pred = pred.reshape(rows, cols)

            dst.write(pred.astype("float32"), 1, window=window)

print("Prediction raster written:", OUTPUT)