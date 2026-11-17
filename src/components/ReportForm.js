import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Contacts from 'expo-contacts';
import * as SMS from 'expo-sms';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocation } from '../hooks/useLocation';
import { useOrientationSensors } from '../hooks/useOrientationSensors';
import { savePhotoPermanently } from '../utils/photoStorage';

const CATEGORIES = [
  { label: 'Wildlife', recipient: 'Environmental Team', phone: '07700900101' },
  { label: 'Fly-tipping', recipient: 'Waste & Grounds', phone: '07700900102' },
  { label: 'Fault', recipient: 'Estates Maintenance', phone: '07700900103' },
  { label: 'Maintenance', recipient: 'Site Operations', phone: '07700900104' },
  { label: 'Geology/Arch.', recipient: 'Heritage & Survey', phone: '07700900105' },
];

export default function ReportForm({ onSubmit, editingReport, onCancelEdit }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Fault');
  const [customRecipient, setCustomRecipient] = useState(null); // { name, phone } from Contacts API
  const [notes, setNotes] = useState('');

  // Hardware Hook 1: Geolocation (expo-location)
  const { location, setLocation, loadingLocation, geoFindMe } = useLocation();

  // Hardware Hook 2: Compass & Accelerometer (expo-sensors)
  const { heading, cardinal, pitchLabel, tiltDegrees, sensorAvailable } =
    useOrientationSensors(true);
  const [savedOrientation, setSavedOrientation] = useState(null);

  // Hardware 3: Camera & Permanent FileSystem Storage
  const [cameraOpen, setCameraOpen] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  useEffect(() => {
    if (editingReport) {
      setTitle(editingReport.title);
      setCategory(editingReport.category);
      setCustomRecipient(
        editingReport.recipientPhone
          ? { name: editingReport.recipient, phone: editingReport.recipientPhone }
          : null
      );
      setNotes(editingReport.notes || '');
      setLocation(editingReport.location || null);
      setSavedOrientation(editingReport.orientation || null);
      setPhotoUri(editingReport.photoUri || null);
    } else {
      resetForm();
    }
  }, [editingReport]);

  const resetForm = () => {
    setTitle('');
    setCategory('Fault');
    setCustomRecipient(null);
    setNotes('');
    setLocation(null);
    setSavedOrientation(null);
    setPhotoUri(null);
    setCameraOpen(false);
  };

  // Device API: Contacts API (pick recipient from device contacts)
  const handlePickContact = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Contacts Permission Denied',
          'Using default departmental routing instead.'
        );
        return;
      }

      const contact = await Contacts.presentContactPickerAsync();
      if (contact) {
        const phone =
          contact.phoneNumbers && contact.phoneNumbers.length > 0
            ? contact.phoneNumbers[0].number
            : '';
        setCustomRecipient({
          name: contact.name || 'Selected Contact',
          phone,
        });
      }
    } catch (err) {
      Alert.alert('Contacts Error', 'Could not open device contacts.');
    }
  };

  // Device API: Native Expo SMS quick-share for current GPS pin
  const handleSharePinSms = async () => {
    if (!location || location.error) return;
    try {
      const isAvailable = await SMS.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('SMS Unavailable', 'SMS is not supported on this device.');
        return;
      }
      const targetPhone = customRecipient?.phone ? [customRecipient.phone] : [];
      await SMS.sendSMSAsync(
        targetPhone,
        `[EcoSite Ranger GPS Pin]\n${title ? `Incident: ${title}\n` : ''}Map: ${location.mapURL}`
      );
    } catch (err) {
      Alert.alert('SMS Error', 'Unable to open SMS composer.');
    }
  };

  // Device API: Camera Viewfinder
  const handleOpenCamera = async () => {
    try {
      if (!cameraPermission?.granted) {
        const result = await requestCameraPermission();
        if (!result.granted) {
          Alert.alert('Permission Denied', 'Camera access is needed to capture site evidence.');
          return;
        }
      }
      setCameraOpen(true);
    } catch (err) {
      Alert.alert('Camera Error', 'Could not request camera permissions.');
    }
  };

  const capturePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.6 });
        const permanentUri = await savePhotoPermanently(photo.uri);
        setPhotoUri(permanentUri);
        // Automatically lock compass/accelerometer angle when photo is taken
        if (sensorAvailable && heading !== null) {
          setSavedOrientation({ heading, cardinal, pitchLabel, tiltDegrees });
        }
        setCameraOpen(false);
      } catch (err) {
        Alert.alert('Capture Error', 'Failed to capture and save photo.');
      }
    }
  };

  const pickFromAlbum = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow photo album access to attach an image.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.6,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const permanentUri = await savePhotoPermanently(result.assets[0].uri);
        setPhotoUri(permanentUri);
      }
    } catch (err) {
      Alert.alert('Gallery Error', 'Unable to open photo album.');
    }
  };

  const handleLockOrientation = () => {
    if (!sensorAvailable) {
      Alert.alert('Sensors Unavailable', 'Magnetometer/Accelerometer not detected on device.');
      return;
    }
    setSavedOrientation({
      heading: heading ?? 0,
      cardinal,
      pitchLabel,
      tiltDegrees,
    });
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter an incident title first.');
      return;
    }

    const selectedCat = CATEGORIES.find((c) => c.label === category);
    const finalRecipient = customRecipient
      ? customRecipient.name
      : selectedCat?.recipient || 'General Ops';
    const finalPhone = customRecipient
      ? customRecipient.phone
      : selectedCat?.phone || '';

    onSubmit({
      title: title.trim(),
      category,
      recipient: finalRecipient,
      recipientPhone: finalPhone,
      notes: notes.trim(),
      location,
      orientation: savedOrientation,
      photoUri,
    });

    if (!editingReport) {
      resetForm();
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>
        {editingReport ? 'Edit Site Report' : 'Log New Site Incident'}
      </Text>

      <Text style={styles.label}>Incident Title *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Eroded footpath / Rare orchid sighting"
        value={title}
        onChangeText={setTitle}
      />

      {/* CATEGORY & CONTACTS API ROUTING */}
      <Text style={styles.label}>Category & Recipient Routing (Contacts API)</Text>
      <View style={styles.categoryRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.label}
            style={[styles.chip, category === cat.label && styles.chipSelected]}
            onPress={() => {
              setCategory(cat.label);
              setCustomRecipient(null);
            }}
          >
            <Text style={[styles.chipText, category === cat.label && styles.chipTextSelected]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.recipientRow}>
        <Text style={styles.recipientText}>
          Recipient:{' '}
          <Text style={{ fontWeight: '700' }}>
            {customRecipient
              ? `${customRecipient.name} (${customRecipient.phone || 'No #'})`
              : CATEGORIES.find((c) => c.label === category)?.recipient}
          </Text>
        </Text>
        <TouchableOpacity style={styles.smallOutlineBtn} onPress={handlePickContact}>
          <Text style={styles.smallOutlineText}>Pick Contact</Text>
        </TouchableOpacity>
      </View>

      {/* DEVICE API 1 & 2: GEOLOCATION + EXPO SMS */}
      <Text style={styles.label}>1. Geolocation & Expo SMS API</Text>
      <View style={styles.hardwareBox}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={geoFindMe} disabled={loadingLocation}>
          {loadingLocation ? (
            <ActivityIndicator size="small" color="#1B4332" />
          ) : (
            <Text style={styles.secondaryBtnText}>
              {location && !location.error ? 'Refresh GPS Location' : 'Get GPS Location'}
            </Text>
          )}
        </TouchableOpacity>

        {location && !location.error && (
          <View style={styles.gpsDetails}>
            <Text style={styles.gpsSuccess}>
              Lat: {location.latitude} | Lng: {location.longitude}
              {location.accuracy ? ` (±${location.accuracy}m)` : ''}
            </Text>
            <View style={styles.linkRow}>
              <TouchableOpacity onPress={() => Linking.openURL(location.mapURL)}>
                <Text style={styles.linkText}>Open Map</Text>
              </TouchableOpacity>
              <Text style={styles.linkDivider}>|</Text>
              <TouchableOpacity onPress={handleSharePinSms}>
                <Text style={styles.linkText}>Share via Expo SMS</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {location?.error ? <Text style={styles.errorText}>{location.error}</Text> : null}
      </View>

      {/* DEVICE API 3 & 4: COMPASS & ACCELEROMETER (expo-sensors) */}
      <Text style={styles.label}>2. Compass & Accelerometer Sensors</Text>
      <View style={styles.hardwareBox}>
        {sensorAvailable ? (
          <>
            <Text style={styles.sensorLiveText}>
              Live Bearing: {heading !== null ? `${heading}° ${cardinal}` : 'Calibrating...'} | Tilt:{' '}
              {pitchLabel} ({tiltDegrees}°)
            </Text>
            <TouchableOpacity
              style={[styles.secondaryBtn, { marginTop: 6 }]}
              onPress={handleLockOrientation}
            >
              <Text style={styles.secondaryBtnText}>
                {savedOrientation ? 'Update Locked Orientation' : 'Lock Camera Orientation'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.errorText}>Hardware orientation sensors unavailable on device.</Text>
        )}

        {savedOrientation && (
          <Text style={styles.gpsSuccess}>
            Saved Angle: {savedOrientation.heading}° {savedOrientation.cardinal} •{' '}
            {savedOrientation.pitchLabel} ({savedOrientation.tiltDegrees}°)
          </Text>
        )}
      </View>

      {/* DEVICE API 5: CAMERA + FILE SYSTEM + PHOTO ALBUM */}
      <Text style={styles.label}>3. Camera API & Persistent FileSystem</Text>
      <View style={styles.hardwareBox}>
        {!cameraOpen && (
          <View style={styles.mediaBtnRow}>
            <TouchableOpacity style={[styles.secondaryBtn, { flex: 1 }]} onPress={handleOpenCamera}>
              <Text style={styles.secondaryBtnText}>Open Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.secondaryBtn, { flex: 1 }]} onPress={pickFromAlbum}>
              <Text style={styles.secondaryBtnText}>Photo Album</Text>
            </TouchableOpacity>
          </View>
        )}

        {cameraOpen && (
          <View style={styles.cameraContainer}>
            <CameraView ref={cameraRef} style={styles.cameraPreview} facing="back" />
            <View style={styles.mediaBtnRow}>
              <TouchableOpacity style={[styles.captureBtn, { flex: 1 }]} onPress={capturePhoto}>
                <Text style={styles.captureBtnText}>Capture & Save Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelSmallBtn, { flex: 1 }]}
                onPress={() => setCameraOpen(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {photoUri && !cameraOpen && (
          <View style={styles.previewWrapper}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} />
            <TouchableOpacity onPress={() => setPhotoUri(null)} style={styles.removePhotoBtn}>
              <Text style={styles.removePhotoText}>Remove Photo</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Text style={styles.label}>Field Notes</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe hazard severity, species, or access details..."
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>
            {editingReport ? 'Update Report' : 'Save Report'}
          </Text>
        </TouchableOpacity>

        {editingReport && (
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancelEdit}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  heading: { fontSize: 18, fontWeight: '700', color: '#1B4332', marginBottom: 10 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    backgroundColor: '#F9FAFB',
  },
  textArea: { height: 70, textAlignVertical: 'top' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, backgroundColor: '#E5E7EB' },
  chipSelected: { backgroundColor: '#2D6A4F' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  chipTextSelected: { color: '#FFFFFF' },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  recipientText: { fontSize: 12, color: '#374151', flex: 1 },
  smallOutlineBtn: {
    borderWidth: 1,
    borderColor: '#2D6A4F',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  smallOutlineText: { fontSize: 12, fontWeight: '700', color: '#2D6A4F' },
  hardwareBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    padding: 10,
  },
  mediaBtnRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  secondaryBtn: {
    backgroundColor: '#D8F3DC',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryBtnText: { color: '#1B4332', fontWeight: '700', fontSize: 13 },
  sensorLiveText: { fontSize: 12, fontWeight: '600', color: '#1F2937' },
  gpsDetails: { marginTop: 8 },
  gpsSuccess: { marginTop: 6, fontSize: 12, fontWeight: '700', color: '#166534' },
  linkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 10 },
  linkText: { color: '#1D4ED8', fontWeight: '700', textDecorationLine: 'underline', fontSize: 13 },
  linkDivider: { color: '#9CA3AF' },
  errorText: { marginTop: 6, fontSize: 12, color: '#B91C1C', fontWeight: '600' },
  cameraContainer: { width: '100%' },
  cameraPreview: { width: '100%', height: 220, borderRadius: 8, overflow: 'hidden' },
  captureBtn: {
    backgroundColor: '#1B4332',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  captureBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  cancelSmallBtn: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  previewWrapper: { marginTop: 10, alignItems: 'center' },
  previewImage: { width: '100%', height: 160, borderRadius: 8, resizeMode: 'cover' },
  removePhotoBtn: { marginTop: 6 },
  removePhotoText: { color: '#B91C1C', fontSize: 12, fontWeight: '600' },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  saveBtn: {
    flex: 1,
    backgroundColor: '#2D6A4F',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
  },
  cancelBtnText: { color: '#374151', fontWeight: '600' },
});