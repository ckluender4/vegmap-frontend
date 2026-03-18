import pandas as pd
import h2o
from h2o.automl import H2OAutoML
import os
import sys
import json
import rasterio

STACK_PATH = "S:/Shared Storage/FIREss/GIS DATA REPOSITORY/NEW CARBON/STACKS/WEST_FullStack_5070_30m.tif"
training_path = "outputs/training_table.csv"
response_column = sys.argv[1]

TEST_MODE = False
TEST_PREDICTORS = ["4", "5", "6"]
MAX_ROWS = 2000
MAX_MODELS = 5
MAX_RUNTIME = 60

print("Loading training table...")
df = pd.read_csv(training_path)

print("Available columns:")
print(df.columns.tolist())

drop_cols = [c for c in df.columns if "geometry" in c.lower()]
drop_cols += [c for c in df.columns if c.lower() in ["lat", "latitude", "lon", "longitude", "x", "y"]]
df = df.drop(columns=drop_cols, errors="ignore")

if response_column not in df.columns:
    raise Exception(f"Response column '{response_column}' not found in training table.")

# ------------------------------------------------
# Determine predictors from raster stack
# ------------------------------------------------

with rasterio.open(STACK_PATH) as src:
    raster_predictors = list(src.descriptions)

# fallback if band descriptions missing
if not raster_predictors or all(b is None for b in raster_predictors):
    raster_predictors = [str(i + 1) for i in range(src.count)]

print("Raster predictors:")
print(raster_predictors)

# Keep only predictors that exist in the training table
predictors = [p for p in raster_predictors if p in df.columns]

if TEST_MODE:
    predictors = [c for c in TEST_PREDICTORS if c in predictors]

if len(predictors) == 0:
    raise Exception("No valid predictors found matching raster stack.")

if len(predictors) == 0:
    raise Exception("No predictors found.")

print("Final predictors used in model:")
print(predictors)

cols_to_keep = predictors + [response_column]
df = df[cols_to_keep].dropna()

if len(df) > MAX_ROWS:
    df = df.sample(MAX_ROWS, random_state=1)
    print(f"Sampling {MAX_ROWS} rows for fast training")
    
df = df.dropna(subset=[response_column])

print("Initializing H2O...")
h2o.init(max_mem_size="4G")

hf = h2o.H2OFrame(df)

print("Training AutoML model...")
aml = H2OAutoML(
    max_models=MAX_MODELS,
    max_runtime_secs=MAX_RUNTIME,
    seed=1,
    sort_metric="RMSE"
)

aml.train(
    x=predictors,
    y=response_column,
    training_frame=hf
)

leader = aml.leader

os.makedirs("models", exist_ok=True)
os.makedirs("outputs", exist_ok=True)

model_path = leader.download_mojo(
    path="models",
    get_genmodel_jar=True
)

# rename to fixed file name
import shutil
fixed_model = "models/current_model.zip"

shutil.move(model_path, fixed_model)

model_path = fixed_model

leaderboard = aml.leaderboard.as_data_frame()
leaderboard.to_csv("outputs/model_leaderboard.csv", index=False)

perf = leader.model_performance()

metrics = {
    "model_id": leader.model_id,
    "rmse": perf.rmse(),
    "mae": perf.mae(),
    "r2": perf.r2(),
    "predictors": predictors,
    "response_column": response_column,
    "model_path": model_path
}

try:
    varimp = leader.varimp(use_pandas=True)
    metrics["var_importance"] = varimp.head(15).to_dict(orient="records")
except Exception:
    metrics["var_importance"] = []

with open("outputs/model_metrics.json", "w") as f:
    json.dump(metrics, f, indent=2)

with open("outputs/predictor_names.json", "w") as f:
    json.dump({"predictors": predictors}, f, indent=2)

print("Model metrics written.")
print("Best model saved:", model_path)