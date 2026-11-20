import { useState } from 'react';
import { Alert, Linking } from 'react-native';
import * as Location from 'expo-location';

export function useLocation() {
  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const geoFindMe = async () => {
    setLoadingLocation(true);
    try {
      // 1. Check if device Location Services are switched on at all
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert(
          'Location Services Off',
          'Turn on Location Services in iPhone Settings > Privacy & Security.'
        );
        setLocation({
          latitude: '##',
          longitude: '##',
          mapURL: '#',
          smsURL: '#',
          error: 'Device Location Services are turned off.',
        });
        return null;
      }

      // 2. Request foreground permission directly
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Needed',
          'Enable Location for Expo Go in Settings to tag GPS coordinates.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        setLocation({
          latitude: '##',
          longitude: '##',
          mapURL: '#',
          smsURL: '#',
          error: 'Location permission denied.',
        });
        return null;
      }

      // 3. Try fresh GPS fix with a 6-second timeout, falling back to last known position indoors
      let position = null;
      try {
        position = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('GPS timeout')), 6000)
          ),
        ]);
      } catch (timeoutErr) {
        position = await Location.getLastKnownPositionAsync();
      }

      if (!position) {
        throw new Error('No GPS fix available');
      }

      const latitude = Number(position.coords.latitude.toFixed(6));
      const longitude = Number(position.coords.longitude.toFixed(6));
      const accuracy = position.coords.accuracy ? Math.round(position.coords.accuracy) : null;
      const mapURL = `https://www.openstreetmap.org/#map=18/${latitude}/${longitude}`;
      const smsURL = `sms:?body=EcoSite Incident at ${mapURL}`;

      const locationData = {
        latitude,
        longitude,
        accuracy,
        mapURL,
        smsURL,
        error: '',
      };

      setLocation(locationData);
      return locationData;
    } catch (err) {
      Alert.alert(
        'GPS Signal Unavailable',
        'Could not get a GPS fix indoors. Try stepping near a window or check Settings.'
      );
      setLocation({
        latitude: '##',
        longitude: '##',
        mapURL: '#',
        smsURL: '#',
        error: 'Unable to retrieve GPS signal.',
      });
      return null;
    } finally {
      setLoadingLocation(false);
    }
  };

  return {
    location,
    setLocation,
    loadingLocation,
    geoFindMe,
  };
}
