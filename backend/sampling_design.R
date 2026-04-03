rm(list = ls())

# -----------------------------
# USER SETTINGS
# -----------------------------
args <- commandArgs(trailingOnly = TRUE)

if (length(args) < 4) {
  stop("AOI path, max_samples, min_spacing, and predictor stack path required")
}

aoi_path <- args[1]
max_samples <- as.numeric(args[2])
min_spacing <- as.numeric(args[3])
pred_stack_path <- args[4]

mask_polys_path <- if (length(args) >= 5 && nzchar(args[5])) args[5] else NA_character_


grid_size <- 60 # cant do 30 bc then no SD
#min_spacing <- 30   # meters
max_eval <- 1000

set.seed(42)

# -----------------------------
# LIBRARIES
# -----------------------------
library(terra)
library(sf)
library(dplyr)
library(RANN)
library(jsonlite)

terraOptions(
  memfrac = 0.8,
  #tempdir = "D:/terra_tmp",
  threads = max(1, parallel::detectCores() - 2),
  progress = 1
)

# -----------------------------
# INPUTS
# -----------------------------
aoi <- st_read(aoi_path, quiet = TRUE)
pred <- rast(pred_stack_path)

use_mask <- !is.na(mask_polys_path) && file.exists(mask_polys_path)

if (use_mask) {
  mask_polys <- st_read(mask_polys_path, quiet = TRUE)
} else {
  mask_polys <- NULL
}

keep_layers <- c(
  "Elevation",
  "Clay",
  "RAP_AH_2023",
  "NDVI_max_2023"
)

pred <- pred[[keep_layers]]

cat("Raster CRS:\n")
print(crs(pred))

cat("AOI CRS before transform:\n")
print(st_crs(aoi))

if (use_mask) {
  cat("Mask CRS before transform:\n")
  print(st_crs(mask_polys))
}

# Reproject AOI to raster CRS
if (st_crs(aoi)$wkt != crs(pred)) {
  message("Reprojecting AOI to raster CRS...")
  aoi <- st_transform(aoi, crs(pred))
}

# Reproject mask polygons to raster CRS
if (use_mask && st_crs(mask_polys)$wkt != crs(pred)) {
  message("Reprojecting mask polygons to raster CRS...")
  mask_polys <- st_transform(mask_polys, crs(pred))
}
cat("AOI CRS after transform:\n")
print(st_crs(aoi))

if (use_mask) {
  cat("Mask CRS after transform:\n")
  print(st_crs(mask_polys))

  mask_polys <- st_simplify(mask_polys, dTolerance = 30)
}


# -----------------------------
# CLEAN GEOMETRIES
# -----------------------------
aoi <- st_make_valid(aoi)
aoi <- st_union(aoi) |> st_as_sf()

if (use_mask) {
  mask_polys <- st_make_valid(mask_polys)
  mask_polys <- st_union(mask_polys) |> st_as_sf()
}

# -----------------------------
# BUFFER AOI INWARD (50 m)
# ensures points never fall near edges
# -----------------------------
aoi_inner <- st_buffer(aoi, -50)

if (st_is_empty(aoi_inner)) {
  stop("AOI buffer removed entire polygon — AOI may be too small.")
}

# -----------------------------
# CROP + MASK RASTER
# KEEP AOI GEOMETRY INTACT
# -----------------------------
aoi_vect <- vect(aoi_inner)

if (use_mask) {
  mask_vect <- vect(mask_polys)
}

cat("Raster extent:\n")
print(ext(pred))

cat("AOI extent:\n")
print(ext(aoi_vect))

if (!relate(ext(pred), ext(aoi_vect), "intersects")) {
  stop("AOI and predictor raster do not overlap after CRS transformation.")
}

# Crop to AOI extent first
pred <- crop(pred, aoi_vect)

# Mask outside AOI
pred <- mask(pred, aoi_vect)

# Remove unwanted landcover directly from raster if a mask was provided
if (use_mask) {
  pred <- mask(pred, mask_vect, inverse = TRUE)
}

# -----------------------------
# REMOVE SMALL RASTER ISLANDS
# -----------------------------
valid <- !is.na(pred[[1]])

cl <- patches(valid, directions = 8)

freq_table <- as.data.frame(freq(cl))

# keep only patches larger than threshold
min_cells <- 50   # ~ 0.018 ha at 30 m
keep_ids <- freq_table$value[freq_table$count >= min_cells]

valid_clean <- cl %in% keep_ids

pred <- mask(pred, valid_clean, maskvalues = 0)

# Optional quick check
plot(pred[[1]])

# -----------------------------
# BUILD CANDIDATE GRID
# FAST VERSION: NO st_intersection(aoi)
# -----------------------------
grid <- st_make_grid(st_bbox(aoi_inner), cellsize = grid_size)
grid <- st_sf(grid_id = seq_along(grid), geometry = grid)

cat("Initial grid cells:", nrow(grid), "\n")

