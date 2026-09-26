/**
 * Disaster Intelligence Data Ingestion Source (Milestone 2)
 * Fetches multimodal scenario feeds or returns local processed scenario records.
 */
import {
  getProcessedDisasterZones,
  getTimelineSnapshots,
  getDisasterOverviewSummary,
} from './scenarioData.js';

export function createDisasterIntelSource() {
  return {
    async getSnapshot(snapshotId = 'T4') {
      try {
        const response = await fetch(`/api/disaster-intel/zones?snapshot=${encodeURIComponent(snapshotId)}`, {
          headers: { Accept: 'application/json' },
        });
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            return data;
          }
        }
      } catch {
        // Fallback to local synchronous processing
      }
      return getProcessedDisasterZones(snapshotId);
    },

    async getSummary(snapshotId = 'T4') {
      try {
        const response = await fetch(`/api/disaster-intel/summary?snapshot=${encodeURIComponent(snapshotId)}`, {
          headers: { Accept: 'application/json' },
        });
        if (response.ok) {
          return await response.json();
        }
      } catch {
        // Fallback to local
      }
      return getDisasterOverviewSummary(snapshotId);
    },

    async getTimeline() {
      try {
        const response = await fetch('/api/disaster-intel/timeline', {
          headers: { Accept: 'application/json' },
        });
        if (response.ok) {
          return await response.json();
        }
      } catch {
        // Fallback to local
      }
      return {
        snapshots: getTimelineSnapshots(),
        activeSnapshot: 'T4',
        provenance: 'SIMULATED',
      };
    },
  };
}
