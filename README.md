# EcoSite Ranger — Outdoor Site Reporting & Maintenance App

A mobile-first React Native (Expo) field reporting application designed for parks, campuses, utility networks, and large outdoor sites. Rangers and field staff can log wildlife sightings, fly-tipping, infrastructure faults, maintenance tasks, and geological/archaeological findings with full offline persistence and multi-sensor hardware integration.

## Key Features & Device APIs
- **Geolocation API (`expo-location`):** Captures GPS coordinates (`latitude`, `longitude`, accuracy radius) and generates clickable OpenStreetMap links (`mapURL`).
- **Camera & Persistent Storage (`expo-camera`, `expo-image-picker`, `expo-file-system`):** Live rear viewfinder photo capture and photo library picker, persisted permanently to `FileSystem.documentDirectory`.
- **Compass & Accelerometer (`expo-sensors`):** Reads `Magnetometer` horizontal compass bearing (`0°–360°` + cardinal direction) and `Accelerometer` vertical pitch angle (`Pointing Up` / `Horizon/Level` / `Pointing Down`).
- **Contacts & Native SMS (`expo-contacts`, `expo-sms`):** Auto-routes reports to the correct recipients or allows selecting a recipient directly from device contacts, launching pre-filled SMS alerts with photo attachments.
- **Persistent On-Device CRUD (`@react-native-async-storage/async-storage`):** Full **Create, Read, Update, and Delete** support for site reports that saves data during app restarts.
- **Connection Monitoring & JSON Sync (`@react-native-community/netinfo`):** Real-time network detection paired with a manual **Offline Mode** simulation toggle, queuing reports locally as `Pending` and syncing JSON payloads via `fetch()` when online.

##Local Setup
1. Node.js (v18+) and the **Expo Go** app installed on an iOS or Android device.
2. **Clone the repository:**
   ```bash
   git clone [https://github.com/stankhumalo/EcoSite-Ranger.git](https://github.com/stankhumalo/EcoSite-Ranger.git)
   cd EcoSite-Ranger
