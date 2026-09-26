const CONTROL_LAYER_IDS = Object.freeze({
  trafficLayer: 'traffic',
  flightsLayer: 'flights',
  militaryFlightsLayer: 'military',
  satellitesLayer: 'satellites',
  cctvLayer: 'cctv',
  radioLayer: 'radio',
  bikeshareLayer: 'bikeshare',
  transitLayer: 'transit',
  aisLiveVesselsLayer: 'ais-live-vessels',
  militaryAwarenessLayer: 'military-awareness',
  militaryInstallationsLayer: 'military-installations',
  rocketLaunchesLayer: 'rocket-launches',
  localAdsbLayer: 'local-adsb',
});

/** Capture the ordered application instances and their serialization metadata. */
export function createLayerCatalog(layers, metadata) {
  if (!Array.isArray(layers) || !Array.isArray(metadata))
    throw new TypeError(
      'Layer instances and serialization metadata are required',
    );
  const byId = new Map();
  for (const layer of layers) {
    if (typeof layer?.id !== 'string' || !layer.id || byId.has(layer.id))
      throw new TypeError(`Invalid or duplicate catalog layer: ${layer?.id}`);
    byId.set(layer.id, layer);
  }
  const ids = new Set();
  for (const entry of metadata) {
    if (!byId.has(entry?.id) || ids.has(entry.id))
      throw new TypeError(
        `Unmatched or duplicate catalog metadata: ${entry?.id}`,
      );
    ids.add(entry.id);
  }
  if (ids.size !== byId.size)
    throw new TypeError('Catalog metadata is incomplete');
  return Object.freeze({
    layers: Object.freeze([...layers]),
    metadata: Object.freeze(
      metadata.map((entry) => Object.freeze({ ...entry })),
    ),
    get: (id) => byId.get(id),
  });
}

const NOOP_CONTROL_LAYER = Object.freeze({
  id: 'noop',
  name: '',
  getTrackedInfo: () => null,
  stopTracking: () => {},
  focusCamera: () => {},
  getContextSnapshot: () => null,
  formatAwarenessLabel: () => '',
  getParams: () => ({}),
  getRowControls: () => ({}),
  getDiagnostics: () => ({}),
  enable: () => {},
  disable: () => {},
  setParams: () => {},
});

/** Bind the current control surface to the exact instances registered by the app. */
export function catalogControlServices(catalog) {
  if (!catalog?.get)
    throw new TypeError('An application layer catalog is required');
  if (!catalog.get('traffic'))
    throw new TypeError('Control layer missing from catalog: traffic');
  return Object.fromEntries(
    Object.entries(CONTROL_LAYER_IDS).map(([role, id]) => {
      const layer = catalog.get(id) || NOOP_CONTROL_LAYER;
      return [role, layer];
    }),
  );
}
