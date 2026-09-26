import * as Cesium from 'cesium';

const PICK_PREFIX = 'disaster-zone:';

export function priorityColor(priority) {
  const p = String(priority || '').toUpperCase();
  switch (p) {
    case 'CRITICAL':
      return Cesium.Color.fromCssColorString('#ff2d55'); // Magenta/Crimson for Critical
    case 'HIGH':
      return Cesium.Color.fromCssColorString('#ff453a'); // Bright Red/Amber
    case 'MODERATE':
    case 'MEDIUM':
      return Cesium.Color.fromCssColorString('#ff9f0a'); // Orange/Amber
    case 'LOW':
    default:
      return Cesium.Color.fromCssColorString('#30d158'); // Green
  }
}

export function createDisasterIntelRenderer({ viewer, onSelectZone }) {
  const dataSource = new Cesium.CustomDataSource('disaster-intelligence');
  dataSource.show = false;
  viewer.dataSources.add(dataSource);

  const zonesById = new Map();
  let clickHandler = null;

  function renderZones(zones) {
    dataSource.entities.removeAll();
    zonesById.clear();

    for (const zone of zones) {
      zonesById.set(zone.zoneId, zone);
      const color = priorityColor(zone.priority);
      const positions = zone.polygon.map(([lon, lat]) =>
        Cesium.Cartesian3.fromDegrees(lon, lat),
      );

      // 1. Clamped Polygon Zone
      dataSource.entities.add({
        id: `${PICK_PREFIX}${zone.zoneId}:polygon`,
        _disasterZoneId: zone.zoneId,
        polygon: {
          hierarchy: new Cesium.PolygonHierarchy(positions),
          material: new Cesium.ColorMaterialProperty(color.withAlpha(0.28)),
          classificationType: Cesium.ClassificationType.BOTH,
        },
        polyline: {
          positions,
          clampToGround: true,
          width: 3,
          material: new Cesium.ColorMaterialProperty(color.withAlpha(0.9)),
        },
      });

      // 2. Center Tactical Marker & Label
      const centerPos = Cesium.Cartesian3.fromDegrees(
        zone.longitude,
        zone.latitude,
      );

      dataSource.entities.add({
        id: `${PICK_PREFIX}${zone.zoneId}:marker`,
        _disasterZoneId: zone.zoneId,
        position: centerPos,
        point: {
          pixelSize: 10,
          color: color,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
        label: {
          text: `${zone.name}\nRISK: ${((zone.overallRisk ?? zone.fusedRisk ?? 0) * 100).toFixed(0)}% [${zone.riskClassification || zone.priority}]${zone.humanReviewRequired ? ' ⚠️' : ''}${zone.trend === 'RISING' ? ' ↗' : (zone.trend === 'FALLING' ? ' ↘' : '')}`,
          font: '600 11px "JetBrains Mono", monospace',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -12),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 180000),
        },
      });
    }
  }

  function setupPicking() {
    if (clickHandler || !viewer?.canvas) return;
    clickHandler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
    clickHandler.setInputAction((movement) => {
      if (!movement?.position) return;
      const picked = viewer.scene.pick(movement.position);
      const entity = picked?.id;
      const zoneId =
        entity?._disasterZoneId ||
        (typeof entity?.id === 'string' && entity.id.startsWith(PICK_PREFIX)
          ? entity.id.split(':')[1]
          : null);

      if (zoneId && zonesById.has(zoneId)) {
        const zone = zonesById.get(zoneId);
        if (typeof onSelectZone === 'function') {
          onSelectZone(zone);
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  function removePicking() {
    if (clickHandler) {
      clickHandler.destroy();
      clickHandler = null;
    }
  }

  function flyToZone(zoneId) {
    const zone = zonesById.get(zoneId);
    if (!zone || !viewer) return;

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        zone.longitude,
        zone.latitude,
        (zone.altitude || 1500) + 4000,
      ),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-50),
        roll: 0.0,
      },
      duration: 2.0,
    });
  }

  function setVisible(show) {
    dataSource.show = Boolean(show);
    if (show) {
      setupPicking();
    } else {
      removePicking();
    }
  }

  function destroy() {
    removePicking();
    zonesById.clear();
    if (!viewer.isDestroyed()) {
      viewer.dataSources.remove(dataSource, true);
    }
  }

  return {
    renderZones,
    setVisible,
    flyToZone,
    destroy,
    getZone: (id) => zonesById.get(id),
  };
}
