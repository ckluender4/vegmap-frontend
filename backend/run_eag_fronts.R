rm(list = ls())

library(terra)
library(sf)

terraOptions(
  memfrac = 0.8,
  progress = 1,
  tempdir = "D:/terra_tmp"
)

# -----------------------------
# COMMAND LINE ARGUMENTS
# -----------------------------
args <- commandArgs(trailingOnly = TRUE)

if (length(args) < 2) {
  stop("Usage: Rscript run_eag_fronts.R <aoi_path> <out_raster_path>")
}

aoi_path <- args[1]
out_raster_path <- args[2]

# -----------------------------
# FIXED INPUT RASTERS
# -----------------------------
raster_files <- c(
  "S:/Shared Storage/FIREss/GIS DATA REPOSITORY/RAP10m/2021/Aligned-Rasters/RAP10_IAG_21_5070_30m.tif",
  "S:/Shared Storage/FIREss/GIS DATA REPOSITORY/RAP10m/2023/Aligned-Rasters/RAP10_IAG_23_FILLED_5070_30m.tif",
  "S:/Shared Storage/FIREss/GIS DATA REPOSITORY/RAP10m/2024/Aligned-Rasters/RAP10_IAG_24_5070_30m.tif",
  "S:/Shared Storage/FIREss/GIS DATA REPOSITORY/RAP10m/2025/Aligned-Rasters/RAP10_IAG_25_5070_30m.tif"
)

years <- c(2021, 2023, 2024, 2025)

# -----------------------------
# THRESHOLD TUNING KNOBS
# -----------------------------
q_high_cover    <- 0.97
q_change_tol    <- 0.85
q_strong_change <- 0.97
q_steady_tol    <- 0.60

# -----------------------------
# KERNEL SETTINGS
# -----------------------------
kernel_size <- 41   # ~1.2 km at 30 m
lambda <- 10        # exponential decay distance in cells

# -----------------------------
# VALIDATION
# -----------------------------
if (!file.exists(aoi_path)) {
  stop(paste("AOI not found:", aoi_path))
}

missing_rasters <- raster_files[!file.exists(raster_files)]
if (length(missing_rasters) > 0) {
  stop(
    paste(
      "Missing raster inputs:",
      paste(missing_rasters, collapse = "; ")
    )
  )
}

# ensure output directory exists
out_dir <- dirname(out_raster_path)
if (!dir.exists(out_dir)) {
  dir.create(out_dir, recursive = TRUE)
}

# -----------------------------
# READ AOI
# -----------------------------
aoi <- vect(aoi_path)

# -----------------------------
# TEMPLATE RASTER
# -----------------------------
r_ref <- rast(raster_files[1])

if (!same.crs(aoi, r_ref)) {
  aoi <- project(aoi, crs(r_ref))
}

r_ref_crop <- crop(r_ref, aoi)

# -----------------------------
# ALIGN + LOAD RASTERS
# -----------------------------
aligned <- vector("list", length(raster_files))

for (i in seq_along(raster_files)) {
  r <- rast(raster_files[i])

  if (!same.crs(r, r_ref)) {
    r <- project(r, r_ref, method = "near")
  }

  r <- crop(r, aoi)
  r <- resample(r, r_ref_crop, method = "near")

  aligned[[i]] <- r
}

r_stack <- rast(aligned)
names(r_stack) <- paste0("yr_", years)

# -----------------------------
# VERIFY ALIGNMENT
# -----------------------------
for (i in 2:nlyr(r_stack)) {
  ok <- compareGeom(r_stack[[1]], r_stack[[i]], stopOnError = FALSE)
  cat(names(r_stack)[i], " aligned: ", ok, "\n", sep = "")
  if (!ok) stop("Raster alignment check failed.")
}

# -----------------------------
# DATA-DRIVEN THRESHOLDS
# -----------------------------
v1 <- values(r_stack[[1]], mat = FALSE)
v1 <- v1[!is.na(v1)]

