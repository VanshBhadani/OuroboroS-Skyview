import { catalogControlServices } from './catalog.js';
import { StyleManager } from '../ui/composition.js';
import { flyToDisaster, flyToAustin } from '../camera.js';
import { initCockpitCloudEffects } from '../cockpitCloudEffects.js';

/** Construct the existing controls and camera presentation. */
export function createApplicationControls({
  scene: { viewer, mapStackController, operations },
  loaderStatus,
  Controls = StyleManager,
  services,
  catalog,
  placeSearch,
  defer,
}) {
  // Initialize the style manager (post-processing, HUD, locations, share links)
  const styleManager = new Controls(viewer, {
    services: {
      ...services,
      ...operations.surface.controlServices,
      searchAndFlyTo: operations.searchAndFlyTo,
      fetchRegionalBrief: (...args) =>
        operations.requests.regional.getBrief(...args),
      ...catalogControlServices(catalog),
    },
    requestServices: operations.requests,
    mapStackController,
    placeSearch,
  });
  defer(() => styleManager.orbitController.stop());
  defer(() => styleManager.hud.destroy());
  defer(() => styleManager.dispose());
  // The previous multi-canvas weather compositor remains disabled. Cockpit
  // clouds use a separate, capped low-resolution GPU pass that never attaches
  // Cesium fog or post-process stages and is fully stopped in map mode.
  const weatherEffects = null;
  const cockpitCloudEffects = initCockpitCloudEffects(viewer, {
    weatherService: operations.requests.weather,
  });
  defer(() => cockpitCloudEffects?.destroy());

  // DISASTERLENS Default Navigation: fly directly to the active incident (Nepal Flood Basin)
  const hash = typeof window !== 'undefined' ? window.location.hash : '';
  const isAustinHash = hash.includes('lat=30.') || hash.includes('lon=-97.');

  if (!styleManager.hasShareState || isAustinHash) {
    loaderStatus.textContent = 'Navigating to Nepal Flood Incident...';
    defer(flyToDisaster(viewer));
  } else {
    loaderStatus.textContent = 'Restoring incident view...';
  }

  // Hook incident pill click to re-focus on the disaster basin
  if (typeof document !== 'undefined') {
    const incidentPill = document.getElementById('dl-incident-pill');
    if (incidentPill) {
      const handleIncidentClick = () => {
        flyToDisaster(viewer, 2.0);
      };
      incidentPill.addEventListener('click', handleIncidentClick);
      defer(() => incidentPill.removeEventListener('click', handleIncidentClick));
    }
  }

  return { styleManager, weatherEffects, cockpitCloudEffects };
}
