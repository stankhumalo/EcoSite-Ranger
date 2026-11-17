import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@ecosite_ranger_reports_v1';

// READ: Load all saved reports from on-device AsyncStorage
export const getReports = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Failed to read reports from AsyncStorage:', error);
    return [];
  }
};

// CREATE: Add a new report and persist to storage
export const createReport = async (newReportData) => {
  try {
    const existing = await getReports();
    const report = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: 'Open', // 'Open' | 'Resolved'
      syncStatus: 'Pending', // 'Pending' | 'Synced'
      ...newReportData,
    };
    const updated = [report, ...existing];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Failed to create report:', error);
    throw error;
  }
};

// UPDATE: Edit an existing report (e.g., toggle Open/Resolved or edit notes)
export const updateReport = async (id, updates) => {
  try {
    const existing = await getReports();
    const updated = existing.map((item) =>
      item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
    );
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Failed to update report:', error);
    throw error;
  }
};

// DELETE: Remove a report permanently from storage
export const deleteReport = async (id) => {
  try {
    const existing = await getReports();
    const updated = existing.filter((item) => item.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Failed to delete report:', error);
    throw error;
  }
};