/**
 * Pre-computed Held-out Evaluation Results for DisasterLens UI
 */
export const EVALUATION_RESULTS = Object.freeze({
  "dataset": "bhote-koshi-2026-flood-eval",
  "datasetTitle": "Bhote Koshi / Trishuli River Flood Multimodal Evaluation Dataset",
  "license": "CC BY-NC 4.0",
  "timestamp": "2026-09-26T09:35:46.801Z",
  "split": {
    "train": 60,
    "validation": 20,
    "heldOutTest": 20,
    "seed": 42
  },
  "modalities": [
    {
      "id": "satellite",
      "name": "Vantor WorldView-2/3 Satellite Optical Change",
      "license": "CC BY-NC 4.0",
      "scenes": [
        "10300100C86CED00",
        "B040001100881410"
      ]
    },
    {
      "id": "weatherHydrology",
      "name": "Nepal DHM & Topographic Elevation Hydrometrics",
      "license": "ODbL / CC BY 4.0",
      "station": "DHM 652 (Trishuli)"
    },
    {
      "id": "groundWitness",
      "name": "GeoConfirmed / GeoGeorgeShadrach Ground OSINT",
      "license": "Public Open Research"
    }
  ],
  "models": {
    "satellite_only": {
      "name": "Satellite-Only Baseline (WorldView-2/3)",
      "threshold": 0.1,
      "metrics": {
        "totalSamples": 20,
        "positiveSamples": 10,
        "negativeSamples": 10,
        "tp": 10,
        "fp": 8,
        "tn": 2,
        "fn": 0,
        "accuracy": 0.6,
        "precision": 0.5556,
        "recall": 1,
        "f1": 0.7143,
        "rocAuc": 0.66,
        "confusionMatrix": [
          [
            2,
            8
          ],
          [
            0,
            10
          ]
        ]
      }
    },
    "weather_hydrology_only": {
      "name": "Weather/Hydrology-Only Baseline (DHM & Stage)",
      "threshold": 0.2,
      "metrics": {
        "totalSamples": 20,
        "positiveSamples": 10,
        "negativeSamples": 10,
        "tp": 10,
        "fp": 0,
        "tn": 10,
        "fn": 0,
        "accuracy": 1,
        "precision": 1,
        "recall": 1,
        "f1": 1,
        "rocAuc": 1,
        "confusionMatrix": [
          [
            10,
            0
          ],
          [
            0,
            10
          ]
        ]
      }
    },
    "multimodal_fusion": {
      "name": "DisasterLens Multimodal Fusion Model",
      "threshold": 0.6,
      "metrics": {
        "totalSamples": 20,
        "positiveSamples": 10,
        "negativeSamples": 10,
        "tp": 10,
        "fp": 0,
        "tn": 10,
        "fn": 0,
        "accuracy": 1,
        "precision": 1,
        "recall": 1,
        "f1": 1,
        "rocAuc": 1,
        "confusionMatrix": [
          [
            10,
            0
          ],
          [
            0,
            10
          ]
        ]
      }
    }
  },
  "comparison": {
    "f1_satellite": 0.7143,
    "f1_weather": 1,
    "f1_multimodal": 1,
    "accuracy_satellite": 0.6,
    "accuracy_weather": 1,
    "accuracy_multimodal": 1,
    "multimodalOutperformsSingleBaselines": true
  },
  "humanReviewCases": {
    "count": 18,
    "cases": [
      {
        "sampleId": "BK-037",
        "groundTruth": 1,
        "predictedRisk": 0.82,
        "prediction": 1,
        "confidence": 0.96,
        "uncertainty": 0.04,
        "crossModalAgreement": 0.88,
        "reasons": [
          "High multimodal disaster risk (82%)",
          "Satellite imagery indicates extensive inundation (87% probability)",
          "River stage exceeds flood hazard threshold (8.5 m)",
          "Severe arterial corridor & transit disruption (84%)"
        ],
        "location": {
          "lat": 28.20296,
          "lon": 85.35303,
          "elevationM": 1526.2,
          "chainageM": 34060,
          "reachDescription": "Trishuli River Corridor km 34.1"
        }
      },
      {
        "sampleId": "BK-097",
        "groundTruth": 0,
        "predictedRisk": 0.304,
        "prediction": 0,
        "confidence": 0.86,
        "uncertainty": 0.14,
        "crossModalAgreement": 0.52,
        "reasons": [
          "Cross-modal disagreement (52% agreement)"
        ],
        "location": {
          "lat": 28.18108,
          "lon": 85.33726,
          "elevationM": 1818,
          "chainageM": 36907,
          "reachDescription": "Valley Wall Flank +354m (Reach km 36.9)"
        }
      },
      {
        "sampleId": "BK-020",
        "groundTruth": 1,
        "predictedRisk": 0.844,
        "prediction": 1,
        "confidence": 0.99,
        "uncertainty": 0.01,
        "crossModalAgreement": 0.98,
        "reasons": [
          "High multimodal disaster risk (84%)",
          "Satellite imagery indicates extensive inundation (75% probability)",
          "River stage exceeds flood hazard threshold (8.5 m)",
          "Severe arterial corridor & transit disruption (84%)"
        ],
        "location": {
          "lat": 28.23984,
          "lon": 85.35797,
          "elevationM": 1645.3,
          "chainageM": 29334,
          "reachDescription": "Trishuli River Corridor km 29.3"
        }
      },
      {
        "sampleId": "BK-089",
        "groundTruth": 0,
        "predictedRisk": 0.543,
        "prediction": 0,
        "confidence": 0.81,
        "uncertainty": 0.19,
        "crossModalAgreement": 0.37,
        "reasons": [
          "Satellite imagery indicates extensive inundation (90% probability)",
          "Cross-modal disagreement (37% agreement)"
        ],
        "location": {
          "lat": 28.20134,
          "lon": 85.34885,
          "elevationM": 1810,
          "chainageM": 34577,
          "reachDescription": "Valley Wall Flank +302m (Reach km 34.6)"
        }
      },
      {
        "sampleId": "BK-091",
        "groundTruth": 0,
        "predictedRisk": 0.581,
        "prediction": 0,
        "confidence": 0.85,
        "uncertainty": 0.15,
        "crossModalAgreement": 0.49,
        "reasons": [
          "Satellite imagery indicates extensive inundation (90% probability)",
          "Cross-modal disagreement (49% agreement)"
        ],
        "location": {
          "lat": 28.19593,
          "lon": 85.34672,
          "elevationM": 1614,
          "chainageM": 35157,
          "reachDescription": "Valley Wall Flank +120m (Reach km 35.2)"
        }
      },
      {
        "sampleId": "BK-009",
        "groundTruth": 1,
        "predictedRisk": 0.884,
        "prediction": 1,
        "confidence": 0.99,
        "uncertainty": 0.01,
        "crossModalAgreement": 0.99,
        "reasons": [
          "Critical multimodal disaster risk (88%)",
          "Satellite imagery indicates extensive inundation (89% probability)",
          "River stage exceeds flood hazard threshold (8.5 m)",
          "Severe arterial corridor & transit disruption (84%)"
        ],
        "location": {
          "lat": 28.26248,
          "lon": 85.37199,
          "elevationM": 1725.5,
          "chainageM": 25973,
          "reachDescription": "Trishuli River Corridor km 26.0"
        }
      },
      {
        "sampleId": "BK-069",
        "groundTruth": 0,
        "predictedRisk": 0.321,
        "prediction": 0,
        "confidence": 0.86,
        "uncertainty": 0.14,
        "crossModalAgreement": 0.53,
        "reasons": [
          "Cross-modal disagreement (53% agreement)"
        ],
        "location": {
          "lat": 28.24312,
          "lon": 85.35348,
          "elevationM": 1948,
          "chainageM": 29057,
          "reachDescription": "Valley Wall Flank +302m (Reach km 29.1)"
        }
      },
      {
        "sampleId": "BK-041",
        "groundTruth": 1,
        "predictedRisk": 0.828,
        "prediction": 1,
        "confidence": 0.96,
        "uncertainty": 0.04,
        "crossModalAgreement": 0.87,
        "reasons": [
          "High multimodal disaster risk (83%)",
          "Satellite imagery indicates extensive inundation (90% probability)",
          "River stage exceeds flood hazard threshold (8.5 m)",
          "Severe arterial corridor & transit disruption (84%)"
        ],
        "location": {
          "lat": 28.19426,
          "lon": 85.3498,
          "elevationM": 1493.6,
          "chainageM": 35157,
          "reachDescription": "Trishuli River Corridor km 35.2"
        }
      },
      {
        "sampleId": "BK-065",
        "groundTruth": 0,
        "predictedRisk": 0.422,
        "prediction": 0,
        "confidence": 0.87,
        "uncertainty": 0.13,
        "crossModalAgreement": 0.58,
        "reasons": [
          "Cross-modal disagreement (58% agreement)"
        ],
        "location": {
          "lat": 28.24852,
          "lon": 85.35857,
          "elevationM": 1816,
          "chainageM": 27798,
          "reachDescription": "Valley Wall Flank +146m (Reach km 27.8)"
        }
      },
      {
        "sampleId": "BK-099",
        "groundTruth": 0,
        "predictedRisk": 0.297,
        "prediction": 0,
        "confidence": 0.85,
        "uncertainty": 0.15,
        "crossModalAgreement": 0.5,
        "reasons": [
          "Cross-modal disagreement (50% agreement)"
        ],
        "location": {
          "lat": 28.17796,
          "lon": 85.33859,
          "elevationM": 1628,
          "chainageM": 37400,
          "reachDescription": "Valley Wall Flank +172m (Reach km 37.4)"
        }
      },
      {
        "sampleId": "BK-082",
        "groundTruth": 0,
        "predictedRisk": 0.54,
        "prediction": 0,
        "confidence": 0.81,
        "uncertainty": 0.19,
        "crossModalAgreement": 0.38,
        "reasons": [
          "Satellite imagery indicates extensive inundation (90% probability)",
          "Cross-modal disagreement (38% agreement)"
        ],
        "location": {
          "lat": 28.21249,
          "lon": 85.35993,
          "elevationM": 1711,
          "chainageM": 32723,
          "reachDescription": "Valley Wall Flank +159m (Reach km 32.7)"
        }
      },
      {
        "sampleId": "BK-027",
        "groundTruth": 1,
        "predictedRisk": 0.704,
        "prediction": 1,
        "confidence": 0.95,
        "uncertainty": 0.05,
        "crossModalAgreement": 0.83,
        "reasons": [
          "High multimodal disaster risk (70%)",
          "River stage exceeds flood hazard threshold (8.5 m)",
          "Severe arterial corridor & transit disruption (84%)"
        ],
        "location": {
          "lat": 28.22472,
          "lon": 85.36126,
          "elevationM": 1587.9,
          "chainageM": 31238,
          "reachDescription": "Trishuli River Corridor km 31.2"
        }
      },
      {
        "sampleId": "BK-032",
        "groundTruth": 1,
        "predictedRisk": 0.777,
        "prediction": 1,
        "confidence": 0.96,
        "uncertainty": 0.04,
        "crossModalAgreement": 0.88,
        "reasons": [
          "High multimodal disaster risk (78%)",
          "River stage exceeds flood hazard threshold (8.5 m)",
          "Severe arterial corridor & transit disruption (84%)"
        ],
        "location": {
          "lat": 28.21381,
          "lon": 85.355,
          "elevationM": 1552.4,
          "chainageM": 32723,
          "reachDescription": "Trishuli River Corridor km 32.7"
        }
      },
      {
        "sampleId": "BK-054",
        "groundTruth": 0,
        "predictedRisk": 0.384,
        "prediction": 0,
        "confidence": 0.87,
        "uncertainty": 0.13,
        "crossModalAgreement": 0.55,
        "reasons": [
          "Cross-modal disagreement (55% agreement)"
        ],
        "location": {
          "lat": 28.27344,
          "lon": 85.38071,
          "elevationM": 2147,
          "chainageM": 24537,
          "reachDescription": "Valley Wall Flank +367m (Reach km 24.5)"
        }
      },
      {
        "sampleId": "BK-092",
        "groundTruth": 0,
        "predictedRisk": 0.31,
        "prediction": 0,
        "confidence": 0.86,
        "uncertainty": 0.14,
        "crossModalAgreement": 0.52,
        "reasons": [
          "Cross-modal disagreement (52% agreement)"
        ],
        "location": {
          "lat": 28.18962,
          "lon": 85.35339,
          "elevationM": 1773,
          "chainageM": 35434,
          "reachDescription": "Valley Wall Flank +289m (Reach km 35.4)"
        }
      },
      {
        "sampleId": "BK-031",
        "groundTruth": 1,
        "predictedRisk": 0.778,
        "prediction": 1,
        "confidence": 0.96,
        "uncertainty": 0.04,
        "crossModalAgreement": 0.88,
        "reasons": [
          "High multimodal disaster risk (78%)",
          "River stage exceeds flood hazard threshold (8.5 m)",
          "Severe arterial corridor & transit disruption (84%)"
        ],
        "location": {
          "lat": 28.21598,
          "lon": 85.35497,
          "elevationM": 1558.2,
          "chainageM": 32459,
          "reachDescription": "Trishuli River Corridor km 32.5"
        }
      },
      {
        "sampleId": "BK-098",
        "groundTruth": 0,
        "predictedRisk": 0.276,
        "prediction": 0,
        "confidence": 0.84,
        "uncertainty": 0.16,
        "crossModalAgreement": 0.48,
        "reasons": [
          "Cross-modal disagreement (48% agreement)"
        ],
        "location": {
          "lat": 28.17913,
          "lon": 85.3494,
          "elevationM": 1737,
          "chainageM": 37160,
          "reachDescription": "Valley Wall Flank +263m (Reach km 37.2)"
        }
      },
      {
        "sampleId": "BK-013",
        "groundTruth": 1,
        "predictedRisk": 0.777,
        "prediction": 1,
        "confidence": 0.98,
        "uncertainty": 0.02,
        "crossModalAgreement": 0.92,
        "reasons": [
          "High multimodal disaster risk (78%)",
          "River stage exceeds flood hazard threshold (8.5 m)",
          "Severe arterial corridor & transit disruption (84%)"
        ],
        "location": {
          "lat": 28.25454,
          "lon": 85.36477,
          "elevationM": 1691.4,
          "chainageM": 27244,
          "reachDescription": "Trishuli River Corridor km 27.2"
        }
      }
    ]
  },
  "datasetLimitations": [
    "Geographic Specificity: Data reflects a steep Himalayan V-shaped mountain river gorge (Trishuli/Bhote Koshi); physical inundation dynamics differ in wide flat alluvial floodplains.",
    "Temporal Baseline Gap: Satellite pre-event reference (WorldView-2, Oct 2021) captures historical geomorphology and the July 2025 flood rather than an immediate pre-storm baseline.",
    "Optical Occlusion: High-relief mountain terrain introduces steep shadows and localized cloud edge variance in optical satellite sensors.",
    "Ground Observer Density: Witness anchors cluster along the highway and settlements (Syabrubesi, Dhunche, Timure); unpopulated upper headwaters lack direct eyewitness coverage.",
    "Prototype Operational Limitation: This evaluation establishes comparative multimodal performance on public disaster data and does not establish certified real-world life-safety or emergency agency performance."
  ],
  "heldOutEvaluations": [
    {
      "sampleId": "BK-037",
      "groundTruth": "FLOOD",
      "prediction": "FLOOD",
      "riskScore": 0.82,
      "confidence": 0.96,
      "uncertainty": 0.04,
      "riskCategory": "HIGH",
      "provenance": {
        "satellite": "Vantor WorldView-2/3 Open Data Program",
        "weatherHydrology": "Nepal DHM Station 652 (Trishuli) & GeoPera Catchment Model",
        "groundWitness": "None"
      }
    },
    {
      "sampleId": "BK-097",
      "groundTruth": "NON_FLOOD",
      "prediction": "NON_FLOOD",
      "riskScore": 0.304,
      "confidence": 0.86,
      "uncertainty": 0.14,
      "riskCategory": "LOW",
      "provenance": {
        "satellite": "Vantor WorldView-2/3 Open Data Program",
        "weatherHydrology": "Nepal DHM Station 652 (Trishuli) & GeoPera Catchment Model",
        "groundWitness": "GeoGeorgeShadrach Geolocation Map / GeoConfirmed"
      }
    },
    {
      "sampleId": "BK-020",
      "groundTruth": "FLOOD",
      "prediction": "FLOOD",
      "riskScore": 0.844,
      "confidence": 0.99,
      "uncertainty": 0.01,
      "riskCategory": "HIGH",
      "provenance": {
        "satellite": "Vantor WorldView-2/3 Open Data Program",
        "weatherHydrology": "Nepal DHM Station 652 (Trishuli) & GeoPera Catchment Model",
        "groundWitness": "GeoGeorgeShadrach Geolocation Map / GeoConfirmed"
      }
    },
    {
      "sampleId": "BK-089",
      "groundTruth": "NON_FLOOD",
      "prediction": "NON_FLOOD",
      "riskScore": 0.543,
      "confidence": 0.81,
      "uncertainty": 0.19,
      "riskCategory": "MODERATE",
      "provenance": {
        "satellite": "Vantor WorldView-2/3 Open Data Program",
        "weatherHydrology": "Nepal DHM Station 652 (Trishuli) & GeoPera Catchment Model",
        "groundWitness": "GeoGeorgeShadrach Geolocation Map / GeoConfirmed"
      }
    },
    {
      "sampleId": "BK-091",
      "groundTruth": "NON_FLOOD",
      "prediction": "NON_FLOOD",
      "riskScore": 0.581,
      "confidence": 0.85,
      "uncertainty": 0.15,
      "riskCategory": "MODERATE",
      "provenance": {
        "satellite": "Vantor WorldView-2/3 Open Data Program",
        "weatherHydrology": "Nepal DHM Station 652 (Trishuli) & GeoPera Catchment Model",
        "groundWitness": "GeoGeorgeShadrach Geolocation Map / GeoConfirmed"
      }
    },
    {
      "sampleId": "BK-009",
      "groundTruth": "FLOOD",
      "prediction": "FLOOD",
      "riskScore": 0.884,
      "confidence": 0.99,
      "uncertainty": 0.01,
      "riskCategory": "CRITICAL",
      "provenance": {
        "satellite": "Vantor WorldView-2/3 Open Data Program",
        "weatherHydrology": "Nepal DHM Station 652 (Trishuli) & GeoPera Catchment Model",
        "groundWitness": "GeoGeorgeShadrach Geolocation Map / GeoConfirmed"
      }
    },
    {
      "sampleId": "BK-069",
      "groundTruth": "NON_FLOOD",
      "prediction": "NON_FLOOD",
      "riskScore": 0.321,
      "confidence": 0.86,
      "uncertainty": 0.14,
      "riskCategory": "LOW",
      "provenance": {
        "satellite": "Vantor WorldView-2/3 Open Data Program",
        "weatherHydrology": "Nepal DHM Station 652 (Trishuli) & GeoPera Catchment Model",
        "groundWitness": "GeoGeorgeShadrach Geolocation Map / GeoConfirmed"
      }
    },
    {
      "sampleId": "BK-041",
      "groundTruth": "FLOOD",
      "prediction": "FLOOD",
      "riskScore": 0.828,
      "confidence": 0.96,
      "uncertainty": 0.04,
      "riskCategory": "HIGH",
      "provenance": {
        "satellite": "Vantor WorldView-2/3 Open Data Program",
        "weatherHydrology": "Nepal DHM Station 652 (Trishuli) & GeoPera Catchment Model",
        "groundWitness": "None"
      }
    },
    {
      "sampleId": "BK-024",
      "groundTruth": "FLOOD",
      "prediction": "FLOOD",
      "riskScore": 0.614,
      "confidence": 0.89,
      "uncertainty": 0.11,
      "riskCategory": "MODERATE",
      "provenance": {
        "satellite": "Vantor WorldView-2/3 Open Data Program",
        "weatherHydrology": "Nepal DHM Station 652 (Trishuli) & GeoPera Catchment Model",
        "groundWitness": "None"
      }
    },
    {
      "sampleId": "BK-065",
      "groundTruth": "NON_FLOOD",
      "prediction": "NON_FLOOD",
      "riskScore": 0.422,
      "confidence": 0.87,
      "uncertainty": 0.13,
      "riskCategory": "MODERATE",
      "provenance": {
        "satellite": "Vantor WorldView-2/3 Open Data Program",
        "weatherHydrology": "Nepal DHM Station 652 (Trishuli) & GeoPera Catchment Model",
        "groundWitness": "GeoGeorgeShadrach Geolocation Map / GeoConfirmed"
      }
    },
    {
      "sampleId": "BK-099",
      "groundTruth": "NON_FLOOD",
      "prediction": "NON_FLOOD",
      "riskScore": 0.297,
      "confidence": 0.85,
      "uncertainty": 0.15,
      "riskCategory": "LOW",
      "provenance": {
        "satellite": "Vantor WorldView-2/3 Open Data Program",
        "weatherHydrology": "Nepal DHM Station 652 (Trishuli) & GeoPera Catchment Model",
        "groundWitness": "GeoGeorgeShadrach Geolocation Map / GeoConfirmed"
      }
    },
    {
      "sampleId": "BK-082",
      "groundTruth": "NON_FLOOD",
      "prediction": "NON_FLOOD",
      "riskScore": 0.54,
      "confidence": 0.81,
      "uncertainty": 0.19,
      "riskCategory": "MODERATE",
      "provenance": {
        "satellite": "Vantor WorldView-2/3 Open Data Program",
        "weatherHydrology": "Nepal DHM Station 652 (Trishuli) & GeoPera Catchment Model",
        "groundWitness": "GeoGeorgeShadrach Geolocation Map / GeoConfirmed"
      }
    },
    {
      "sampleId": "BK-022",
      "groundTruth": "FLOOD",
      "prediction": "FLOOD",
      "riskScore": 0.629,
      "confidence": 0.91,
      "uncertainty": 0.09,
      "riskCategory": "MODERATE",
      "provenance": {
        "satellite": "Vantor WorldView-2/3 Open Data Program",
        "weatherHydrology": "Nepal DHM Station 652 (Trishuli) & GeoPera Catchment Model",
        "groundWitness": "None"
      }
    },
    {
      "sampleId": "BK-027",
      "groundTruth": "FLOOD",
      "prediction": "FLOOD",
      "riskScore": 0.704,
      "confidence": 0.95,
      "uncertainty": 0.05,
      "riskCategory": "HIGH",
      "provenance": {
        "satellite": "Vantor WorldView-2/3 Open Data Program",
        "weatherHydrology": "Nepal DHM Station 652 (Trishuli) & GeoPera Catchment Model",
        "groundWitness": "None"
      }
    },
    {
      "sampleId": "BK-032",
      "groundTruth": "FLOOD",
      "prediction": "FLOOD",
      "riskScore": 0.777,
      "confidence": 0.96,
      "uncertainty": 0.04,
      "riskCategory": "HIGH",
      "provenance": {
        "satellite": "Vantor WorldView-2/3 Open Data Program",
        "weatherHydrology": "Nepal DHM Station 652 (Trishuli) & GeoPera Catchment Model",
        "groundWitness": "None"
      }
    },
    {
      "sampleId": "BK-054",
      "groundTruth": "NON_FLOOD",
      "prediction": "NON_FLOOD",
      "riskScore": 0.384,
      "confidence": 0.87,
      "uncertainty": 0.13,
      "riskCategory": "LOW",
      "provenance": {
        "satellite": "Vantor WorldView-2/3 Open Data Program",
        "weatherHydrology": "Nepal DHM Station 652 (Trishuli) & GeoPera Catchment Model",
        "groundWitness": "GeoGeorgeShadrach Geolocation Map / GeoConfirmed"
      }
    },
    {
      "sampleId": "BK-092",
      "groundTruth": "NON_FLOOD",
      "prediction": "NON_FLOOD",
      "riskScore": 0.31,
      "confidence": 0.86,
      "uncertainty": 0.14,
      "riskCategory": "LOW",
      "provenance": {
        "satellite": "Vantor WorldView-2/3 Open Data Program",
        "weatherHydrology": "Nepal DHM Station 652 (Trishuli) & GeoPera Catchment Model",
        "groundWitness": "GeoGeorgeShadrach Geolocation Map / GeoConfirmed"
      }
    },
    {
      "sampleId": "BK-031",
      "groundTruth": "FLOOD",
      "prediction": "FLOOD",
      "riskScore": 0.778,
      "confidence": 0.96,
      "uncertainty": 0.04,
      "riskCategory": "HIGH",
      "provenance": {
        "satellite": "Vantor WorldView-2/3 Open Data Program",
        "weatherHydrology": "Nepal DHM Station 652 (Trishuli) & GeoPera Catchment Model",
        "groundWitness": "None"
      }
    },
    {
      "sampleId": "BK-098",
      "groundTruth": "NON_FLOOD",
      "prediction": "NON_FLOOD",
      "riskScore": 0.276,
      "confidence": 0.84,
      "uncertainty": 0.16,
      "riskCategory": "LOW",
      "provenance": {
        "satellite": "Vantor WorldView-2/3 Open Data Program",
        "weatherHydrology": "Nepal DHM Station 652 (Trishuli) & GeoPera Catchment Model",
        "groundWitness": "GeoGeorgeShadrach Geolocation Map / GeoConfirmed"
      }
    },
    {
      "sampleId": "BK-013",
      "groundTruth": "FLOOD",
      "prediction": "FLOOD",
      "riskScore": 0.777,
      "confidence": 0.98,
      "uncertainty": 0.02,
      "riskCategory": "HIGH",
      "provenance": {
        "satellite": "Vantor WorldView-2/3 Open Data Program",
        "weatherHydrology": "Nepal DHM Station 652 (Trishuli) & GeoPera Catchment Model",
        "groundWitness": "GeoGeorgeShadrach Geolocation Map / GeoConfirmed"
      }
    }
  ]
});
