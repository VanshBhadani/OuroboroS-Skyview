# Bhote Koshi 2026 Flood Multimodal Evaluation Dataset

## Overview
This evaluation dataset provides 100 georeferenced samples along the Trishuli River / Bhote Koshi basin in Rasuwa District, Nepal, to evaluate single-modality baselines against multimodal fusion under real disaster conditions.

* **Total Samples**: 100 (50 FLOOD, 50 NON_FLOOD)
* **Deterministic Split (seed=42)**:
  * **Train**: 60 samples (30 FLOOD, 30 NON_FLOOD)
  * **Validation**: 20 samples (10 FLOOD, 10 NON_FLOOD)
  * **Held-out Test**: 20 samples (10 FLOOD, 10 NON_FLOOD)

## Public Data Provenance & Modalities
1. **Satellite Modality**:
   * Pre-event: Vantor WorldView-2 scene `10300100C86CED00` (2021-10-16).
   * Post-event: Vantor WorldView-3 scene `B040001100881410` (2026-08-27).
   * License: CC BY-NC 4.0 (Vantor Open Data Program).
2. **Weather & Hydrology Modality**:
   * Rainfall data from Nepal Department of Hydrology & Meteorology (DHM) Station 652.
   * Riverbed stage and relative elevation from GeoPera high-resolution river centerline survey.
   * License: ODbL / CC BY 4.0.
3. **Ground Witness Modality**:
   * Geolocated witness videos and ground observations from GeoConfirmed & GeoGeorgeShadrach public geolocation map.
   * License: Public Open Research.

## Dataset Limitations
* **Geographic Scope**: Steep Himalayan mountain corridor; results reflect narrow V-shaped mountain valley hydrology.
* **Temporal Baseline**: The pre-event scene from Oct 2021 provides multi-year baseline context rather than an immediate pre-storm image.
* **Non-Emergency Disclaimer**: This dataset and evaluation are for academic and demonstration purposes and do not establish operational emergency performance.
