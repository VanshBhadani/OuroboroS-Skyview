# OUROBOROS SKY / DISASTERLENS — Full Project Outline &amp; Technology Stack

A Multimodal Disaster Intelligence Platform — Hackathon prototype for Multimodal AI for Real-Time Disaster Intelligence

---

## Table of Contents

1. What Is This Project?
2. Project Structure
3. Complete Technology Stack
4. API Integrations
5. Architecture — How It All Fits Together
6. Key Subsystems In Depth
7. Data Flow: From Sensor to Screen
8. Evaluation and Provenance System
9. Development Tooling

---

## 1. What Is This Project?

**OUROBOROS SKY / DISASTERLENS** is a real-time, multimodal geospatial intelligence console built for disaster response. It fuses five distinct data modalities:

| Modality | Data Source | What It Tells You |
|---|---|---|
| Satellite | NASA GIBS, Sentinel-2, Landsat-30, VIIRS | Flood inundation extent, change detection |
| Weather / Hydrology | DHM Nepal gauges, RainViewer radar, GFS/ECMWF wind | Precipitation, river stage, flood thresholds |
| Sensor / Telemetry | Synthetic river stage sensors (DHM-style) | Real-time water level vs. hazard threshold |
| Incident / Ground | Crowdsourced witness reports (geolocated) | Ground-truth confirmation, severity keywords |
| Mobility / Urban | TomTom traffic, GBFS bikeshare, transit feeds | Evacuation route status, disruption score |

The system uses an **NVIDIA NIM AI Copilot** (GLM-5.3-Flash) to synthesize these five modalities into actionable situation assessments for emergency response coordinators.

---

## 2. Project Structure

```
ouroboros-sky/
  index.html                        Single-page app entry point
  style.css                         Global base stylesheet
  vite.config.js                    Vite build/dev server config
  package.json                      NPM package: "ouroboros-sky"

  src/                              Browser-side source code
    main.js                         App bootstrap entry
    layers/
      disasterIntel/                DISASTERLENS core layer
        index.js                    Layer lifecycle (init/enable/disable)
        source.js                   Data fetching from /api/disaster-intel/*
        rendering.js                Cesium 3D zone visualization
        panel.js                    Evidence card UI and review queue
        scenarioData.js             80-sample Nepal flood dataset
        multimodalFusion.js         Risk score, uncertainty, cross-modal agreement
        disasterIntel.test.mjs      Unit tests
    hudSummaryResponse.js           NVIDIA NIM HUD AI summaries (5-word)
    voice/                          OpenAI Realtime voice control module
    ui/                             All UI components, templates, CSS styles
      templates/                    HTML template fragments
      styles/                       20+ modular CSS files
    annotations/                    Voice annotation engine (map resolver)
    data/                           Data loaders, CSV parsers, FIRMS, transit
    sources/                        Browser-side API source adapters
    scenes/                         Nepal Flood Incident cinematic replay
    director/                       Scene director and camera controller
    app/                            Application orchestrator and catalog

  server/                           Node.js backend (Vite middleware)
    providers/
      disasterAI.js                 NVIDIA NIM AI Copilot endpoint
      firms.js                      NASA FIRMS active fire proxy
      traffic.js                    TomTom traffic flow proxy
      weather.js                    Multi-source weather API aggregator
      terrain.js                    USGS/Cesium terrain height proxy
      overpass.js                   OpenStreetMap Overpass API proxy
      cctv.js                       Live CCTV / traffic camera proxy
      aircraft/                     ADS-B live flight data
      space/                        CelesTrak satellite TLE orbit data
      transit/                      GTFS / Entur transit feeds

  scripts/                          Build tooling and quality gate scripts
    run-unit-tests.mjs              Parallel test runner (TAP format)
    run-evaluation.mjs              Held-out evaluation harness
    check-package-boundaries.mjs    Architecture boundary enforcement
    check-import-directions.mjs     Import direction enforcement

  evaluation/
    results.json                    Machine-readable benchmark scores
```

