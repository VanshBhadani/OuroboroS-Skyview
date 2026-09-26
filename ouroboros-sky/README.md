# OUROBOROS SKY / DISASTERLENS

### Multimodal Disaster Intelligence
**A Human-in-the-Loop Decision-Support Prototype for Real-Time Disaster Response**

---

> ⚠️ **PROTOTYPE & DECISION-SUPPORT DISCLAIMER**  
> DisasterLens is a hackathon prototype developed for the **Microsoft Hackathon: Multimodal AI for Real-Time Disaster Intelligence**. It is designed strictly as a **human-in-the-loop decision-support tool**.  
> The system does **not** provide autonomous emergency decision-making or validated life-safety predictions. All analytical metrics, fused risk scores, and uncertainty estimates must be verified by qualified emergency management personnel before operational action is taken.

---

## 🌍 Overview

During natural disasters—such as flash floods, glacial lake outburst floods (GLOFs), and wildfires—first responders and decision-makers face fragmented, multi-source data: satellite passes, ground rain gauges, river telemetry, social witness reports, and road network disruptions.

**DisasterLens** fuses these disparate signals into a unified 3D geospatial intelligence platform. Built on high-performance Cesium photorealistic globe architecture, it correlates environmental risk with urban mobility infrastructure to deliver actionable, transparent situational intelligence.

---

## 🛡️ Core Capabilities

### 1. Multimodal Disaster Intelligence Layer
* **Resilient Data Ingestion**: REST endpoints (`/api/disaster-intel/*`) with seamless fallback to deterministic offline scenario feeds.
* **Multimodal Fusion**: Correlates satellite optical/SAR flood observations, precipitation gauges, river water level sensors, and crowdsourced witness reports.
* **Transparent Uncertainty Modeling**: Computes confidence and explicit uncertainty intervals (`±%`) for every zone rather than presenting black-box risk numbers.
* **Human-in-the-Loop Review Queue**: Triage system with priority bins (`HIGH [Needs Review]`, `MED`, `LOW`). Automatically escalates high-risk or high-uncertainty zones for human analyst validation.
* **Evidence Cards**: Inspect granular zone telemetry, modal evidence weights, and fly directly to disaster areas with one click.

### 2. Nepal Flood Incident Replay
* **Bhote Koshi River Reach**: 25-shot cinematic timeline reproducing the 2026 glacial lake outburst / flash flood event.
* **Centerline Path**: Clamped 3D river reach corridor with synchronized temporal progression.
* **Before / After Satellite Comparison**: Split-screen swipe tool comparing pre-disaster and post-disaster Sentinel-2 imagery.
* **Geolocated Witness Posts**: Field reports correlated directly with flood path coordinates.

### 3. Preserved Urban Mobility Infrastructure
Urban mobility data is preserved as foundational response infrastructure:
* **Traffic Flow**: Live/simulated road network congestion and disruption indicators.
* **Transit**: Fixed transit lines, routes, and station locations for evacuation assessment.
* **Bikeshare**: Micro-mobility availability in metropolitan regions.
* **Directions & Routing**: Multi-modal street routing foundation.

### 4. Weather & Environmental Hazards
* **Weather Radar**: RainViewer real-time precipitation radar replay.
* **Cloud Cover**: Satellite infrared cloud visualization.
* **Lightning**: Real-time atmospheric convective strike tracking.
* **Global Wind**: Animated GFS/ECMWF particle streamlines with altitude pressure levels.
* **Cyclones**: NHC/CPHC tropical cyclone trajectories, forecast cones, and wind speeds.
* **Active Fires**: NASA FIRMS thermal anomaly detection.
* **Fire Perimeters**: WFIGS interagency active wildfire boundaries.
* **Earthquakes**: USGS seismic event monitoring with magnitude and depth scaling.

### 5. Critical Infrastructure
* **USACE Dams**: Geo-located dam assets for flood cascade risk analysis.
* **Data Centers**: Critical telecommunication and computational infrastructure nodes.

---

## 🗂️ System Architecture & UI Organization

The DisasterLens interface is streamlined for rapid disaster analysis:

