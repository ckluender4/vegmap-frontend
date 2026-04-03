import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

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

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
OUTPUT_DIR = os.getenv("OUTPUT_DIR", "outputs")
MODEL_DIR = os.getenv("MODEL_DIR", "models")