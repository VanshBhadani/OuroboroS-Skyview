import { createWeatherClock } from '../layers/weather/clock.js';
import { createWeatherLayer } from '../layers/weather/index.js';
import { createCyclonesLayer } from '../layers/cyclones/index.js';
import { createWindLayer } from '../layers/wind/index.js';
import { createLayerCatalog } from './catalog.js';
import { LAYER_STATE_REGISTRY } from '../data/layerState.js';
import { createMilitaryRegistry } from '../layers/aircraft/classification.js';
import { createApplicationTraffic } from './layers/traffic.js';
import { createApplicationBikeshare } from './layers/bikeshare.js';
import { createApplicationDirections } from './layers/directions.js';
import { createApplicationRecentImagery } from './layers/recentImagery.js';
import { createApplicationTransit } from './layers/transit.js';
import { createApplicationFirms } from './layers/firms.js';
import { createApplicationEarthquakes } from './layers/earthquakes.js';
import { createApplicationFirePerimeters } from './layers/perimeters.js';
import { createInfrastructureLayers } from '../data/infrastructure.js';
import { localGeoJsonServices } from './localGeojsonServices.js';
import { createBhoteKoshiEventLayer } from '../data/bhoteKoshiEvent.js';
import { createBhoteKoshiLocatorLayer } from '../data/bhoteKoshiLocator.js';
import { createDisasterIntelligenceLayer } from '../layers/disasterIntel/index.js';
import { createApplicationCctv } from './layers/cctv.js';

const SOURCE_METHODS = Object.freeze({
  traffic: [
    'requestRoads',
    'getStatus',
    'fetchFlowForBounds',
    'getFlowSessionStats',
    'resetFlowTileCache',
  ],
  bikeshare: ['getStations'],
  firms: ['getSnapshot'],
  wind: ['getSnapshot'],
  weather: ['getSnapshot'],
  cyclones: ['getSnapshot'],
  earthquakes: ['getSnapshot'],
  'fire-perimeters': ['getSnapshot'],
  cctv: ['getCatalog', 'getHealth', 'getFrameUrl', 'getMediaUrl'],
});

export const LOCAL_ONLY_LAYER_METADATA = Object.freeze([
  Object.freeze({ id: 'disaster-intelligence', disposition: 'local-only' }),
  Object.freeze({ id: 'cctv', disposition: 'local-only' }),
]);

const RETAINED_LAYER_IDS = new Set([
  'bhote-koshi-2026',
  'bhote-koshi-locator',
  'earthquakes',
  'fire-perimeters',
  'traffic',
  'transit',
  'bikeshare',
  'directions',
  'recent-imagery',
  'wind',
  'weather-radar',
  'weather-satellite',
  'weather-lightning',
  'weather-cyclones',
  'local-dams',
  'local-datacenters',
  'local-firms',
  'disaster-intelligence',
]);


/** Serialization metadata for retained DisasterLens layers. */
export const APPLICATION_LAYER_METADATA = Object.freeze([
  ...LAYER_STATE_REGISTRY.filter((entry) => RETAINED_LAYER_IDS.has(entry.id)),
  ...LOCAL_ONLY_LAYER_METADATA,
]);

/** Construct the DisasterLens catalog.
 * Scene engines remain page-owned; layers and classification have this app's lifetime.
 * The manager owns layer destruction, while abort releases classification even if startup fails.
 */
export function createApplicationCatalog({
  surface,
  sources,
  signal,
  metadata = APPLICATION_LAYER_METADATA,
  nepalBoundaryResolver,
}) {
  if (!signal?.addEventListener)
    throw new TypeError('An application lifetime signal is required');
  signal.throwIfAborted();
  if (!surface?.groundFloor || !surface?.terrain)
    throw new TypeError('Application surface services are required');

  for (const [name, methods] of Object.entries(SOURCE_METHODS)) {
    if (
      methods.some((method) => typeof sources?.[name]?.[method] !== 'function')
    )
      throw new TypeError(`Invalid catalog source: ${name}`);
  }
  const militaryRegistry = createMilitaryRegistry();
  const weatherClock = createWeatherClock();
  const dispose = () => {
    signal.removeEventListener('abort', dispose);
    militaryRegistry.dispose();
    weatherClock.destroy();
  };
  signal.addEventListener('abort', dispose, { once: true });
  try {
    if (sources?.military) {
      militaryRegistry.configureSource(sources.military, { signal });
    }
    const layers = [
      createBhoteKoshiEventLayer(),
      createBhoteKoshiLocatorLayer({
        boundaryResolver: nepalBoundaryResolver,
      }),
      createApplicationEarthquakes({ source: sources.earthquakes }),
      createApplicationFirePerimeters({
        source: sources['fire-perimeters'],
      }),
      createApplicationTraffic({ source: sources.traffic }),
      createApplicationTransit({ surface, source: sources.transit }),
      createApplicationBikeshare({ source: sources.bikeshare }),
      createApplicationDirections(),
      createApplicationRecentImagery(),
      createWindLayer({ feed: sources.wind, clock: weatherClock }),
      createWeatherLayer({
        feed: sources.weather,
        id: 'weather-radar',
        clock: weatherClock,
      }),
      createWeatherLayer({
        feed: sources.weather,
        id: 'weather-satellite',
        clock: weatherClock,
      }),
      createWeatherLayer({
        feed: sources.weather,
        id: 'weather-lightning',
        clock: weatherClock,
      }),
      createCyclonesLayer({ feed: sources.cyclones }),
      ...createInfrastructureLayers(localGeoJsonServices),
      createApplicationFirms({
        surface,
        id: 'local-firms',
        name: 'FIRMS Active Fires',
        icon: '▲',
        source: 'NASA FIRMS · LIVE',
        feed: sources.firms,
      }),
      createDisasterIntelligenceLayer(),
      createApplicationCctv({ surface, source: sources.cctv }),
    ];
    const activeIds = new Set(layers.map((layer) => layer.id));
    const activeMetadata = metadata.filter((entry) => activeIds.has(entry.id));

    const catalog = createLayerCatalog(layers, activeMetadata);
    return Object.freeze({
      ...catalog,
      militaryRegistry,
      surface,
      weatherClock,
    });
  } catch (error) {
    dispose();
    throw error;
  }
}
