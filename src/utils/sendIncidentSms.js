import * as SMS from 'expo-sms';
import { Alert } from 'react-native';

const DEPARTMENT_PHONES = {
  'Environmental Team': '07700900101',
  'Waste & Grounds': '07700900102',
  'Estates Maintenance': '07700900103',
  'Site Operations': '07700900104',
  'Heritage & Survey': '07700900105',
};

export const sendIncidentSms = async (report) => {
  try {
    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert(
        'SMS Unavailable',
        'SMS messaging is not supported on this device or simulator.'
      );
      return false;
    }

    const recipientNumber = report.recipientPhone || DEPARTMENT_PHONES[report.recipient] || '';
    const locationLine =
      report.location && !report.location.error
        ? `Location: ${report.location.latitude}, ${report.location.longitude} (${report.location.mapURL})`
        : 'Location: Not captured';

    const messageBody = [
      `[EcoSite Ranger Alert]`,
      `Category: ${report.category} (${report.recipient})`,
      `Incident: ${report.title}`,
      locationLine,
      report.orientation
        ? `Orientation: ${report.orientation.heading}° ${report.orientation.cardinal} (${report.orientation.pitchLabel})`
        : null,
      report.notes ? `Notes: ${report.notes}` : null,
      `Logged: ${new Date(report.createdAt).toLocaleString()}`,
    ]
      .filter(Boolean)
      .join('\n');

    const options = report.photoUri
      ? {
          attachments: {
            uri: report.photoUri,
            mimeType: 'image/jpeg',
            filename: `incident-${report.id}.jpg`,
          },
        }
      : undefined;

    const { result } = await SMS.sendSMSAsync(
      recipientNumber ? [recipientNumber] : [],
      messageBody,
      options
    );

    return result === 'sent';
  } catch (error) {
    console.error('Expo SMS Error:', error);
    Alert.alert('SMS Error', 'Could not launch the SMS composer.');
    return false;
  }
};

export default sendIncidentSms;
