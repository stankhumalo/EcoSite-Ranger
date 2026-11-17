import * as FileSystem from 'expo-file-system';

const PHOTO_DIR = `${FileSystem.documentDirectory}ecosite_photos/`;

export const savePhotoPermanently = async (tempUri) => {
  if (!tempUri) return null;
  if (tempUri.startsWith(PHOTO_DIR)) return tempUri;

  try {
    const dirInfo = await FileSystem.getInfoAsync(PHOTO_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
    }

    const filename = `site_${Date.now()}.jpg`;
    const permanentUri = `${PHOTO_DIR}${filename}`;
    await FileSystem.copyAsync({ from: tempUri, to: permanentUri });
    return permanentUri;
  } catch (error) {
    console.error('FileSystem photo save error:', error);
    return tempUri;
  }
};