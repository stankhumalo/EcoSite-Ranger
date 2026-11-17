import { useState } from 'react';
import * as Location from 'expo-location';

export function useLocation() {
  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const fetchCurrentLocation = async () => {
    setLoadingLocation(true);
    setLocationError(null);

    try {
      //  Request foreground location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied. Enter site area manually in notes.');
        setLoadingLocation(false);
        return null;
      }

      //  Fetch high accuracy GPS coordinates
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: Number(position.coords.latitude.toFixed(6)),
        longitude: Number(position.coords.longitude.toFixed(6)),
        accuracy: position.coords.accuracy ? Math.round(position.coords.accuracy) : null,
      };

      setLocation(coords);
      setLoadingLocation(false);
      return coords;
    } catch (error) {
      setLocationError('Unable to fetch GPS signal. Check device location services.');
      setLoadingLocation(false);
      return null;
    }
  };

  const clearLocation = () => {
    setLocation(null);
    setLocationError(null);
  };

  return {
    location,
    setLocation,
    loadingLocation,
    locationError,
    fetchCurrentLocation,
    clearLocation,
  };
}