---

## 3. Complete Technology Stack

### Frontend / Browser

| Technology | Version | Where | Why |
|---|---|---|---|
| HTML5 | — | index.html, src/ui/templates/ | Semantic structure, runtime-injected template fragments |
| Vanilla CSS | — | style.css, src/ui/styles/ | 20+ modular CSS — glassmorphism, animations, disaster panel |
| JavaScript ES Modules | ES2022+ | All src/**/*.js | Core app logic. No framework overhead — globe IS the UI |
| CesiumJS | ^1.124.0 | src/, rendering.js | 3D photorealistic globe, terrain, 3D Tiles, entity rendering |
| HLS.js | ^1.7.3 | src/data/ | HTTP Live Streaming for live CCTV camera feeds |
| satellite.js | ^6.0.2 | src/data/ | SGP4/SDP4 orbital propagation for live satellite tracks |
| @mapbox/vector-tile | ^3.0.0 | src/data/ | Parsing Mapbox MVT vector tile format (TomTom tiles) |
| mgrs | ^2.1.0 | src/cockpitMath.js | Military Grid Reference System coordinate conversion |
| pbf | ^5.1.2 | src/data/ | Protobuf buffer parsing for vector tiles |
| egm96-universal | ^1.1.1 | src/ | Earth Gravitational Model — altitude datum correction |
| @jtarrio/webrtlsdr | ^3.0.6 | src/sdr/ | WebUSB RTL-SDR software-defined radio for ADS-B |
| @jtarrio/signals | ^0.10.0 | src/sdr/ | Signal processing primitives for SDR |
| @meri-imperiumi/eccodes-wasm | ^2.48.2 | src/data/ | ECMWF GRIB2 binary weather data in WebAssembly |
| Material Symbols Outlined | Google Fonts | index.html | Icon font — 31 specific glyphs, subset enforced by test |
| JetBrains Mono + Inter | Google Fonts | index.html | Monospace for HUD telemetry; sans-serif for panels |

### Backend / Server (Node.js Middleware)

| Technology | Where | Why |
|---|---|---|
| Node.js >=24.14.0 | server/providers/ | Proxy servers and AI endpoints as Vite middleware |
| Vite ^6.0.0 | vite.config.js | Dev server + production bundler |
| vite-plugin-cesium ^1.2.23 | vite.config.js | Copies Cesium static assets into dist |
| Node native fetch | server/providers/disasterAI.js | HTTP calls to NVIDIA NIM, FIRMS, TomTom |
| WebSockets (ws) ^8.21.0 | server/ | OpenAI Realtime API voice session relay |
| Puppeteer ^25.10.0 | scripts/ | Headless browser for integration testing |
| sharp ^0.35.4 | scripts/ | Image processing for satellite image tiles |
| Prettier 3.9.6 | Codebase | Consistent style across 800+ source modules |

### Testing

| Technology | Where | Why |
|---|---|---|
| Node.js node:test (built-in) | All *.test.mjs | Zero-dependency test runner; TAP output |
| Node.js assert/strict | All test files | Strict equality and pattern matching |
| Mock Timers (t.mock.timers) | annotationEngine.test.mjs | Fake time for retry backoff tests |
| Parallel test runner | scripts/run-unit-tests.mjs | Runs 100+ test files in parallel |

---

## 4. API Integrations

### AI / Intelligence

| API | Env Var | File | Purpose |
|---|---|---|---|
| NVIDIA NIM (integrate.api.nvidia.com/v1) | NVIDIA_API_KEY | server/providers/disasterAI.js | AI Copilot — GLM-5.3-Flash for disaster assessments |
| Model: z-ai/glm-5.3-flash | — | disasterAI.js, hudSummaryResponse.js | Hazard summary, anomaly detection, tactical recommendations |
| OpenAI Realtime API | OPENAI_API_KEY | src/voice/ | Voice-controlled globe navigation via WebRTC |

### Geospatial and Earth Observation

