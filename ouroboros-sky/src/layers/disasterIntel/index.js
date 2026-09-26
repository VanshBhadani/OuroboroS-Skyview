/**
 * Disaster Intelligence Layer (Microsoft Hackathon Milestone 1)
 *
 * Implements the standard God's Eye View layer lifecycle contract:
 *   init(viewer) -> enable(viewer) -> disable(viewer) -> destroy(viewer)
 */
import { createDisasterIntelSource } from './source.js';
import { createDisasterIntelRenderer } from './rendering.js';
import { createDisasterIntelPanel } from './panel.js';

export function createDisasterIntelligenceLayer(options = {}) {
  let _viewer = null;
  let _renderer = null;
  let _panel = null;
  let _source = null;
  let _enabled = false;
  let _zones = [];
  let _firstEnable = true;

  const layer = {
    id: 'disaster-intelligence',
    name: 'Disaster Intelligence',
    icon: '🛡️',
    source: 'Multimodal AI · Prototype',
    showInTogglePanel: true,
    updateInterval: 30000,
    stats: { count: 0 },

    init(viewer) {
      if (_viewer) return;
      _viewer = viewer;
      _source = options.source || createDisasterIntelSource();

      _panel = createDisasterIntelPanel({
        onSelectZone: (zone) => {
          _renderer?.flyToZone(zone.zoneId);
        },
        onFlyToZone: (zoneId) => {
          _renderer?.flyToZone(zoneId);
        },
        onSnapshotChange: async (snapshotId) => {
          try {
            const snapZones = await _source.getSnapshot(snapshotId);
            if (snapZones?.length) {
              _zones = snapZones;
              layer.stats.count = _zones.length;
              _renderer?.renderZones(_zones);
              _panel?.updateZones(_zones, snapshotId);
            }
          } catch (err) {
            console.warn('[DisasterIntel] Failed to change snapshot:', err);
          }
        },
      });

      _renderer = createDisasterIntelRenderer({
        viewer,
        onSelectZone: (zone) => {
          _panel?.selectZone(zone);
        },
      });

      // Load initial scenario data
      _source.getSnapshot().then((zones) => {
        _zones = zones || [];
        layer.stats.count = _zones.length;
        _renderer.renderZones(_zones);
        _panel.updateZones(_zones);

        // Auto-activate Disaster Intelligence on startup in browser
        if (typeof window !== 'undefined' && !window.__disaster_auto_started) {
          window.__disaster_auto_started = true;
          setTimeout(() => {
            if (!_enabled) {
              layer.enable(viewer);
            }
          }, 350);
        }
      }).catch((err) => {
        console.warn('[DisasterIntel] Failed to load scenario:', err);
      });

      console.info('[Data:DisasterIntel] Initialized layer');
    },

    enable(viewer) {
      _enabled = true;
      layer.enabled = true;
      if (_renderer) _renderer.setVisible(true);
      if (_panel) _panel.setVisible(true);

      // Navigate camera toward Nepal disaster focus area
      if (_viewer && _zones.length > 0) {
        const target = _zones[0];
        _viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(
            target.longitude,
            target.latitude,
            22000,
          ),
          orientation: {
            heading: Cesium.Math.toRadians(12),
            pitch: Cesium.Math.toRadians(-45),
            roll: 0.0,
          },
          duration: 2.5,
        });
      }
    },

    disable(viewer) {
      _enabled = false;
      if (_renderer) _renderer.setVisible(false);
      if (_panel) _panel.setVisible(false);
    },

    async update(viewer) {
      if (!_enabled || !_source) return;
      try {
        const fresh = await _source.getSnapshot();
        if (fresh?.length) {
          _zones = fresh;
          layer.stats.count = _zones.length;
          _renderer?.renderZones(_zones);
          _panel?.updateZones(_zones);
        }
      } catch (err) {
        console.warn('[DisasterIntel] Update failed:', err);
      }
    },

    destroy(viewer = _viewer) {
      _enabled = false;
      _renderer?.destroy();
      _renderer = null;
      _panel?.destroy();
      _panel = null;
      _viewer = null;
      _source = null;
    },

    // Allow programmatic inspection
    getZones: () => [..._zones],
    selectZone: (zoneId) => {
      const z = _zones.find((item) => item.zoneId === zoneId);
      if (z) {
        _panel?.selectZone(z);
        _renderer?.flyToZone(zoneId);
      }
    },
  };

  return layer;
}