# Keep only cells with sufficient valid raster coverage
# Rasterize grid IDs
grid_vect <- vect(grid)

grid_rast <- rasterize(grid_vect, pred[[1]], field="grid_id")

# Raster of valid pixels
valid_rast <- !is.na(pred[[1]])

# Fast zonal statistic
coverage <- zonal(valid_rast, grid_rast, fun="mean", na.rm=TRUE)

names(coverage)[2] <- "valid_frac"

grid$valid_frac <- coverage$valid_frac[match(grid$grid_id, coverage$grid_id)]

grid <- grid |> 
  filter(!is.na(valid_frac) & valid_frac >= 0.40)

cat("Candidate cells after raster coverage filter:", nrow(grid), "\n")

if (nrow(grid) == 0) {
  stop("No candidate grid cells remain after masking/filtering.")
}

# -----------------------------
# SUMMARIZE PREDICTORS
# -----------------------------
X_mean <- terra::zonal(pred, grid_rast, fun = "mean", na.rm = TRUE)
X_sd   <- terra::zonal(pred, grid_rast, fun = "sd",   na.rm = TRUE)

id <- X_mean[, 1]
X_mean <- X_mean[, -1, drop = FALSE]
X_sd   <- X_sd[, -1, drop = FALSE]

colnames(X_sd) <- paste0(colnames(X_sd), "_sd")

X <- data.frame(grid_id = id, X_mean, X_sd)

grid_df <- st_drop_geometry(grid)[, c("grid_id"), drop = FALSE]
X <- inner_join(grid_df, X, by = "grid_id")

grid_ok <- grid |> semi_join(X, by = "grid_id")

if (nrow(grid_ok) == 0) {
  stop("No grid cells remain after zonal summaries.")
}

# -----------------------------
# EXTRACT CANDIDATE CELL CENTROIDS
# -----------------------------
grid_centroids <- st_point_on_surface(grid_ok)
coords <- st_coordinates(grid_centroids)
coords_df <- data.frame(coords)

X_ok <- X |> select(-grid_id)

# -----------------------------
# CLEAN DATA
# -----------------------------
X_df <- as.data.frame(X_ok)

X_df$Xcoord <- coords_df$X
X_df$Ycoord <- coords_df$Y

X_df[!is.finite(as.matrix(X_df))] <- NA
X_df <- X_df[complete.cases(X_df), ]

zero_var <- sapply(X_df, function(x) var(x, na.rm = TRUE) == 0)
X_df <- X_df[, !zero_var, drop = FALSE]

coords <- as.matrix(X_df[, c("Xcoord", "Ycoord")])
X_env <- X_df |> select(-Xcoord, -Ycoord)

if (nrow(X_env) == 0) {
  stop("No valid environmental records remain after cleaning.")
}

# -----------------------------
# SCALE
# -----------------------------
X_scaled <- scale(X_env)
X_scaled[is.na(X_scaled)] <- 0

# -----------------------------
# PCA (retain 95% variance)
# -----------------------------
pca_full <- prcomp(X_scaled)

cumvar <- cumsum(summary(pca_full)$importance[2, ])
k_pcs <- which(cumvar >= 0.95)[1]

cat("PCs retained:", k_pcs, "\n")

pca <- prcomp(X_scaled, rank. = k_pcs)
PC <- pca$x[, 1:k_pcs, drop = FALSE]

cat("Candidate environments:", nrow(PC), "\n")

# -----------------------------
# DISTANCE FUNCTION
# -----------------------------
euclid_dist_to_point <- function(mat, j) {
  dif <- sweep(mat, 2, mat[j, ], "-")
  sqrt(rowSums(dif * dif))
}

# -----------------------------
# GREEDY MAXIMIN
# -----------------------------
greedy_maximin_spatial <- function(
    PC_mat,
    coords,
    max_n,
    r,
    min_spacing = 200,
    w_env = 0.8,
    w_space = 0.2
) {
  
  N <- nrow(PC_mat)
  max_n <- min(max_n, N)
  
  selected <- integer(max_n)
  mean_dmin <- rep(NA_real_, max_n)
  p_covered <- rep(NA_real_, max_n)
  
  # initialize first point (environmental extreme)
  center <- colMeans(PC_mat)
  d0 <- rowSums((PC_mat - matrix(center, N, ncol(PC_mat), byrow = TRUE))^2)
  selected[1] <- which.max(d0)
  
  env_dmin <- euclid_dist_to_point(PC_mat, selected[1])
  space_dmin <- euclid_dist_to_point(coords, selected[1])
  
  env_dmin[selected[1]] <- 0
  space_dmin[selected[1]] <- 0
  
  mean_dmin[1] <- mean(env_dmin)
  p_covered[1] <- mean(env_dmin <= r)
  
  for (i in 2:max_n) {
    
    env_metric <- env_dmin / max(env_dmin)
    space_metric <- space_dmin / max(space_dmin)
    
    combined <- w_env * env_metric + w_space * space_metric
    
    combined[selected[1:(i - 1)]] <- -Inf
    
    too_close <- space_dmin < min_spacing
    combined[too_close] <- -Inf
    
    new_idx <- which.max(combined)
    
    if (is.infinite(combined[new_idx])) break
    
    selected[i] <- new_idx
    
    env_new <- euclid_dist_to_point(PC_mat, new_idx)
    env_dmin <- pmin(env_dmin, env_new)
    
    space_new <- euclid_dist_to_point(coords, new_idx)
    space_dmin <- pmin(space_dmin, space_new)
    
    env_dmin[selected[1:i]] <- 0
    space_dmin[selected[1:i]] <- 0
    
    mean_dmin[i] <- mean(env_dmin)
    p_covered[i] <- mean(env_dmin <= r)
  }
  
  last_i <- max(which(selected > 0))
  
  list(
    selected = selected[1:last_i],
    mean_dmin = mean_dmin[1:last_i],
    p_covered = p_covered[1:last_i]
  )
}

