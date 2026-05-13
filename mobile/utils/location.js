// ─── IMPORTS ───
// expo-location for GPS location access
import * as Location from 'expo-location';

// ─────────────────────────────────────────
// REQUEST LOCATION PERMISSION
// ─────────────────────────────────────────
// Asks user for location access permission
export async function requestLocationPermission() {
  try {
    // Request foreground location permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (err) {
    console.log('Location permission error:', err);
    return false;
  }
}

// ─────────────────────────────────────────
// GET CURRENT LOCATION
// ─────────────────────────────────────────
// Returns current GPS coordinates
export async function getCurrentLocation() {
  try {
    // Request permission first
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return null;

    // Get current position with high accuracy
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High
    });

    // Return coordinates
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy
    };

  } catch (err) {
    console.log('Get location error:', err);
    return null;
  }
}

// ─────────────────────────────────────────
// CALCULATE DISTANCE BETWEEN TWO POINTS
// ─────────────────────────────────────────
// Uses Haversine formula to calculate distance
// between two GPS coordinates in meters
export function calculateDistance(lat1, lon1, lat2, lon2) {
  // Earth radius in meters
  const R = 6371000;

  // Convert to radians
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  // Haversine formula
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Return distance in meters
  return Math.round(R * c);
}