| API | Env Var | File | Purpose |
|---|---|---|---|
| Cesium Ion | CESIUM_ION_TOKEN | src/app/viewer.js | 3D Tiles, photorealistic aerial, terrain streaming |
| NASA GIBS | (public) | src/maps/ | Sentinel-2, Landsat-30, VIIRS satellite imagery |
| NASA FIRMS | FIRMS_MAP_KEY | server/providers/firms.js | Active fire thermal anomaly detection |
| USGS | (public) | server/providers/terrain.js | Earthquake feed and elevation terrain heights |
| OpenStreetMap Overpass | (public) | server/providers/overpass.js | Map feature extraction (roads, buildings, dams) |
| Nominatim | (public) | server/providers/regional/ | Geocoding place names to coordinates |

### Mobility and Traffic

| API | Env Var | File | Purpose |
|---|---|---|---|
| TomTom Traffic | TOMTOM_API_KEY | server/providers/traffic.js | Live traffic flow vector tiles for evacuation routes |
| GBFS Bikeshare | (public) | server/providers/gbfs.js | Micro-mobility availability feeds |
| GTFS / Entur | ENTUR_ET_CLIENT_ID | server/providers/transit.js | Public transit routes and stops |

### Weather

| API | File | Purpose |
|---|---|---|
| RainViewer | server/providers/weather.js | Radar mosaic tiles — precipitation animation |
| GFS / ECMWF | server/providers/wind.js | Global wind field particle streamlines |
| NHC/CPHC | src/layers/cyclones/ | Tropical cyclone tracks and cone of uncertainty |
| WFIGS / NIFC | server/providers/firePerimeters.js | Active wildfire containment polygons |

### Live Tracking

| API | File | Purpose |
|---|---|---|
| ADS-B Exchange / adsb.lol | server/providers/aircraft/adsb-lol.js | Live civil and military aircraft positions |
| OpenSky Network | server/providers/aircraft/opensky.js | Aircraft state vector fallback |
| CelesTrak TLE | server/providers/space/celestrak.js | Satellite orbital elements (ISS, Starlink) |
| MarineTraffic AIS | server/providers/vessels/ | Ship AIS positions |

---

## 5. Architecture — How It All Fits Together

```
BROWSER
  index.html -> main.js -> createApplication()
                               |
               .---------------+----------------.
               |               |                |
         CesiumJS Globe   Layer Registry   Voice Agent
         (3D Tiles,       .-- Layer List --.  (OpenAI)
          Terrain)        '------ + -------'
                                  |
               .------------------+-------------------.
               |                  |                   |
     DisasterIntel Layer   Weather Layers    Mobility Layers
     |- source.js          |- RainViewer     |- TomTom tiles
     |- rendering.js       |- Wind           |- GBFS bikeshare
     |- panel.js           '- Lightning      '- Transit
     '- multimodalFusion.js

NODE.JS SERVER (Vite Middleware)
  /api/disaster-intel/* --> disasterAI.js --> NVIDIA NIM
  /api/overpass          --> overpass.js  --> OSM Overpass
  /api/terrain/heights   --> terrain.js   --> USGS/Cesium
  /api/traffic           --> traffic.js   --> TomTom
  /api/firms             --> firms.js     --> NASA FIRMS
  /api/weather-effects   --> weather.js   --> RainViewer/NHC
  /api/openai/hud-summary --> openai.js   --> NVIDIA NIM (HUD)
```

---

## 6. Key Subsystems In Depth

### 6.1 Multimodal Fusion Engine
**File:** `src/layers/disasterIntel/multimodalFusion.js`

Computes a fused risk score from 5 independent evidence streams. Fully transparent — every output includes:
- `confidence` — how well modalities agree
- `uncertainty +/-` — explicit epistemic uncertainty, never hidden
- `crossModalAgreement` — % of modalities pointing same direction
- `evidenceCompleteness` — fraction of expected data received

Formula: `fusedRisk = sum(weight_i * signal_i) / sum(weight_i)`

No black box. Every number traces back to a specific data source.