# -----------------------------
# COVERAGE RADIUS SENSITIVITY
# -----------------------------
idx <- sample(seq_len(nrow(PC)), min(3000, nrow(PC)))
D <- dist(PC[idx, , drop = FALSE])

r_vals <- c(
  quantile(D, 0.05),
  quantile(D, 0.10),
  quantile(D, 0.20)
)

names(r_vals) <- c("strict", "moderate", "lenient")

print(r_vals)

# -----------------------------
# RUN COVERAGE CURVES
# -----------------------------
results_list <- vector("list", length(r_vals))

for (i in seq_along(r_vals)) {
  
  r <- r_vals[i]
  
  res_curve <- greedy_maximin_spatial(
    PC,
    coords,
    max_eval,
    r,
    min_spacing = min_spacing,
    w_env = 0.8,
    w_space = 0.2
  )
  
  cov_results_i <- tibble(
    n = seq_along(res_curve$p_covered),
    mean_dmin = res_curve$mean_dmin,
    p_covered = res_curve$p_covered,
    radius = names(r_vals)[i]
  )
  
  results_list[[i]] <- cov_results_i
}

cov_results <- bind_rows(results_list)

# -----------------------------
# SAMPLE SIZE ESTIMATES
# -----------------------------
cov_summary <- cov_results %>%
  group_by(radius) %>%
  summarise(
    n90 = if (any(p_covered >= 0.90, na.rm = TRUE)) min(n[p_covered >= 0.90], na.rm = TRUE) else NA_integer_,
    n95 = if (any(p_covered >= 0.95, na.rm = TRUE)) min(n[p_covered >= 0.95], na.rm = TRUE) else NA_integer_,
    .groups = "drop"
  )



# -----------------------------
# SELECT FINAL SAMPLE
# -----------------------------
r <- r_vals["strict"]

res_curve <- greedy_maximin_spatial(
  PC,
  coords,
  max_eval,
  r,
  min_spacing = min_spacing,
  w_env = 0.8,
  w_space = 0.2
)

cov_results_final <- tibble(
  n = seq_along(res_curve$p_covered),
  p_covered = res_curve$p_covered
)

if (!any(cov_results_final$p_covered >= 0.95, na.rm = TRUE)) {
  warning("95% coverage was not achieved; using maximum available sample size.")
  recommended_n <- length(res_curve$selected)
} else {
  recommended_n <- min(cov_results_final$n[cov_results_final$p_covered >= 0.95], na.rm = TRUE)
}

n_final <- min(recommended_n, max_samples)

cat("Recommended sampling size:", recommended_n, "\n")
cat("Selected sampling size after user cap:", n_final, "\n")

sel_idx <- res_curve$selected[1:n_final]
cand_cells <- grid_ok[sel_idx, ]

# random point within each selected grid cell
cand_pts <- st_centroid(cand_cells)

# ensure sf structure is preserved
cand_pts <- st_as_sf(cand_pts)

cand_pts <- st_transform(cand_pts, 4326)

st_write(
  cand_pts,
  "sampling_points.geojson",
  delete_dsn = TRUE
)

points_geojson <- jsonlite::fromJSON("sampling_points.geojson", simplifyVector = FALSE)

coverage_curve <- cov_results_final %>%
  select(n, p_covered)

output <- list(
  points = points_geojson,
  summary = list(
    recommended_n = recommended_n,
    selected_n = n_final,
    max_samples = max_samples,
    min_spacing_m = min_spacing
  ),
  coverage_curve = coverage_curve
)

write_json(output, "sampling_output.json", auto_unbox = TRUE, pretty = TRUE)

# -----------------------------
# EXPORT SHAPEFILE
# -----------------------------

dir.create("sampling_export", showWarnings = FALSE)

st_write(
  cand_pts,
  "sampling_export/sampling_points.shp",
  delete_layer = TRUE,
  quiet = TRUE
)
