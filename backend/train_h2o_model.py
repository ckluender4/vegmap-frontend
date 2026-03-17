import pandas as pd
import h2o
from h2o.automl import H2OAutoML
import os
import sys
import json

training_path = "outputs/training_table.csv"
response_column = sys.argv[1]

# ------------------------------
# USER TEST SETTINGS
# ------------------------------

# Only use a few predictors for fast testing
TEST_PREDICTORS = [
    "4",
    "5",
    "6"
]

# Optional: sample fewer training rows
MAX_ROWS = 2000

MAX_MODELS = 5
MAX_RUNTIME = 60  # seconds

# ------------------------------

print("Loading training table...")
df = pd.read_csv(training_path)

print("Available predictors:")
print(df.columns.tolist())

# Remove geometry columns
drop_cols = [c for c in df.columns if "geometry" in c.lower()]
df = df.drop(columns=drop_cols, errors="ignore")

# Keep only desired predictors
available_predictors = [c for c in TEST_PREDICTORS if c in df.columns]

if len(available_predictors) == 0:
    raise Exception("None of the test predictors were found in training table.")

print("Using predictors:", available_predictors)

cols_to_keep = available_predictors + [response_column]
df = df[cols_to_keep]

# Sample rows for faster training
if len(df) > MAX_ROWS:
    df = df.sample(MAX_ROWS, random_state=1)
    print(f"Sampling {MAX_ROWS} rows for fast training")

print("Initializing H2O...")
h2o.init(max_mem_size="4G")

hf = h2o.H2OFrame(df)

predictors = available_predictors

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

model_path = leader.download_mojo(
    path="models",
    get_genmodel_jar=True
)

leaderboard = aml.leaderboard.as_data_frame()
leaderboard.to_csv("outputs/model_leaderboard.csv", index=False)

print("Best model saved:", model_path)
print("Leaderboard saved to outputs/model_leaderboard.csv")

# ------------------------------
# MODEL METRICS
# ------------------------------

perf = leader.model_performance()

metrics = {
    "model_id": leader.model_id,
    "rmse": perf.rmse(),
    "mae": perf.mae(),
    "r2": perf.r2()
}

try:
    varimp = leader.varimp(use_pandas=True)
    metrics["var_importance"] = varimp.head(10).to_dict(orient="records")
except:
    metrics["var_importance"] = []

with open("outputs/model_metrics.json", "w") as f:
    json.dump(metrics, f)

print("Model metrics written.")