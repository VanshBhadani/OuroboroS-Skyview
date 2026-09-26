/**
 * Backend provider for Multimodal AI Disaster Intelligence (Milestone 2).
 * Serves synthetic disaster intelligence scenarios, multimodal fusion records,
 * timeline progression, and summary metrics.
 * Attached as a Vite dev/preview server middleware under /api/disaster-intel/*.
 */

import {
  getProcessedDisasterZones,
  SYNTHETIC_TIMELINE_SNAPSHOTS,
  getDisasterOverviewSummary,
} from '../../src/layers/disasterIntel/scenarioData.js';
import { readRequestBody } from './common/request.js';

export function disasterAiProxy() {
  const handler = async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname.replace(/^\/api\/disaster-intel/, '');
    const snapshotParam = url.searchParams.get('snapshot') || 'T4';

    const sendJson = (status, payload) => {
      res.writeHead(status, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Disaster-AI-Prototype': 'Microsoft-Hackathon-Milestone-2',
      });
      res.end(JSON.stringify(payload));
    };

    // AI Status endpoint: GET /api/disaster-intel/ai-status
    if (path === '/ai-status') {
      const apiKey = process.env.NVIDIA_API_KEY || process.env.OPENAI_API_KEY;
      return sendJson(200, {
        status: 'nominal',
        provider: 'NVIDIA NIM',
        model: process.env.NVIDIA_MODEL || 'z-ai/glm-5.3-flash',
        baseUrl: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
        configured: Boolean(apiKey),
      });
    }

    // Global Live Feed AI Analysis: POST /api/disaster-intel/global-analysis
    if (path === '/global-analysis') {
      if (req.method !== 'POST') {
        return sendJson(405, { error: 'Method not allowed' });
      }

      const apiKey = process.env.NVIDIA_API_KEY || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return sendJson(503, { error: 'NVIDIA_API_KEY not configured' });
      }

      try {
        const rawBody = await readRequestBody(req, 512 * 1024);
        const feeds = JSON.parse(rawBody || '{}');

        // Pull processed zone data for the Nepal scenario context
        const zones = getProcessedDisasterZones('T4');
        const zoneSummary = zones.map((z) => ({
          id: z.zoneId,
          name: z.name,
          risk: z.fusedRisk,
          priority: z.priority,
          confidence: z.confidence,
          uncertainty: z.uncertainty,
        }));

        const systemPrompt = [
          'You are DisasterLens Global Intelligence Analyst, powered by NVIDIA NIM GLM-5.3-Flash.',
          'You receive real-time aggregated data from multiple live APIs: NASA FIRMS (active fires), NHC (tropical cyclones), weather radar, traffic systems, and multimodal flood zone sensors.',
          'Analyze ALL provided data and generate a comprehensive global disaster threat assessment.',
          'Structure your response in exactly these sections:',
          '1. 🌍 GLOBAL THREAT OVERVIEW: 2-3 sentences summarizing the most critical active threats worldwide right now.',
          '2. 🔥 ACTIVE FIRE INTELLIGENCE: Fire hotspot density, highest-risk regions, trend (escalating/stable/declining).',
          '3. 🌀 CYCLONE / STORM INTELLIGENCE: Any active tropical systems, track forecast, landfall risk.',
          '4. 🌊 FLOOD ZONE STATUS: Summary of multimodal flood zone sensor data — which zones are critical.',
          '5. 🚗 MOBILITY & INFRASTRUCTURE IMPACT: Traffic disruption, route blockages, evacuation feasibility.',
          '6. ⚠️ PRIORITY ACTIONS: Top 3 recommended actions for emergency coordinators right now.',
          '7. 🔮 24H FORECAST: Brief probabilistic outlook for the next 24 hours.',
          'Be concise, authoritative, and data-driven. Reference specific numbers from the data provided.',
        ].join('\n');

        const firmsData = feeds.firms || {};
        const cyclonesData = feeds.cyclones || {};
        const trafficData = feeds.traffic || {};
        const weatherData = feeds.weather || {};

        const userPrompt = [
          `=== LIVE API FEED SNAPSHOT (${new Date().toISOString()}) ===`,
          '',
          `--- NASA FIRMS (Active Fires, Last 24h) ---`,
          `Total fire hotspots detected: ${firmsData.count ?? 'N/A'}`,
          `Sources: VIIRS NOAA-20, VIIRS NOAA-21, VIIRS Suomi-NPP, MODIS`,
          `Status: ${firmsData.status ?? (firmsData.count > 0 ? 'live data' : 'no key / unavailable')}`,
          firmsData.topRegions ? `Highest density regions: ${firmsData.topRegions}` : '',
          '',
          `--- NHC Tropical Cyclones ---`,
          `Active systems: ${cyclonesData.activeCount ?? 'N/A'}`,
          `Storm names: ${cyclonesData.names?.join(', ') || 'None reported'}`,
          `Max sustained winds: ${cyclonesData.maxWinds ?? 'N/A'} kt`,
          '',
          `--- Weather / Radar ---`,
          `Radar status: ${weatherData.radarStatus ?? 'live'}`,
          `Lightning density: ${weatherData.lightningDensity ?? 'N/A'}`,
          `Coverage region: ${weatherData.coverage ?? 'Global mosaic'}`,
          '',
          `--- TomTom Traffic / Mobility ---`,
          `Traffic data status: ${trafficData.status ?? 'live'}`,
          `Average congestion index: ${trafficData.congestionIndex ?? 'N/A'}`,
          '',
          `--- DISASTERLENS Flood Zone Sensors (Nepal — Bhote Koshi, T4 Peak) ---`,
          `Active zones: ${zoneSummary.length}`,
          ...zoneSummary.map((z) =>
            `  Zone ${z.id} "${z.name}": risk=${(z.risk * 100).toFixed(0)}%, priority=${z.priority}, confidence=${(z.confidence * 100).toFixed(0)}%, uncertainty=±${(z.uncertainty * 100).toFixed(0)}%`
          ),
        ].filter((l) => l !== '').join('\n');

        const baseUrl = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
        const model = process.env.NVIDIA_MODEL || 'z-ai/glm-5.3-flash';

        const apiResponse = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.35,
            max_tokens: 2048,
          }),
        });

        if (!apiResponse.ok) {
          const errText = await apiResponse.text().catch(() => '');
          console.warn('[disaster-ai] Global analysis NVIDIA NIM error:', apiResponse.status, errText);
          return sendJson(502, { error: 'NVIDIA NIM global analysis request failed' });
        }

        const data = await apiResponse.json();
        const content = data.choices?.[0]?.message?.content || '';

        return sendJson(200, {
          ok: true,
          model,
          provider: 'NVIDIA NIM',
          analysis: content,
          feedsUsed: {
            firms: Boolean(firmsData.count),
            cyclones: Boolean(cyclonesData.activeCount != null),
            traffic: Boolean(trafficData.status),
            weather: Boolean(weatherData.radarStatus),
            floodZones: zoneSummary.length,
          },
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('[disaster-ai] Global analysis error:', err);
        return sendJson(500, { error: 'Global analysis internal error' });
      }
    }

    // AI Copilot Assessment endpoint: POST /api/disaster-intel/ai-copilot or /ai-assessment
    if (path === '/ai-copilot' || path === '/ai-assessment') {
      if (req.method !== 'POST') {
        return sendJson(405, { error: 'Method not allowed' });
      }

      const apiKey = process.env.NVIDIA_API_KEY || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return sendJson(503, {
          error: 'NVIDIA NIM API key is not configured (set NVIDIA_API_KEY in .env)',
        });
      }

      try {
        const rawBody = await readRequestBody(req, 128 * 1024);
        const body = JSON.parse(rawBody || '{}');
        const { zoneId, zoneName, snapshot = snapshotParam, metrics = {}, modalities = {}, question } = body;

        const systemPrompt = [
          'You are DisasterLens Multimodal Intelligence Copilot, powered by NVIDIA NIM GLM-5.3-Flash.',
          'You analyze fused disaster intelligence combining satellite imagery, meteorological forecasts, hydrological gauges, emergency incident reports, and urban mobility disruptions.',
          'Provide a clear, authoritative, and structured situation assessment for disaster response coordinators.',
          'Format your response strictly with the following sections:',
          '1. HAZARD SUMMARY: 1-2 concise sentences on primary risk and flood breach trajectory.',
          '2. MULTIMODAL SYNTHESIS: Cross-modal agreement analysis between satellite flood extent, hydro stage, and ground reports.',
          '3. TACTICAL RECOMMENDATIONS: 3 actionable emergency response steps (evacuation, drone reconnaissance, route diversion, barriers).',
          'Keep your tone analytical, precise, and objective.',
        ].join('\n');

        const userPrompt = [
          `Target Zone: ${zoneName || zoneId || 'Bhote Koshi River Reach'} (${zoneId || 'UNKNOWN'})`,
          `Timeline Snapshot: ${snapshot}`,
          `Fused Risk: ${metrics.fusedRisk != null ? (metrics.fusedRisk * 100).toFixed(1) + '%' : 'N/A'}`,
          `Confidence: ${metrics.confidence != null ? (metrics.confidence * 100).toFixed(0) + '%' : 'N/A'}`,
          `Uncertainty: ${metrics.uncertainty != null ? '±' + (metrics.uncertainty * 100).toFixed(0) + '%' : 'N/A'}`,
          `Cross-Modal Agreement: ${metrics.crossModalAgreement != null ? (metrics.crossModalAgreement * 100).toFixed(0) + '%' : 'N/A'}`,
          `Evidence Completeness: ${metrics.evidenceCompleteness != null ? (metrics.evidenceCompleteness * 100).toFixed(0) + '%' : 'N/A'}`,
          `Mobility Disruption: ${metrics.mobilityImpact != null ? (metrics.mobilityImpact * 100).toFixed(0) + '%' : 'N/A'}`,
          `Modalities:`,
          `- Satellite: flood probability ${modalities.satellite?.floodProbability != null ? (modalities.satellite.floodProbability * 100).toFixed(0) + '%' : 'N/A'}, change ${modalities.satellite?.changeMagnitude != null ? (modalities.satellite.changeMagnitude * 100).toFixed(0) + '%' : 'N/A'}`,
          `- Weather: ${modalities.weather?.rainfallMm24h != null ? modalities.weather.rainfallMm24h + 'mm/24h' : 'N/A'}, trend ${modalities.weather?.rainfallTrend || 'STABLE'}`,
          `- Sensor (River Stage): ${modalities.sensor?.riverLevelM != null ? modalities.sensor.riverLevelM + 'm' : 'N/A'}, threshold exceeded: ${modalities.sensor?.thresholdExceeded ? 'YES' : 'NO'}`,
          `- Ground Incidents: ${modalities.incident?.reportCount ?? 0} reports, severity ${modalities.incident?.severity || 'LOW'}, keywords: ${(modalities.incident?.keywords || []).join(', ') || 'none'}`,
          `- Mobility: traffic ${modalities.mobility?.trafficCongestion != null ? (modalities.mobility.trafficCongestion * 100).toFixed(0) + '%' : 'N/A'}, route disruption ${modalities.mobility?.routeDisruption != null ? (modalities.mobility.routeDisruption * 100).toFixed(0) + '%' : 'N/A'}`,
          question ? `Coordinator Inquiry: ${question}` : '',
        ].filter(Boolean).join('\n');

        const baseUrl = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
        const model = process.env.NVIDIA_MODEL || 'z-ai/glm-5.3-flash';

        const apiResponse = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.4,
            max_tokens: 2048,
          }),
        });

        if (!apiResponse.ok) {
          const errText = await apiResponse.text().catch(() => '');
          console.warn(`[disaster-ai] NVIDIA NIM API HTTP ${apiResponse.status}:`, errText);
          return sendJson(502, { error: 'NVIDIA NIM Copilot request failed' });
        }

        const data = await apiResponse.json();
        const content = data.choices?.[0]?.message?.content || data.choices?.[0]?.message?.reasoning_content || '';
        const reasoning = data.choices?.[0]?.message?.reasoning_content || null;

        return sendJson(200, {
          ok: true,
          zoneId,
          snapshot,
          model,
          provider: 'NVIDIA NIM',
          assessment: content,
          reasoning,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('[disaster-ai] AI Copilot request error:', err);
        return sendJson(500, { error: 'Internal AI Copilot error' });
      }
    }

    if (req.method !== 'GET') {
      return sendJson(405, { error: 'Method not allowed' });
    }

    // Existing status endpoint
    if (path === '' || path === '/' || path === '/status') {
      return sendJson(200, {
        status: 'nominal',
        provider: 'Multimodal Disaster Intelligence Engine',
        version: '2.0.0-hackathon',
        provenance: 'SIMULATED',
        disclaimer:
          'Decision-support prototype. Predictions are probabilistic and require human verification. This system does not make life-critical decisions autonomously.',
      });
    }

    // Summary endpoint: GET /api/disaster-intel/summary
    if (path === '/summary') {
      const summary = getDisasterOverviewSummary(snapshotParam);
      return sendJson(200, summary);
    }

    // Timeline endpoint: GET /api/disaster-intel/timeline
    if (path === '/timeline') {
      return sendJson(200, {
        snapshots: SYNTHETIC_TIMELINE_SNAPSHOTS,
        activeSnapshot: snapshotParam,
        provenance: 'SIMULATED',
      });
    }

    // Single zone endpoint: GET /api/disaster-intel/zones/:id
    const zoneMatch = path.match(/^\/zones\/([a-zA-Z0-9_-]+)$/);
    if (zoneMatch) {
      const targetId = zoneMatch[1].toUpperCase();
      const zones = getProcessedDisasterZones(snapshotParam);
      const zone = zones.find((z) => z.zoneId.toUpperCase() === targetId);

      if (!zone) {
        return sendJson(404, { error: `Zone not found: ${zoneMatch[1]}` });
      }
      return sendJson(200, zone);
    }

    // All zones endpoint: GET /api/disaster-intel/zones
    if (path === '/zones') {
      const zones = getProcessedDisasterZones(snapshotParam);
      return sendJson(200, zones);
    }

    // Return 404 for unknown subpaths
    return sendJson(404, { error: 'Endpoint not found' });
  };

  return {
    name: 'disaster-ai-provider',
    configureServer(server) {
      server.middlewares.use('/api/disaster-intel', handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/disaster-intel', handler);
    },
  };
}