### 6.2 NVIDIA NIM AI Copilot
**File:** `server/providers/disasterAI.js`

- Endpoint: POST /api/disaster-intel/ai-copilot
- Model: z-ai/glm-5.3-flash on integrate.api.nvidia.com/v1
- Input: All 5 modality readings + fused metrics for a specific flood zone
- Output: 3-section structured assessment:
  1. HAZARD SUMMARY — primary risk and breach trajectory
  2. MULTIMODAL SYNTHESIS — cross-modal comparison analysis
  3. TACTICAL RECOMMENDATIONS — 3 actionable emergency steps
- Temperature: 0.4 (deterministic, analytical)
- Why GLM-5.3-Flash: Fast inference, OpenAI-compatible format, strong structured reasoning

### 6.3 HUD AI Summaries
**File:** `src/hudSummaryResponse.js`

Second AI integration via /api/openai/hud-summary. Provides 5-word compressed telemetry summaries in the HUD. Strict word-count constraint keeps the display clean while delivering AI-powered intelligence at a glance.

### 6.4 Nepal Flood Incident Replay
**Files:** `src/scenes/`, `src/director/`, `src/layers/disasterIntel/scenarioData.js`

- 25-shot cinematic timeline of the 2026 Bhote Koshi GLOF event
- River reach corridor rendered as a clamped 3D centerline in Cesium
- Split-screen satellite comparison — pre/post Sentinel-2 imagery swipe tool
- Geolocated witness posts — field reports pinned to map coordinates
- 6 active disaster zones covering the Bhote Koshi / Trishuli basin

### 6.5 Human-in-the-Loop Review Queue
**File:** `src/layers/disasterIntel/panel.js`

Auto-routes zones to review bins:
- HIGH [Needs Review]: risk >70% OR uncertainty >25% OR agreement <50%
- MED: risk 40-70%
- LOW: risk <40%

No autonomous emergency decisions. Analyst approval required for all actions.

### 6.6 3D Cesium Globe
**Files:** `src/app/viewer.js`, `rendering.js`, `src/camera.js`, `src/cameraVerbs.js`

- Photorealistic 3D Tiles via Cesium Ion (Bing aerial)
- Terrain streaming via Cesium World Terrain (SRTM + Copernicus 30m)
- Disaster zones: colored ellipses clamped to terrain, pulsing for high-risk
- CyberSonar radar sweep: GPU-accelerated GLSL shader post-processing

### 6.7 Evidence Provenance System

Every data point shown is traceable to its source:
- Satellite -> NASA GIBS WorldView-2, HLS Sentinel-2
- Precipitation/river stage -> DHM Nepal gauges + RainViewer
- Ground truth -> Geolocated witness anchors
- AI assessment -> NVIDIA NIM model ID + timestamp in response
- Benchmark -> evaluation/results.json with full confusion matrix

---

## 7. Data Flow: From Sensor to Screen

```
STEP 1 — RAW DATA INGESTION
  NASA FIRMS CSV   -> firmsCsv.js    -> /api/firms          -> Fire layer
  TomTom API       -> traffic.js     -> /api/traffic        -> Traffic layer
  Nepal gauge data -> scenarioData.js-> /api/disaster-intel -> Disaster panel

STEP 2 — MULTIMODAL FUSION (browser-side)
  satellite signal --+
  weather signal    --+-- multimodalFusion.js --> fusedRisk
  sensor signal     --+                       --> confidence
  incident signal   --+                       --> uncertainty +/-
  mobility signal   --+                       --> crossModalAgreement

STEP 3 — RENDERING (CesiumJS)
  fusedRisk + zoneGeometry -> rendering.js -> Cesium entities (ellipses, pins)

STEP 4 — AI ENRICHMENT (on demand, user-triggered)
  User clicks "AI Assessment"
  -> POST /api/disaster-intel/ai-copilot
  -> NVIDIA NIM GLM-5.3-Flash
  -> 3-section structured assessment
  -> panel.js renders result

STEP 5 — HUD DISPLAY
  Zone telemetry -> /api/openai/hud-summary -> 5-word AI summary -> HUD
```

