/** Haversine distance in meters */
export function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

export function isInsideGeofence(lat, lng, branch) {
  const dist = distanceMeters(lat, lng, branch.lat, branch.lng)
  return { inside: dist <= branch.geofenceRadiusM, distanceM: dist }
}

/** Simulated locations relative to a branch */
export function simulateLocation(branch, inside) {
  if (inside) {
    return {
      lat: branch.lat + 0.00008,
      lng: branch.lng + 0.00005,
    }
  }
  // ~800m away — outside typical geofence
  return {
    lat: branch.lat + 0.008,
    lng: branch.lng + 0.006,
  }
}