d12 <- values(r_stack[[2]] - r_stack[[1]], mat = FALSE)
d23 <- values(r_stack[[3]] - r_stack[[2]], mat = FALSE)
d34 <- values(r_stack[[4]] - r_stack[[3]], mat = FALSE)

all_deltas <- c(d12, d23, d34)
all_deltas <- all_deltas[!is.na(all_deltas)]
abs_deltas <- abs(all_deltas)

high_cover    <- quantile(v1, q_high_cover, na.rm = TRUE)
change_tol    <- quantile(abs_deltas, q_change_tol, na.rm = TRUE)
strong_change <- quantile(abs_deltas, q_strong_change, na.rm = TRUE)
steady_tol    <- quantile(abs_deltas, q_steady_tol, na.rm = TRUE)

cat("\nDerived thresholds:\n")
cat("high_cover    = ", round(high_cover, 2), " (q=", q_high_cover, ")\n", sep = "")
cat("steady_tol    = ", round(steady_tol, 2), " (q=", q_steady_tol, ")\n", sep = "")
cat("change_tol    = ", round(change_tol, 2), " (q=", q_change_tol, ")\n", sep = "")
cat("strong_change = ", round(strong_change, 2), " (q=", q_strong_change, ")\n", sep = "")

# -----------------------------
# CORE CHANGE SURFACES
# -----------------------------
start <- r_stack[[1]]
end   <- r_stack[[nlyr(r_stack)]]
net   <- end - start

xr         <- max(r_stack) - min(r_stack)
mean_cover <- mean(r_stack)

# stable masks kept here in case later logic needs them
stable_low  <- (xr <= steady_tol) & (mean_cover < high_cover)
stable_high <- (xr <= steady_tol) & (mean_cover >= high_cover)

# -----------------------------
# DOMINANT ANNUAL GRASS MASK
# -----------------------------
dominant <- end >= high_cover
names(dominant) <- "dominant"

# -----------------------------
# DISTANCE-WEIGHTED KERNEL
# -----------------------------
coords <- expand.grid(
  x = seq(-(kernel_size - 1) / 2, (kernel_size - 1) / 2),
  y = seq(-(kernel_size - 1) / 2, (kernel_size - 1) / 2)
)

dist <- sqrt(coords$x^2 + coords$y^2)
weights <- exp(-dist / lambda)

kernel <- matrix(weights, kernel_size, kernel_size)
kernel <- kernel / sum(kernel)

# -----------------------------
# KERNEL-SMOOTHED PRESSURE
# -----------------------------
pressure_kernel <- focal(
  dominant,
  w = kernel,
  fun = "sum",
  na.policy = "omit"
)

names(pressure_kernel) <- "kernel_pressure"

# -----------------------------
# FINAL EAG FRONT CLASSIFICATION
# -----------------------------
expansion_kernel <- ifel(
  pressure_kernel >= 0.6, 1,
  ifel(
    (net >= change_tol) & (pressure_kernel >= 0.3), 2,
    ifel(
      pressure_kernel >= 0.15, 3,
      4
    )
  )
)

names(expansion_kernel) <- "eag_kernel_fronts"
expansion_kernel <- mask(expansion_kernel, aoi)

levels(expansion_kernel) <- data.frame(
  value = 1:4,
  class = c(
    "Core Cheatgrass",
    "Active Expansion Front",
    "Expansion Pressure Zone",
    "Low Invasion Risk"
  )
)

# -----------------------------
# WRITE FINAL OUTPUT
# -----------------------------
writeRaster(
  expansion_kernel,
  out_raster_path,
  overwrite = TRUE,
  wopt = list(
    datatype = "INT1U",
    gdal = c("COMPRESS=LZW", "NUM_THREADS=ALL_CPUS")
  )
)

cat("\nDone.\n")
cat("Output written to: ", out_raster_path, "\n", sep = "")