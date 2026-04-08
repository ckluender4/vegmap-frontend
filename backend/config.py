import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

# Portable executables
RSCRIPT_BIN = os.getenv("RSCRIPT_BIN", "Rscript")
GDAL_TRANSLATE_BIN = os.getenv("GDAL_TRANSLATE_BIN", "gdal_translate")

# Core data paths
STACK_PATH = os.getenv(
    "STACK_PATH",
    r"S:/Shared Storage/FIREss/GIS DATA REPOSITORY/NEW CARBON/STACKS/WEST_FullStack_5070_30m.tif"
)

MASK_PATH = os.getenv(
    "MASK_PATH",
    r"S:/Shared Storage/FIREss/GIS DATA REPOSITORY/NPS/CIRO/CIRO_TreeMask.shp"
)

RAP_2021_PATH = os.getenv(
    "RAP_2021_PATH",
    r"S:/Shared Storage/FIREss/GIS DATA REPOSITORY/RAP10m/2021/Aligned-Rasters/RAP10_IAG_21_5070_30m.tif"
)

RAP_2023_PATH = os.getenv(
    "RAP_2023_PATH",
    r"S:/Shared Storage/FIREss/GIS DATA REPOSITORY/RAP10m/2023/Aligned-Rasters/RAP10_IAG_23_FILLED_5070_30m.tif"
)

RAP_2024_PATH = os.getenv(
    "RAP_2024_PATH",
    r"S:/Shared Storage/FIREss/GIS DATA REPOSITORY/RAP10m/2024/Aligned-Rasters/RAP10_IAG_24_5070_30m.tif"
)

RAP_2025_PATH = os.getenv(
    "RAP_2025_PATH",
    r"S:/Shared Storage/FIREss/GIS DATA REPOSITORY/RAP10m/2025/Aligned-Rasters/RAP10_IAG_25_5070_30m.tif"
)

# App folders
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", BASE_DIR / "uploads"))
OUTPUT_DIR = Path(os.getenv("OUTPUT_DIR", BASE_DIR / "outputs"))
MODEL_DIR = Path(os.getenv("MODEL_DIR", BASE_DIR / "models"))

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
MODEL_DIR.mkdir(parents=True, exist_ok=True)