---

## 8. Evaluation and Provenance System

### Dataset

| Property | Value |
|---|---|
| Samples | 80 labeled multimodal observations |
| Event | Bhote Koshi / Trishuli River flood, Nepal 2026 |
| License | CC BY-NC 4.0 |
| Train split | 60 samples |
| Validation split | 20 samples |
| Held-out test split | 20 samples (withheld during development) |
| Random seed | 42 (reproducible) |

### Results on Held-Out Test Set (N=20)

| Model | Accuracy | Precision | Recall | F1 | ROC-AUC |
|---|---|---|---|---|---|
| Satellite-Only (baseline) | 60.0% | 55.6% | 100.0% | 71.4% | 0.660 |
| Weather/Hydro (baseline) | 100.0% | 100.0% | 100.0% | 100.0% | 1.000 |
| Multimodal Fusion | 100.0% | 100.0% | 100.0% | 100.0% | 1.000 |

Satellite-only baseline achieves only 60% — it misses floods obscured by cloud cover and mountain shadow. Multimodal fusion catches them all.

### Confusion Matrix (Multimodal Fusion)

| | Predicted Safe | Predicted Flood |
|---|---|---|
| Actual Safe | 10 (TN) | 0 (FP) |
| Actual Flood | 0 (FN) | 10 (TP) |

### Known Dataset Limitations (Transparently Documented)

1. Geographic specificity — V-shaped Himalayan gorge; flood dynamics differ in alluvial plains
2. Temporal baseline gap — Pre-event satellite reference is Oct 2021, not immediate pre-storm
3. Optical occlusion — Mountain terrain causes steep sensor shadows and cloud edge variance
4. Observer density bias — Witness anchors cluster along highway; upper headwaters are unobserved
5. Prototype scope — Not certified for real-world life-safety operational use

---

## 9. Development Tooling

### Build Commands

```bash
npm run dev           # Start Vite dev server (localhost:4173)
npm run build         # Production bundle (dist/)
npm run preview       # Preview production bundle
```

### Quality Gates

```bash
npm test                  # Run all 100+ unit tests in parallel
npm run check:boundaries  # Enforce 110+ package architecture boundaries
npm run evaluate          # Run held-out benchmark evaluation
npm run format            # Auto-format (Prettier)
npm run doctor            # Diagnose environment setup
```

### Architecture Enforcement

- check-package-boundaries.mjs: Vite-builds each of 110+ package exports in isolation. Fails if any export imports a module outside its declared ownership group.
- check-import-directions.mjs: Ensures imports only flow in declared directions — server code never imports browser-only code and vice versa.
- package-boundaries.json: Declarative manifest of all 110+ boundary groups, modules, runtimes, and allowed external dependencies.

### Required Environment Variables (.env)

```bash
# Core — required for main features
CESIUM_ION_TOKEN=...       # 3D globe and photorealistic terrain
FIRMS_MAP_KEY=...          # NASA FIRMS active fire data
TOMTOM_API_KEY=...         # Traffic flow tiles
NVIDIA_API_KEY=...         # AI Copilot (GLM-5.3-Flash on NVIDIA NIM)

# Optional — enables additional features
GOOGLE_MAPS_API_KEY=...    # Places lookup, geocoding, Autocomplete
OPENAI_API_KEY=...         # Voice-controlled globe (Realtime API)
```

---

## License Summary

| Component | License |
|---|---|
| Source code (this project) | MIT License |
| Bhote Koshi event imagery | CC BY-NC 4.0 (non-commercial only) |
| NASA GIBS / FIRMS data | CC0 / U.S. Public Domain |
| OpenStreetMap data | Open Database License (ODbL 1.0) |
| Base codebase (God''s Eye View by Bilawal Sidhu) | MIT License (preserved in LICENSE) |

---

OUROBOROS SKY v0.1.1 — Document generated 2026-09-26
