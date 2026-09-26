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
