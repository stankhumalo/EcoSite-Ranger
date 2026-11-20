import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { getReports, createReport, updateReport, deleteReport } from './src/storage/reportStorage';
import { syncReportsToServer } from './src/utils/syncService';
import ReportForm from './src/components/ReportForm';
import ReportCard from './src/components/ReportCard';

//  FILTER_MAP pattern for clean filtering
const FILTER_MAP = {
  All: () => true,
  Open: (report) => report.status === 'Open',
  Resolved: (report) => report.status === 'Resolved',
};

const FILTER_NAMES = Object.keys(FILTER_MAP);

export default function App() {
  const [reports, setReports] = useState([]);
  const [editingReport, setEditingReport] = useState(null);
  const [filter, setFilter] = useState('All');

  // Connection API state (live NetInfo + manual Offline simulation toggle)
  const [deviceOnline, setDeviceOnline] = useState(true);
  const [simulateOffline, setSimulateOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const effectiveOnline = deviceOnline && !simulateOffline;

  useEffect(() => {
    loadReports();

    const unsubscribe = NetInfo.addEventListener((state) => {
      setDeviceOnline(Boolean(state.isConnected));
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const hasPending = reports.some((r) => r.syncStatus !== 'Synced');
    if (effectiveOnline && hasPending && !isSyncing) {
      handleSyncNow(true);
    }
  }, [effectiveOnline]);

  const loadReports = async () => {
    const saved = await getReports();
    setReports(saved);
  };

  const handleFormSubmit = async (formData) => {
    if (editingReport) {
      const updated = await updateReport(editingReport.id, {
        ...formData,
        syncStatus: 'Pending',
      });
      setReports(updated);
      setEditingReport(null);
    } else {
      const updated = await createReport(formData);
      setReports(updated);
    }
  };

  const handleToggleStatus = async (id, newStatus) => {
    const updated = await updateReport(id, { status: newStatus, syncStatus: 'Pending' });
    setReports(updated);
  };

  const handleDelete = async (id) => {
    const updated = await deleteReport(id);
    setReports(updated);
    if (editingReport?.id === id) setEditingReport(null);
  };

  const handleSyncNow = async (silent = false) => {
    setIsSyncing(true);
    try {
      const { syncedIds, message } = await syncReportsToServer(reports, effectiveOnline);
      if (syncedIds.length > 0) {
        let latest = reports;
        for (const id of syncedIds) {
          latest = await updateReport(id, { syncStatus: 'Synced' });
        }
        setReports(latest);
        if (!silent) Alert.alert('Sync Complete', message);
      } else if (!silent) {
        Alert.alert('Up to Date', message);
      }
    } catch (err) {
      if (!silent) Alert.alert('Offline Queue Active', err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const pendingCount = reports.filter((r) => r.syncStatus !== 'Synced').length;
  const filteredReports = reports.filter(FILTER_MAP[filter]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1B4332" />

      {/* Header + Connection API Status Bar */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>EcoSite Ranger</Text>
            <Text style={styles.headerSub}>Outdoor Site Incident & Survey Log</Text>
          </View>
          <View style={[styles.netPill, effectiveOnline ? styles.netOnline : styles.netOffline]}>
            <Text style={styles.netPillText}>
              {effectiveOnline ? 'ONLINE' : 'OFFLINE'}
            </Text>
          </View>
        </View>

        <View style={styles.syncBar}>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Offline Mode:</Text>
            <Switch
              value={simulateOffline}
              onValueChange={setSimulateOffline}
              trackColor={{ false: '#40916C', true: '#F59E0B' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <TouchableOpacity
            style={[styles.syncBtn, !effectiveOnline && styles.syncBtnDisabled]}
            onPress={() => handleSyncNow(false)}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#1B4332" />
            ) : (
              <Text style={styles.syncBtnText}>
                Sync JSON ({pendingCount} Pending)
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ReportForm
          onSubmit={handleFormSubmit}
          editingReport={editingReport}
          onCancelEdit={() => setEditingReport(null)}
        />

        {/* Filter Bar (All / Open / Resolved ) */}
        <View style={styles.filterHeader}>
          <Text style={styles.sectionTitle}>
            Field Logs ({filteredReports.length} of {reports.length})
          </Text>
          <View style={styles.filterRow}>
            {FILTER_NAMES.map((name) => {
              const count = reports.filter(FILTER_MAP[name]).length;
              const isSelected = filter === name;
              return (
                <TouchableOpacity
                  key={name}
                  style={[styles.filterPill, isSelected && styles.filterPillSelected]}
                  onPress={() => setFilter(name)}
                >
                  <Text style={[styles.filterText, isSelected && styles.filterTextSelected]}>
                    {name} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {filteredReports.length === 0 ? (
          <Text style={styles.emptyText}>
            {reports.length === 0
              ? 'No incidents logged yet. Add one above.'
              : `No logs match the "${filter}" filter.`}
          </Text>
        ) : (
          filteredReports.map((item) => (
            <ReportCard
              key={item.id}
              report={item}
              onToggleStatus={handleToggleStatus}
              onEdit={setEditingReport}
              onDelete={handleDelete}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: '#1B4332', padding: 16, paddingTop: 22 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 12, color: '#B7E4C7', marginTop: 2 },
  netPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  netOnline: { backgroundColor: '#10B981' },
  netOffline: { backgroundColor: '#EF4444' },
  netPillText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  syncBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2D6A4F',
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toggleLabel: { color: '#D8F3DC', fontSize: 12, fontWeight: '600' },
  syncBtn: {
    backgroundColor: '#D8F3DC',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  syncBtnDisabled: { opacity: 0.6 },
  syncBtnText: { color: '#1B4332', fontWeight: '700', fontSize: 12 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  filterHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  filterPillSelected: { backgroundColor: '#1B4332' },
  filterText: { fontSize: 12, fontWeight: '700', color: '#374151' },
  filterTextSelected: { color: '#FFFFFF' },
  emptyText: { textAlign: 'center', color: '#6B7280', marginTop: 20, fontSize: 14 },
});