```
DATA LAYERS
├── DISASTER
│   ├── Disaster Intelligence (Multimodal Fusion & Review Queue)
│   ├── Earthquakes (USGS)
│   ├── Active Fires (NASA FIRMS)
│   └── Fire Perimeters / Hazards (WFIGS)
├── WEATHER
│   ├── Global Wind (GFS / ECMWF)
│   ├── Weather Radar (RainViewer)
│   ├── Weather Satellite (Clouds)
│   ├── Weather Lightning Strikes
│   └── Weather Cyclones
├── SATELLITE IMAGERY
│   └── Recent Satellite Imagery (Sentinel-2, Landsat-30, VIIRS)
├── CRITICAL INFRASTRUCTURE
│   ├── Critical Dams (USACE)
│   └── Data Centers
└── MOBILITY
    ├── Traffic Flow
    ├── Public Transit
    ├── Bikeshare
    └── Emergency Directions

SCENES
├── Nepal Flood Incident
└── Disaster Timeline Replay

TOOLS
├── Review Queue (Human Prioritization)
└── Evidence Viewer (Multimodal Telemetry Cards)
```

---

## 📜 Provenance & Attributions

DisasterLens explicitly separates original open-source software, hackathon-developed functionality, and third-party datasets:

### 1. Reused Open-Source Software
* **God's Eye View**: The 3D globe visualization engine, Cesium integration, scene director, camera controller, and shader post-processing pipeline are based on [God's Eye View](https://github.com/bilawalsidhu/gods-eye-view) by Bilawal Sidhu, licensed under the **MIT License**. The original license is preserved in full in [LICENSE](LICENSE).

### 2. DisasterLens Functionality (Developed for Microsoft Hackathon)
* Multimodal Disaster Intelligence fusion service (`server/providers/disasterAI.js`, `src/layers/disasterIntel/`).
* **NVIDIA NIM AI Multimodal Copilot**: Powered by `z-ai/glm-5.3-flash` on `integrate.api.nvidia.com`, providing real-time hazard assessments, cross-modal anomaly detection, and tactical emergency response recommendations.
* **AI HUD Intelligence Summaries**: Powered by NVIDIA NIM GLM-5.3-Flash with strict 5-word telemetry constraints.
* Human-in-the-loop Review Queue and Multimodal Evidence Card UI (`src/layers/disasterIntel/panel.js`).
* 3D Clamped Disaster Risk Zone visualization and pin annotations (`src/layers/disasterIntel/rendering.js`).
* Strictly held-out benchmark evaluation suite with traceable provenance (`npm run evaluate`).
* Focused disaster-response UI layout, layer reorganization, and branding pass.

### 3. Third-Party Datasets & Live Feeds
* **Bhote Koshi Event Imagery & Flood Centerline**: Vantor / GeoPera (licensed under CC BY-NC 4.0; non-commercial).
* **NASA GIBS**: Global Imagery Browse Services, Sentinel-2 (HLS S30) and Landsat (HLS L30) imagery.
* **NASA FIRMS**: Active fire thermal anomaly data (CC0 / U.S. Public Domain).
* **USGS**: Earthquake event data and elevation services.
* **National Interagency Fire Center (WFIGS)**: Active wildfire perimeter polygons.
* **RainViewer**: Open weather radar mosaic tiles.
* **OpenStreetMap / Open Infrastructure Map**: Infrastructure extracts (dams, data centers, road networks) under the Open Database License (ODbL 1.0).
* **TomTom**: Traffic flow service API.
* **GBFS**: General Bikeshare Feed Specification feeds.

Full legal and per-source notices are maintained in [DATA_SOURCES.md](DATA_SOURCES.md) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

---

## 🚀 Quick Start

### Prerequisites
* **Node.js** v20.x or v22.x
* Modern WebGL2-compatible browser (Chrome, Edge, Firefox, or Safari)

### Installation & Run

```bash
# 1. Install dependencies
npm install

# 2. Start the local dev server
npm run dev
```

The application will be available at:
```
http://localhost:4173/
```

### Running Tests

```bash
# Run targeted Disaster Intelligence unit tests
node --test src/layers/disasterIntel/disasterIntel.test.mjs

# Run catalog and layer construction tests
node --test src/app/constructCatalog.test.mjs

# Run transit mobility tests
node --test src/app/layers/transit.test.mjs
```

---

## 🛡️ License

The software source code is licensed under the [MIT License](LICENSE). Third-party datasets and imagery remain subject to their respective non-commercial and open data licenses.
